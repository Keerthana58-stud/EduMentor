from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, admin, student, quiz, chat

import logging
import time
from fastapi import Request

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api_requests")

app = FastAPI(title="EduMentor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for the public portfolio deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Incoming Request: {request.method} {request.url.path}")
    start_time = time.time()
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        logger.info(f"{request.client.host if request.client else 'unknown'}:{request.client.port if request.client else 'unknown'} - \"{request.method} {request.url.path} HTTP/1.1\" {response.status_code} OK (took {process_time:.4f}s)")
        return response
    except Exception as e:
        logger.error(f"Request Error unhandled: {str(e)}")
        raise

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(student.router, prefix="/api/student", tags=["student"])
app.include_router(quiz.router, prefix="/api/quiz", tags=["quiz"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])

@app.get("/")
def read_root():
    return {"message": "Welcome to EduMentor API"}

@app.get("/health")
def health_check():
    import os
    return {
        "status": "healthy",
        "environment": "production" if os.getenv("RENDER") else "development"
    }

@app.get("/debug-settings")
def debug_settings():
    import os
    from database import settings
    return {
        "mongodb": settings.mongodb_uri,
        "groq_prefix": settings.groq_api_key[:10] + "...",
        "env_path": os.path.abspath("../.env"),
        "exists": os.path.exists("../.env")
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
