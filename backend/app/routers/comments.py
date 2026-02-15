"""
Comments Router - CRUD for video comments
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Comment, Video, User
from app.auth import get_current_user

router = APIRouter()


class CommentCreate(BaseModel):
    content: str


@router.get("/videos/{video_id}/comments")
async def get_comments(video_id: str, db: Session = Depends(get_db)):
    comments = (
        db.query(Comment)
        .filter(Comment.video_id == video_id, Comment.is_deleted == False)
        .order_by(Comment.created_at.desc())
        .all()
    )
    return {
        "success": True,
        "data": {
            "comments": [
                {
                    "id": c.id,
                    "video_id": c.video_id,
                    "user_id": c.user_id,
                    "username": c.user.username if c.user else "unknown",
                    "content": c.content,
                    "likes_count": c.likes_count,
                    "created_at": str(c.created_at),
                }
                for c in comments
            ]
        }
    }


@router.post("/videos/{video_id}/comments")
async def create_comment(
    video_id: str,
    req: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    comment = Comment(
        video_id=video_id,
        user_id=current_user.id,
        content=req.content,
    )
    db.add(comment)

    # Update comment count
    video.comments_count = (video.comments_count or 0) + 1
    db.commit()
    db.refresh(comment)

    return {
        "success": True,
        "data": {
            "id": comment.id,
            "content": comment.content,
            "username": current_user.username,
            "created_at": str(comment.created_at),
        }
    }


@router.delete("/comments/{comment_id}")
async def delete_comment(
    comment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    # Update video comment count
    video = db.query(Video).filter(Video.id == comment.video_id).first()
    if video:
        video.comments_count = max(0, (video.comments_count or 1) - 1)

    comment.is_deleted = True
    db.commit()

    return {"success": True, "message": "Comment deleted"}
