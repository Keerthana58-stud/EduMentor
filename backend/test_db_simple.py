import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def count_all():
    uri = "mongodb://localhost:27017"
    client = AsyncIOMotorClient(uri)
    db = client.edumentor
    
    users_total = await db.users.count_documents({})
    students_total = await db.users.count_documents({"role": "student"})
    print(f"Total Users: {users_total}")
    print(f"Total Students: {students_total}")
    
    # List first 3 users
    print("\nFirst 3 users:")
    async for u in db.users.find().limit(3):
        print(f"Username: {u.get('username')}, Role: {u.get('role')}")

if __name__ == "__main__":
    asyncio.run(count_all())
