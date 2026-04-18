from fastapi import APIRouter, Depends, HTTPException
from typing import List
from database import get_db
import models
from deps import get_current_admin
from ai_service import generate_quiz, generate_topic_summary
from bson import ObjectId

router = APIRouter()

def serialize_doc(doc: dict) -> dict:
    """Convert ObjectId fields to strings and handle legacy field mapping"""
    if not doc: return doc
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    
    # Handle legacy 'full_name' mapping to 'username'
    if "full_name" in doc and not doc.get("username"):
        doc["username"] = doc["full_name"]
    
    # Ensure username is at least an empty string if missing
    if "username" not in doc:
        doc["username"] = "Unknown User"
        
    return doc

@router.get("/overview")
async def get_overview(current_user: models.UserDB = Depends(get_current_admin)):
    print(f"\n[BACKEND] ADMIN OVERVIEW ROUTE HIT - User: {current_user.id}", flush=True)
    db = get_db()
    total_students = await db["users"].count_documents({"role": "student"})
    total_quizzes = await db["quizzes"].count_documents({})
    completed_quizzes = await db["quiz_attempts"].count_documents({})
    at_risk_students = await db["users"].count_documents(
        {"role": "student", "risk_level": {"$in": ["medium", "high"]}}
    )
    return {
        "total_students": total_students,
        "total_quizzes": total_quizzes,
        "completed_quizzes": completed_quizzes,
        "at_risk_students": at_risk_students,
        "pending_quizzes": max(0, total_quizzes * total_students - completed_quizzes),
    }

@router.get("/students")
async def get_students(current_user: models.UserDB = Depends(get_current_admin)):
    print(f"\n[BACKEND] ADMIN STUDENTS ROUTE HIT - User: {current_user.id}", flush=True)
    db = get_db()
    students_cursor = db["users"].find({"role": "student"})
    students = []
    async for s in students_cursor:
        students.append(models.UserPublic(**serialize_doc(s)))
    return students

@router.get("/student-report/{student_id}")
async def get_student_report(student_id: str, current_user: models.UserDB = Depends(get_current_admin)):
    db = get_db()
    student = await db["users"].find_one({"_id": ObjectId(student_id)})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    attempts_cursor = db["quiz_attempts"].find({"student_id": student_id})
    attempts = []
    async for a in attempts_cursor:
        attempts.append(models.QuizAttemptDB(**serialize_doc(a)))
    return {
        "student": models.UserPublic(**serialize_doc(student)),
        "attempts": attempts,
    }

@router.get("/risk-students")
async def get_risk_students(current_user: models.UserDB = Depends(get_current_admin)):
    db = get_db()
    students_cursor = db["users"].find(
        {"role": "student", "risk_level": {"$in": ["medium", "high"]}}
    )
    students = []
    async for s in students_cursor:
        students.append(models.UserPublic(**serialize_doc(s)))
    return students

@router.get("/chat-logs")
async def get_chat_logs(current_user: models.UserDB = Depends(get_current_admin)):
    db = get_db()
    logs_cursor = db["chat_logs"].find().sort("timestamp", -1).limit(50)
    logs = []
    async for l in logs_cursor:
        logs.append(models.ChatLogDB(**serialize_doc(l)))
    return logs

@router.post("/assign-quiz", response_model=models.QuizDB)
async def assign_quiz(req: models.QuizCreateReq, current_user: models.UserDB = Depends(get_current_admin)):
    print(f"\n[BACKEND] ADMIN ASSIGN QUIZ ROUTE HIT - User: {current_user.id}, Subject: {req.subject}, Topic: {req.topic}", flush=True)
    # 1. Generate Quiz automatically
    try:
        quiz_data = await generate_quiz(req.subject, req.topic, req.difficulty, req.number_of_questions)
        if not quiz_data:
            raise ValueError("Quiz generation returned empty.")
    except Exception as e:
        print(f"\n\n\n=== EXTREMELY CRITICAL ERROR IN /assign-quiz ===")
        print(f"ERROR: {str(e)}")
        print(f"====================================================\n\n\n", flush=True)
        raise HTTPException(status_code=500, detail=str(e))

    # 2. Generate Topic Summary automatically
    summary_content = await generate_topic_summary(req.subject, req.topic)
    
    db = get_db()
    
    # 3. Save Quiz
    quiz_dict = {
        "title": quiz_data.get("title", f"{req.subject} - {req.topic} Quiz"),
        "subject": req.subject,
        "topic": req.topic,
        "difficulty": req.difficulty,
        "number_of_questions": req.number_of_questions,
        "deadline": req.deadline,
        "assigned_to": req.assigned_to,
        "questions": quiz_data.get("questions", []),
    }
    result = await db["quizzes"].insert_one(quiz_dict)
    
    # 4. Save Summary
    summary_dict = {
        "topic": req.topic,
        "subject": req.subject,
        "content": summary_content,
    }
    await db["summaries"].insert_one(summary_dict)

    # 5. Update assigned_topic for each student
    for student_id in req.assigned_to:
        await db["users"].update_one(
            {"_id": ObjectId(student_id)},
            {"$set": {"assigned_topic": req.topic}}
        )

    created_quiz = await db["quizzes"].find_one({"_id": result.inserted_id})
    return models.QuizDB(**serialize_doc(created_quiz))
