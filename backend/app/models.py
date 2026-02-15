"""
SQLAlchemy ORM Models
"""

from sqlalchemy import Column, String, Text, Boolean, Integer, BigInteger, DateTime, ForeignKey, UniqueConstraint, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="user")  # user, creator, moderator, admin
    avatar_url = Column(Text, nullable=True)
    bio = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    videos = relationship("Video", back_populates="owner", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="user")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class Video(Base):
    __tablename__ = "videos"

    id = Column(String, primary_key=True, default=generate_uuid)
    owner_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    tags = Column(JSON, default=[])
    type = Column(String, default="ai")  # ai, human
    s3_key = Column(String, nullable=True)
    thumbnail_url = Column(Text, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    size_bytes = Column(BigInteger, nullable=True)
    allow_download = Column(Boolean, default=False)
    status = Column(String, default="pending")  # pending, approved, rejected, deleted
    views = Column(BigInteger, default=0)
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    # AI-specific fields
    ai_model = Column(String, nullable=True)
    ai_prompt = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    owner = relationship("User", back_populates="videos")
    comments = relationship("Comment", back_populates="video", cascade="all, delete-orphan")
    video_likes = relationship("VideoLike", back_populates="video", cascade="all, delete-orphan")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(String, primary_key=True, default=generate_uuid)
    video_id = Column(String, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    likes_count = Column(Integer, default=0)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    video = relationship("Video", back_populates="comments")
    user = relationship("User", back_populates="comments")


class VideoLike(Base):
    __tablename__ = "video_likes"

    id = Column(String, primary_key=True, default=generate_uuid)
    video_id = Column(String, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("video_id", "user_id", name="uq_video_user_like"),)

    # Relationships
    video = relationship("Video", back_populates="video_likes")


class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, default=generate_uuid)
    video_id = Column(String, ForeignKey("videos.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    reason = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    status = Column(String, default="open")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False)  # like, comment, follow, video_approved, video_rejected
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    reference_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="notifications")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String, unique=True, nullable=False)
    is_revoked = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)


class PasswordReset(Base):
    __tablename__ = "password_resets"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, nullable=False)
    token = Column(String, unique=True, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)


class Follow(Base):
    __tablename__ = "follows"

    id = Column(String, primary_key=True, default=generate_uuid)
    follower_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    following_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("follower_id", "following_id", name="uq_follower_following"),)


class Playlist(Base):
    __tablename__ = "playlists"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    is_public = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class PlaylistVideo(Base):
    __tablename__ = "playlist_videos"

    id = Column(String, primary_key=True, default=generate_uuid)
    playlist_id = Column(String, ForeignKey("playlists.id", ondelete="CASCADE"), nullable=False)
    video_id = Column(String, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    position = Column(Integer, default=0)
    added_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("playlist_id", "video_id", name="uq_playlist_video"),)
