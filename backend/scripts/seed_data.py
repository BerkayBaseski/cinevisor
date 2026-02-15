import httpx
import asyncio
import sys

BASE_URL = "http://localhost:8000/api"

async def seed():
    async with httpx.AsyncClient() as client:
        print("Attempting to register user...")
        
        # 1. Register
        user_data = {
            "email": "demo@cinevisor.com",
            "username": "demo_user",
            "password": "password123",
            "confirm_password": "password123"
        }
        
        try:
            response = await client.post(f"{BASE_URL}/auth/register", json=user_data)
            if response.status_code in (200, 201):
                print("User registered successfully!")
            elif response.status_code == 400 and "already exists" in response.text:
                 print("User already exists, proceeding to login.")
            else:
                print(f"Registration failed: {response.text}")
                return
        except Exception as e:
            print(f"Connection error during registration: {e}")
            return

        # 2. Login
        print("Logging in...")
        login_data = {
            "username": "demo@cinevisor.com",
            "password": "password123"
        }
        
        try:
            response = await client.post(f"{BASE_URL}/auth/token", data=login_data)
            if response.status_code != 200:
                print(f"Login failed: {response.text}")
                return
            
            token = response.json()["access_token"]
            print(f"Login successful! Token: {token[:10]}...")
        except Exception as e:
            print(f"Connection error during login: {e}")
            return

        # 3. Add Video
        print("Adding a sample video...")
        headers = {"Authorization": f"Bearer {token}"}
        video_data = {
            "title": "The AI Awakening",
            "description": "A short film generated entirely by AI.",
            "type": "ai",
            "ai_model": "Sora",
            "ai_prompt": "A robot discovering flowers for the first time",
            "tags": ["sci-fi", "robot", "nature"],
            "upload_type": "local"
        }
        
        try:
            response = await client.post(f"{BASE_URL}/videos/", json=video_data, headers=headers)
            if response.status_code in (200, 201):
                video = response.json()
                print(f"Video created successfully! ID: {video['id']}")
                print("Seed complete! You can now login with: demo@cinevisor.com / password123")
            else:
                print(f"Video creation failed: {response.text}")
        except Exception as e:
             print(f"Connection error during video creation: {e}")

if __name__ == "__main__":
    asyncio.run(seed())
