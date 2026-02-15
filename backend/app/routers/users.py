"""
Users Router - Profile, Follow/Unfollow, Update
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import User, Follow
from app.auth import get_current_user, get_optional_user

router = APIRouter()


class ProfileUpdate(BaseModel):
    bio: str = None
    avatar_url: str = None


@router.get("/{user_id}")
async def get_user_profile(
    user_id: str,
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    followers_count = db.query(Follow).filter(Follow.following_id == user_id).count()
    following_count = db.query(Follow).filter(Follow.follower_id == user_id).count()

    is_following = False
    if current_user:
        is_following = db.query(Follow).filter(
            Follow.follower_id == current_user.id,
            Follow.following_id == user_id,
        ).first() is not None

    return {
        "success": True,
        "data": {
            "id": user.id,
            "username": user.username,
            "bio": user.bio,
            "avatar_url": user.avatar_url,
            "role": user.role,
            "followers_count": followers_count,
            "following_count": following_count,
            "is_following": is_following,
            "created_at": str(user.created_at),
        }
    }


@router.put("/profile")
async def update_profile(
    req: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if req.bio is not None:
        current_user.bio = req.bio
    if req.avatar_url is not None:
        current_user.avatar_url = req.avatar_url

    db.commit()

    return {
        "success": True,
        "message": "Profile updated",
        "data": {
            "bio": current_user.bio,
            "avatar_url": current_user.avatar_url,
        }
    }


@router.post("/{user_id}/follow")
async def follow_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    target = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.following_id == user_id,
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Already following")

    follow = Follow(follower_id=current_user.id, following_id=user_id)
    db.add(follow)
    db.commit()

    return {"success": True, "message": "Now following"}


@router.delete("/{user_id}/follow")
async def unfollow_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.following_id == user_id,
    ).first()

    if not existing:
        raise HTTPException(status_code=400, detail="Not following")

    db.delete(existing)
    db.commit()

    return {"success": True, "message": "Unfollowed"}
