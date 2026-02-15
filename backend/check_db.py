import sys
import os

# Create a small script to verify database tables
# This script must be run from the 'backend' directory so that 'app' module is found

try:
    from app.database import engine
    from sqlalchemy import inspect
    
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Tables found: {tables}")
    
    required_tables = ["videos", "users"]
    missing = [t for t in required_tables if t not in tables]
    
    if not missing:
        print("Database verification successful! All required tables present.")
    else:
        print(f"Database verification FAILED. Missing tables: {missing}")

except Exception as e:
    print(f"Error checking database: {e}")
