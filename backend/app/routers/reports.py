"""
Reports Router - Report videos
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Report, Video, User
from app.auth import get_current_user

router = APIRouter()


class ReportCreate(BaseModel):
    reason: str
    details: str = ""


@router.post("/videos/{video_id}/report")
async def report_video(
    video_id: str,
    req: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    # Check if user already reported
    existing = db.query(Report).filter(
        Report.video_id == video_id,
        Report.user_id == current_user.id,
        Report.status == "open",
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="You already reported this video")

    report = Report(
        video_id=video_id,
        user_id=current_user.id,
        reason=req.reason,
        details=req.details,
    )
    db.add(report)
    db.commit()

    return {"success": True, "message": "Report submitted"}
