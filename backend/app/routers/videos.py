"""
Videos Router - CRUD, Upload (S3 presigned + local), Stream, Download
"""

import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.database import get_db
from app.models import Video, User, VideoLike
from app.auth import get_current_user, get_optional_user
from app.config import get_settings

router = APIRouter()
settings = get_settings()


# ==================== Schemas ====================

class VideoInitRequest(BaseModel):
    title: str
    description: str = ""
    tags: list[str] = []
    type: str = "ai"
    allow_download: bool = False
    ai_model: str = None
    ai_prompt: str = None

class VideoCompleteRequest(BaseModel):
    uploadId: str
    s3_key: str
    size_bytes: int = 0
    duration_seconds: int = 0


# ==================== Endpoints ====================

@router.get("")
async def list_videos(
    sort: str = Query("newest", regex="^(newest|popular|likes)$"),
    type: Optional[str] = Query(None, regex="^(ai|human)$"),
    q: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    page: int = Query(1, ge=1),
    owner: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Video).filter(Video.status == "approved")

    # Type filter
    if type:
        query = query.filter(Video.type == type)

    # Owner filter
    if owner:
        query = query.filter(Video.owner_id == owner)

    # Search
    if q:
        query = query.filter(Video.title.ilike(f"%{q}%"))

    # Sort
    if sort == "popular":
        query = query.order_by(desc(Video.views))
    elif sort == "likes":
        query = query.order_by(desc(Video.likes_count))
    else:
        query = query.order_by(desc(Video.created_at))

    # Pagination
    offset = (page - 1) * limit
    total = query.count()
    videos = query.offset(offset).limit(limit).all()

    return {
        "success": True,
        "data": {
            "videos": [
                {
                    "id": v.id,
                    "title": v.title,
                    "description": v.description,
                    "type": v.type,
                    "tags": v.tags or [],
                    "thumbnail_url": v.thumbnail_url,
                    "views": v.views,
                    "likes_count": v.likes_count,
                    "comments_count": v.comments_count,
                    "owner_id": v.owner_id,
                    "owner_username": v.owner.username if v.owner else "unknown",
                    "created_at": str(v.created_at),
                    "allow_download": v.allow_download,
                }
                for v in videos
            ],
            "total": total,
            "page": page,
            "limit": limit,
        }
    }


@router.get("/{video_id}")
async def get_video(
    video_id: str,
    user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    # Increment views
    video.views = (video.views or 0) + 1
    db.commit()

    # Check if user liked
    is_liked = False
    if user:
        is_liked = db.query(VideoLike).filter(
            VideoLike.video_id == video_id,
            VideoLike.user_id == user.id,
        ).first() is not None

    return {
        "success": True,
        "data": {
            "id": video.id,
            "title": video.title,
            "description": video.description,
            "type": video.type,
            "tags": video.tags or [],
            "s3_key": video.s3_key,
            "thumbnail_url": video.thumbnail_url,
            "duration_seconds": video.duration_seconds,
            "size_bytes": video.size_bytes,
            "views": video.views,
            "likes_count": video.likes_count,
            "comments_count": video.comments_count,
            "allow_download": video.allow_download,
            "status": video.status,
            "owner_id": video.owner_id,
            "owner_username": video.owner.username if video.owner else "unknown",
            "ai_model": video.ai_model,
            "ai_prompt": video.ai_prompt,
            "is_liked": is_liked,
            "created_at": str(video.created_at),
        }
    }


@router.post("/init")
async def init_upload(
    req: VideoInitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    video_id = str(uuid.uuid4())
    s3_key = f"videos/{current_user.id}/{video_id}.mp4"

    video = Video(
        id=video_id,
        owner_id=current_user.id,
        title=req.title,
        description=req.description,
        tags=req.tags,
        type=req.type,
        allow_download=req.allow_download,
        ai_model=req.ai_model,
        ai_prompt=req.ai_prompt,
        s3_key=s3_key,
        status="pending",
    )
    db.add(video)
    db.commit()

    # Generate presigned URL if S3 is configured
    presigned_url = None
    if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
        try:
            import boto3
            s3_client = boto3.client(
                "s3",
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION,
            )
            presigned_url = s3_client.generate_presigned_url(
                "put_object",
                Params={
                    "Bucket": settings.S3_BUCKET,
                    "Key": s3_key,
                    "ContentType": "video/mp4",
                },
                ExpiresIn=3600,
            )
        except Exception as e:
            print(f"S3 presigned URL generation failed: {e}")

    return {
        "success": True,
        "data": {
            "uploadId": video_id,
            "presignedUrl": presigned_url,
            "s3_key": s3_key,
        }
    }


@router.post("/complete")
async def complete_upload(
    req: VideoCompleteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    video = db.query(Video).filter(
        Video.id == req.uploadId,
        Video.owner_id == current_user.id,
    ).first()

    if not video:
        raise HTTPException(status_code=404, detail="Upload not found")

    video.size_bytes = req.size_bytes
    video.duration_seconds = req.duration_seconds
    video.status = "pending"
    db.commit()

    return {
        "success": True,
        "message": "Upload completed, pending review",
        "data": {"id": video.id},
    }


@router.post("/upload-local")
async def upload_local(
    video_file: UploadFile = File(..., alias="video"),
    title: str = Form(...),
    description: str = Form(""),
    tags: str = Form(""),
    type: str = Form("ai"),
    allow_download: bool = Form(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Local file upload (fallback when S3 is not configured)"""
    # Create upload directory
    upload_dir = os.path.join(settings.UPLOAD_DIR, current_user.id)
    os.makedirs(upload_dir, exist_ok=True)

    # Save file
    file_id = str(uuid.uuid4())
    file_path = os.path.join(upload_dir, f"{file_id}.mp4")

    with open(file_path, "wb") as f:
        content = await video_file.read()
        f.write(content)

    # Create video record
    video = Video(
        owner_id=current_user.id,
        title=title,
        description=description,
        tags=[t.strip() for t in tags.split(",") if t.strip()] if tags else [],
        type=type,
        allow_download=allow_download,
        s3_key=file_path,
        size_bytes=len(content),
        status="pending",
    )
    db.add(video)
    db.commit()
    db.refresh(video)

    return {
        "success": True,
        "message": "Video uploaded, pending review",
        "data": {"id": video.id},
    }


@router.get("/{video_id}/stream")
async def stream_video(video_id: str, db: Session = Depends(get_db)):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    # If S3, return signed URL
    if settings.AWS_ACCESS_KEY_ID and video.s3_key and not video.s3_key.startswith("./"):
        try:
            import boto3
            s3_client = boto3.client(
                "s3",
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION,
            )
            url = s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": settings.S3_BUCKET, "Key": video.s3_key},
                ExpiresIn=3600,
            )
            return {"success": True, "data": {"url": url}}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Stream error: {e}")

    # Local fallback
    return {"success": True, "data": {"url": f"/uploads/{video.s3_key}"}}


@router.get("/{video_id}/download")
async def download_video(
    video_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    if not video.allow_download:
        raise HTTPException(status_code=403, detail="Download not allowed for this video")

    # Similar to stream but with download disposition
    return {"success": True, "data": {"url": f"/api/videos/{video_id}/stream"}}


@router.delete("/{video_id}")
async def delete_video(
    video_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    if video.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    video.status = "deleted"
    db.commit()

    return {"success": True, "message": "Video deleted"}
