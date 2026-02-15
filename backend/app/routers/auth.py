"""
Authentication Router - Register, Login, Logout, Token Refresh, Password Reset
"""

from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
import uuid

from app.database import get_db
from app.models import User, RefreshToken, PasswordReset
from app.auth import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
    get_current_user,
)
from app.config import get_settings

router = APIRouter()
settings = get_settings()


# ==================== Schemas ====================

class RegisterRequest(BaseModel):
    email: str
    username: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class RefreshRequest(BaseModel):
    refresh_token: str

class LogoutRequest(BaseModel):
    refresh_token: str = None

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


# ==================== Endpoints ====================

@router.post("/register")
async def register(req: RegisterRequest, db: Session = Depends(get_db)):
    # Check if email exists
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Check if username exists
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    # Validate password
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    # Create user
    user = User(
        email=req.email,
        username=req.username,
        password_hash=hash_password(req.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "message": "Registration successful",
        "data": {
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "role": user.role,
            }
        }
    }


@router.post("/login")
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    # Create tokens
    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(data={"sub": user.id})

    # Store refresh token
    rt = RefreshToken(
        user_id=user.id,
        token=refresh_token,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(rt)
    db.commit()

    return {
        "success": True,
        "data": {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "role": user.role,
                "avatar_url": user.avatar_url,
                "bio": user.bio,
            }
        }
    }


@router.post("/refresh")
async def refresh_token(req: RefreshRequest, db: Session = Depends(get_db)):
    payload = decode_token(req.refresh_token)

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")

    # Check if token is revoked
    stored = db.query(RefreshToken).filter(
        RefreshToken.token == req.refresh_token,
        RefreshToken.is_revoked == False,
    ).first()

    if not stored:
        raise HTTPException(status_code=401, detail="Token revoked or not found")

    user_id = payload.get("sub")
    new_access_token = create_access_token(data={"sub": user_id})

    return {
        "success": True,
        "data": {
            "access_token": new_access_token,
        }
    }


@router.post("/logout")
async def logout(req: LogoutRequest, db: Session = Depends(get_db)):
    if req.refresh_token:
        stored = db.query(RefreshToken).filter(RefreshToken.token == req.refresh_token).first()
        if stored:
            stored.is_revoked = True
            db.commit()

    return {"success": True, "message": "Logged out successfully"}


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "success": True,
        "data": {
            "id": current_user.id,
            "email": current_user.email,
            "username": current_user.username,
            "role": current_user.role,
            "avatar_url": current_user.avatar_url,
            "bio": current_user.bio,
            "created_at": str(current_user.created_at),
        }
    }


@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    # Always return success to prevent email enumeration
    if user:
        token = str(uuid.uuid4())
        pr = PasswordReset(
            email=req.email,
            token=token,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
        )
        db.add(pr)
        db.commit()
        # TODO: Send email with reset link

    return {"success": True, "message": "If the email exists, a reset link has been sent"}


@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    pr = db.query(PasswordReset).filter(
        PasswordReset.token == req.token,
        PasswordReset.used == False,
        PasswordReset.expires_at > datetime.now(timezone.utc),
    ).first()

    if not pr:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user = db.query(User).filter(User.email == pr.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = hash_password(req.new_password)
    pr.used = True
    db.commit()

    return {"success": True, "message": "Password reset successful"}
