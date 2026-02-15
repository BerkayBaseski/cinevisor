import urllib.request
import json
import sys

def verify():
    url = "http://localhost:8000/api/auth/token"
    data = {
        "username": "demo@cinevisor.com",
        "password": "password123"
    }
    encoded_data = urllib.parse.urlencode(data).encode('utf-8')
    req = urllib.request.Request(url, data=encoded_data, method='POST')
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                print("Login successful!")
                body = response.read().decode('utf-8')
                token = json.loads(body)["access_token"]
                print(f"Token: {token[:10]}...")
            else:
                print(f"Login failed with status: {response.status}")
    except urllib.error.HTTPError as e:
        print(f"Login failed: {e.code} {e.reason}")
        print(e.read().decode('utf-8'))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify()
