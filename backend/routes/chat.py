from fastapi import APIRouter, Depends, HTTPException
from database import get_db
import models
from deps import get_current_user
from ai_service import mentor_chat
from bson import ObjectId
from datetime import datetime

router = APIRouter()

def serialize_doc(doc: dict) -> dict:
    """Convert ObjectId fields to strings and handle legacy field mapping"""
    if not doc: return doc
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    if "full_name" in doc and not doc.get("username"):
        doc["username"] = doc["full_name"]
    return doc

@router.post("/", response_model=models.ChatLogDB)
async def execute_chat(req: models.ChatReq, current_user: models.UserDB = Depends(get_current_user)):
    print(f"\n[BACKEND] CHAT ROUTE HIT - User: {current_user.id}, Message: {req.message}", flush=True)
    db = get_db()
    student_id = current_user.id

    # Build context from student's weak subjects and assigned topic
    context_parts = []
    if current_user.assigned_topic:
        context_parts.append(f"Current assigned topic: {current_user.assigned_topic}.")
    if current_user.weak_subjects:
        context_parts.append(f"Weak subjects: {', '.join(current_user.weak_subjects)}.")
    context = " ".join(context_parts)

    response = ""
    status = "success"
    error_message = None

    try:
        response = await mentor_chat(student_id, req.message, context)
    except Exception as e:
        status = "failed"
        error_message = str(e)
        response = f"Technical Error Details: {str(e)}"
        print(f"DEBUG: Chatbot error for student {student_id}: {e}")

    chat_log = {
        "student_id": student_id,
        "message": req.message,
        "response": response,
        "status": status,
        "error_message": error_message,
        "timestamp": datetime.utcnow()
    }
    result = await db["chat_logs"].insert_one(chat_log)
    created = await db["chat_logs"].find_one({"_id": result.inserted_id})
    return models.ChatLogDB(**serialize_doc(created))
