from fastapi import APIRouter, Depends, HTTPException
from database import get_db
import models
from deps import get_current_user
from ai_service import generate_performance_report
from bson import ObjectId

router = APIRouter()

def serialize_doc(doc: dict) -> dict:
    """Convert ObjectId fields to strings and handle legacy field mapping"""
    if not doc: return doc
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    if "full_name" in doc and not doc.get("username"):
        doc["username"] = doc["full_name"]
    if "username" not in doc:
        doc["username"] = "Unknown User"
    return doc

@router.get("/dashboard/{student_id}")
async def get_student_dashboard(student_id: str, current_user: models.UserDB = Depends(get_current_user)):
    print(f"\n[BACKEND] STUDENT DASHBOARD ROUTE HIT - Student: {student_id}, Context: {current_user.id}", flush=True)
    db = get_db()
    student = await db["users"].find_one({"_id": ObjectId(student_id), "role": "student"})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    quizzes_cursor = db["quizzes"].find({"assigned_to": student_id})
    assigned_quizzes = []
    async for q in quizzes_cursor:
        assigned_quizzes.append(models.QuizDB(**serialize_doc(q)))

    attempts_cursor = db["quiz_attempts"].find({"student_id": student_id})
    attempts = []
    async for a in attempts_cursor:
        attempts.append(models.QuizAttemptDB(**serialize_doc(a)))

    # Fetch assigned topic and its summary
    assigned_topic = student.get("assigned_topic", "")
    topic_summary = ""
    if assigned_topic:
        summary_doc = await db["summaries"].find_one({"topic": assigned_topic})
        if summary_doc:
            topic_summary = summary_doc.get("content", "")

    # Handle Performance Summary (mentoring)
    perf_summary = student.get("performance_summary", "")
    if not perf_summary and attempts:
        try:
            from ai_service import generate_performance_report
            perf_summary = await generate_performance_report(student, [a.model_dump() for a in attempts])
            await db["users"].update_one(
                {"_id": ObjectId(student_id)},
                {"$set": {"performance_summary": perf_summary}},
            )
        except Exception as e:
            print(f"Fallback: Performance summary generation failed: {e}")
            perf_summary = "Keep up the hard work! Review your quiz results to identify areas for improvement."

    return {
        "student": models.UserPublic(**serialize_doc(student)),
        "assigned_quizzes": assigned_quizzes,
        "attempts": attempts,
        "topic_summary": topic_summary,
        "performance_summary": perf_summary,
        "assigned_topic": assigned_topic
    }

@router.get("/analytics/{student_id}")
async def get_student_analytics(student_id: str, current_user: models.UserDB = Depends(get_current_user)):
    print(f"\n[BACKEND] STUDENT ANALYTICS ROUTE HIT - Student: {student_id}, Context: {current_user.id}", flush=True)
    db = get_db()
    student = await db["users"].find_one({"_id": ObjectId(student_id), "role": "student"})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    attempts_cursor = db["quiz_attempts"].find({"student_id": student_id})
    subject_scores: dict = {}
    subject_counts: dict = {}
    async for attempt in attempts_cursor:
        subj = attempt.get("subject", "General")
        score = attempt.get("score", 0)
        total = attempt.get("total", 1)
        pct = (score / total) * 100
        subject_scores[subj] = subject_scores.get(subj, 0) + pct
        subject_counts[subj] = subject_counts.get(subj, 0) + 1

    subject_wise_average = {k: v / subject_counts[k] for k, v in subject_scores.items()}
    weak_subjects = [k for k, v in subject_wise_average.items() if v < 60]
    overall_avg = sum(subject_wise_average.values()) / len(subject_wise_average) if subject_wise_average else 0

    risk_level = "low"
    if overall_avg < 40:
        risk_level = "high"
    elif overall_avg < 60:
        risk_level = "medium"

    await db["users"].update_one(
        {"_id": ObjectId(student_id)},
        {"$set": {"overall_average": overall_avg, "weak_subjects": weak_subjects, "risk_level": risk_level}},
    )

    return {
        "subject_wise_average": subject_wise_average,
        "weak_subjects": weak_subjects,
        "overall_average": overall_avg,
        "risk_level": risk_level,
    }
