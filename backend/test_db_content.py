import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import json

async def check_students():
    uri = "mongodb://localhost:27017"
    client = AsyncIOMotorClient(uri)
    db = client.edumentor
    
    print("--- Students ---")
    async for s in db.users.find({"role": "student"}):
        # Convert ObjectId to string for printing
        s['_id'] = str(s['_id'])
        print(json.dumps(s, indent=2))
        
    print("\n--- Collections Status ---")
    collections = await db.list_collection_names()
    for coll in collections:
        count = await db[coll].count_documents({})
        print(f"{coll}: {count} documents")

if __name__ == "__main__":
    asyncio.run(check_students())
