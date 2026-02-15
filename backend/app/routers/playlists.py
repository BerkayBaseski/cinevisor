"""
Playlists Router - CRUD for playlists and playlist videos
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Playlist, PlaylistVideo, Video, User
from app.auth import get_current_user

router = APIRouter()


class PlaylistCreate(BaseModel):
    title: str
    description: str = ""
    is_public: bool = True


class PlaylistVideoAdd(BaseModel):
    video_id: str


@router.get("")
async def get_user_playlists(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    playlists = (
        db.query(Playlist)
        .filter(Playlist.user_id == current_user.id)
        .order_by(Playlist.updated_at.desc())
        .all()
    )

    result = []
    for p in playlists:
        video_count = db.query(PlaylistVideo).filter(PlaylistVideo.playlist_id == p.id).count()
        result.append({
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "is_public": p.is_public,
            "video_count": video_count,
            "created_at": str(p.created_at),
        })

    return {"success": True, "data": {"playlists": result}}


@router.post("")
async def create_playlist(
    req: PlaylistCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    playlist = Playlist(
        user_id=current_user.id,
        title=req.title,
        description=req.description,
        is_public=req.is_public,
    )
    db.add(playlist)
    db.commit()
    db.refresh(playlist)

    return {
        "success": True,
        "data": {
            "id": playlist.id,
            "title": playlist.title,
        }
    }


@router.post("/{playlist_id}/videos")
async def add_video_to_playlist(
    playlist_id: str,
    req: PlaylistVideoAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    playlist = db.query(Playlist).filter(
        Playlist.id == playlist_id,
        Playlist.user_id == current_user.id,
    ).first()

    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")

    # Check if video exists
    video = db.query(Video).filter(Video.id == req.video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    # Check duplicate
    existing = db.query(PlaylistVideo).filter(
        PlaylistVideo.playlist_id == playlist_id,
        PlaylistVideo.video_id == req.video_id,
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Video already in playlist")

    max_pos = db.query(PlaylistVideo).filter(PlaylistVideo.playlist_id == playlist_id).count()
    pv = PlaylistVideo(
        playlist_id=playlist_id,
        video_id=req.video_id,
        position=max_pos,
    )
    db.add(pv)
    db.commit()

    return {"success": True, "message": "Video added to playlist"}


@router.delete("/{playlist_id}/videos/{video_id}")
async def remove_video_from_playlist(
    playlist_id: str,
    video_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    playlist = db.query(Playlist).filter(
        Playlist.id == playlist_id,
        Playlist.user_id == current_user.id,
    ).first()

    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")

    pv = db.query(PlaylistVideo).filter(
        PlaylistVideo.playlist_id == playlist_id,
        PlaylistVideo.video_id == video_id,
    ).first()

    if not pv:
        raise HTTPException(status_code=404, detail="Video not in playlist")

    db.delete(pv)
    db.commit()

    return {"success": True, "message": "Video removed from playlist"}


@router.delete("/{playlist_id}")
async def delete_playlist(
    playlist_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    playlist = db.query(Playlist).filter(
        Playlist.id == playlist_id,
        Playlist.user_id == current_user.id,
    ).first()

    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")

    db.delete(playlist)
    db.commit()

    return {"success": True, "message": "Playlist deleted"}
