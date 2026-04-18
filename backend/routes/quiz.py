from fastapi import APIRouter, Depends, HTTPException
from database import get_db
import models
from deps import get_current_user
from bson import ObjectId

router = APIRouter()

def serialize_doc(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

@router.get("/student/{student_id}")
async def get_student_quizzes(student_id: str, current_user: models.UserDB = Depends(get_current_user)):
    db = get_db()
    quizzes_cursor = db["quizzes"].find({"assigned_to": student_id})
    quizzes = []
    async for q in quizzes_cursor:
        quizzes.append(models.QuizDB(**serialize_doc(q)))
    return quizzes

@router.get("/{quiz_id}", response_model=models.QuizDB)
async def get_quiz(quiz_id: str, current_user: models.UserDB = Depends(get_current_user)):
    db = get_db()
    try:
        oid = ObjectId(quiz_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid quiz ID")
    quiz = await db["quizzes"].find_one({"_id": oid})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return models.QuizDB(**serialize_doc(quiz))

@router.post("/{quiz_id}/submit", response_model=models.QuizAttemptDB)
async def submit_quiz(
    quiz_id: str,
    attempt: models.QuizAttemptReq,
    current_user: models.UserDB = Depends(get_current_user),
):
    db = get_db()
    try:
        oid = ObjectId(quiz_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid quiz ID")

    quiz = await db["quizzes"].find_one({"_id": oid})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    # Check if already attempted
    existing = await db["quiz_attempts"].find_one({
        "quiz_id": quiz_id,
        "student_id": current_user.id,
    })
    if existing:
        raise HTTPException(status_code=400, detail="Quiz already submitted")

    # Auto-evaluate answers
    score = 0
    questions = quiz.get("questions", [])
    total = len(questions)
    for i, question in enumerate(questions):
        correct = question.get("correct_answer", "")
        student_answer = attempt.answers.get(str(i), "")
        if student_answer.strip() == correct.strip():
            score += 1

    attempt_dict = {
        "quiz_id": quiz_id,
        "student_id": current_user.id,
        "subject": quiz.get("subject", ""),
        "topic": quiz.get("topic", ""),
        "score": score,
        "total": total,
        "answers": attempt.answers,
    }
    result = await db["quiz_attempts"].insert_one(attempt_dict)
    created = await db["quiz_attempts"].find_one({"_id": result.inserted_id})
    return models.QuizAttemptDB(**serialize_doc(created))
