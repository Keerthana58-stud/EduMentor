import requests
import json

def test_registration():
    url = "http://localhost:8000/auth/register"
    data = {
        "username": "testuser_" + str(int(__import__('time').time())),
        "email": "test_" + str(int(__import__('time').time())) + "@example.com",
        "password": "password123",
        "role": "student"
    }
    print(f"Testing registration at {url} with data: {data}")
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
    except Exception as e:
        print(f"Registration request failed: {e}")

if __name__ == "__main__":
    test_registration()
