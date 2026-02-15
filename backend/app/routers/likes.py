"""
Likes Router - Like/Unlike videos
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import VideoLike, Video, User
from app.auth import get_current_user

router = APIRouter()


@router.post("/videos/{video_id}/like")
async def like_video(
    video_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    existing = db.query(VideoLike).filter(
        VideoLike.video_id == video_id,
        VideoLike.user_id == current_user.id,
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Already liked")

    like = VideoLike(video_id=video_id, user_id=current_user.id)
    db.add(like)
    video.likes_count = (video.likes_count or 0) + 1
    db.commit()

    return {"success": True, "message": "Video liked"}


@router.delete("/videos/{video_id}/like")
async def unlike_video(
    video_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = db.query(VideoLike).filter(
        VideoLike.video_id == video_id,
        VideoLike.user_id == current_user.id,
    ).first()

    if not existing:
        raise HTTPException(status_code=400, detail="Not liked yet")

    db.delete(existing)

    video = db.query(Video).filter(Video.id == video_id).first()
    if video:
        video.likes_count = max(0, (video.likes_count or 1) - 1)

    db.commit()

    return {"success": True, "message": "Like removed"}
