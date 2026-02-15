"""
Database Initialization Script
Creates all tables defined in SQLAlchemy models.
"""

from app.database import engine, Base
from app.models import *  # Import all models to ensure they are registered

def init_db():
    print("Creating database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully!")
    except Exception as e:
        print(f"Error creating database tables: {e}")

if __name__ == "__main__":
    init_db()
