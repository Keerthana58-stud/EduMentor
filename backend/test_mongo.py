import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys

async def test_mongo():
    uri = "mongodb://localhost:27017"
    print(f"Testing connection to {uri}...")
    try:
        client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=2000)
        await client.admin.command('ping')
        print("MongoDB connection successful!")
        db = client.edumentor
        collections = await db.list_collection_names()
        print(f"Collections in 'edumentor': {collections}")
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(test_mongo())
