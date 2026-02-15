from app.database import SessionLocal
from app.models import User
from app.auth import hash_password

def check_user():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "demo@cinevisor.com").first()
        if user:
            print(f"User found: {user.email}, ID: {user.id}")
            print(f"Password Hash: {user.password_hash[:20]}...")
            print(f"Is Active: {user.is_active}")
        else:
            print("User demo@cinevisor.com NOT FOUND.")
    except Exception as e:
        print(f"Error checking user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_user()
