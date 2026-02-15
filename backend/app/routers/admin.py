"""
Admin Router - Moderation endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Video, Report, User, Notification
from app.auth import get_admin_user

router = APIRouter()


class RejectRequest(BaseModel):
    reason: str = ""


@router.get("/pending")
async def get_pending_videos(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    videos = (
        db.query(Video)
        .filter(Video.status == "pending")
        .order_by(Video.created_at.desc())
        .all()
    )
    return {
        "success": True,
        "data": {
            "videos": [
                {
                    "id": v.id,
                    "title": v.title,
                    "type": v.type,
                    "owner_id": v.owner_id,
                    "owner_username": v.owner.username if v.owner else "unknown",
                    "created_at": str(v.created_at),
                }
                for v in videos
            ]
        }
    }


@router.post("/videos/{video_id}/approve")
async def approve_video(
    video_id: str,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    video.status = "approved"

    # Notify owner
    notif = Notification(
        user_id=video.owner_id,
        type="video_approved",
        message=f'Your video "{video.title}" has been approved!',
        reference_id=video.id,
    )
    db.add(notif)
    db.commit()

    return {"success": True, "message": "Video approved"}


@router.post("/videos/{video_id}/reject")
async def reject_video(
    video_id: str,
    req: RejectRequest,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    video.status = "rejected"

    # Notify owner
    notif = Notification(
        user_id=video.owner_id,
        type="video_rejected",
        message=f'Your video "{video.title}" was rejected. Reason: {req.reason or "No reason specified"}',
        reference_id=video.id,
    )
    db.add(notif)
    db.commit()

    return {"success": True, "message": "Video rejected"}


@router.get("/reports")
async def get_reports(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    reports = (
        db.query(Report)
        .filter(Report.status == "open")
        .order_by(Report.created_at.desc())
        .all()
    )
    return {
        "success": True,
        "data": {
            "reports": [
                {
                    "id": r.id,
                    "video_id": r.video_id,
                    "user_id": r.user_id,
                    "reason": r.reason,
                    "details": r.details,
                    "status": r.status,
                    "created_at": str(r.created_at),
                }
                for r in reports
            ]
        }
    }


@router.post("/reports/{report_id}/resolve")
async def resolve_report(
    report_id: str,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report.status = "resolved"
    db.commit()

    return {"success": True, "message": "Report resolved"}
