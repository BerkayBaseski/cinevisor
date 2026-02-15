"""
CineVisor Backend - FastAPI Application
AI Short Film Platform - Microservice Architecture
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Import routers
from app.routers import auth, videos, comments, likes, reports, admin, notifications, users, playlists

# Create FastAPI app
app = FastAPI(
    title="CineVisor API",
    description="AI Short Film Platform - Backend API",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(videos.router, prefix="/api/videos", tags=["Videos"])
app.include_router(comments.router, prefix="/api", tags=["Comments"])
app.include_router(likes.router, prefix="/api", tags=["Likes"])
app.include_router(reports.router, prefix="/api", tags=["Reports"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(playlists.router, prefix="/api/playlists", tags=["Playlists"])


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "success": True,
        "data": {
            "status": "healthy",
            "version": "2.0.0",
            "service": "CineVisor API",
        }
    }


@app.get("/")
async def root():
    """Root endpoint - API info"""
    return {
        "name": "CineVisor API",
        "version": "2.0.0",
        "docs": "/docs",
        "health": "/api/health",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
