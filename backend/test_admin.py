import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def find_admin():
    uri = "mongodb://localhost:27017"
    client = AsyncIOMotorClient(uri)
    db = client.edumentor
    
    admin = await db.users.find_one({"role": "admin"})
    if admin:
        print(f"Admin document: {admin}")
    else:
        print("No admin found")

if __name__ == "__main__":
    asyncio.run(find_admin())
