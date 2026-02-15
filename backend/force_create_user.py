from app.database import SessionLocal
from app.models import User
from app.auth import hash_password

def create_user():
    db = SessionLocal()
    try:
        # Check if user exists
        existing_user = db.query(User).filter(User.email == "demo@cinevisor.com").first()
        if existing_user:
            print("User exists. Deleting...")
            db.delete(existing_user)
            db.commit()

        # Create new user
        print("Creating new user...")
        hashed_pw = hash_password("password123")
        new_user = User(
            email="demo@cinevisor.com",
            username="demo_user",
            password_hash=hashed_pw,
            is_active=True
        )
        db.add(new_user)
        db.commit()
        print("User demo@cinevisor.com created successfully with password 'password123'")
        
    except Exception as e:
        print(f"Error creating user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_user()
