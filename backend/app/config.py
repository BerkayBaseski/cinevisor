"""
Application Configuration - Pydantic Settings
"""

from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    # App
    APP_ENV: str = "development"
    APP_NAME: str = "CineVisor"

    # Database
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/cinevisor"

    # JWT
    JWT_SECRET_KEY: str = "your-super-secret-jwt-key"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # AWS S3
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "eu-central-1"
    S3_BUCKET: str = "cinevisor-videos"

    # CDN
    CDN_URL: str = ""

    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@cinevisor.com"

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000"

    # Upload
    MAX_UPLOAD_SIZE: int = 524288000  # 500MB
    UPLOAD_DIR: str = "./uploads"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


@lru_cache()
def get_settings():
    return Settings()
