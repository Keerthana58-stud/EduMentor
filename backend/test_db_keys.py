import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_keys():
    uri = "mongodb://localhost:27017"
    client = AsyncIOMotorClient(uri)
    db = client.edumentor
    
    # Check the first user to see all keys
    user = await db.users.find_one()
    if user:
        print(f"Keys in user document: {list(user.keys())}")
        print(f"Full document: {user}")
    else:
        print("No users found")

if __name__ == "__main__":
    asyncio.run(check_keys())
