from models import UserDB
from bson import ObjectId
import json

def test_model():
    mock_db_user = {
        "_id": ObjectId(),
        "username": "testuser",
        "email": "test@example.com",
        "role": "student",
        "password_hash": "hashed",
        "overall_average": 0.0,
        "risk_level": "low",
        "weak_subjects": [],
        "performance_summary": ""
    }
    print(f"Testing UserDB instantiation with: {mock_db_user}")
    try:
        user = UserDB(**mock_db_user)
        print("Success!")
        print(user.model_dump())
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    test_model()
