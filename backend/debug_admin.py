import asyncio
import os
import sys

# Add the current directory to sys.path
sys.path.append(os.getcwd())

import models
from routes.admin import get_students, serialize_doc
from database import get_db

async def debug_get_students():
    print("Testing get_students() logic locally...")
    try:
        db = get_db()
        students_cursor = db["users"].find({"role": "student"})
        students = []
        async for s in students_cursor:
            print(f"Processing student: {s.get('email')} (OID: {s.get('_id')})")
            # Mimic the logic in admin.py
            doc = serialize_doc(s)
            try:
                # This is what might be failing
                user_obj = models.UserPublic(**doc)
                students.append(user_obj)
                print(f"  Successfully serialized: {user_obj.username}")
            except Exception as ve:
                print(f"  VALIDATION FAILED for {s.get('email')}: {ve}")
                import traceback
                traceback.print_exc()
        
        print(f"Total students processed: {len(students)}")
    except Exception as e:
        print(f"Outer failure: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_get_students())
