from pydantic import BaseModel, Field, EmailStr, ConfigDict
from pydantic.functional_validators import BeforeValidator
from typing import List, Optional, Dict, Any, Annotated
from datetime import datetime
from bson import ObjectId

# Custom type that serializes ObjectId as string
def object_id_to_str(v: Any) -> Any:
    if isinstance(v, ObjectId):
        return str(v)
    return v

PyObjectId = Annotated[str, BeforeValidator(object_id_to_str)]

class UserBase(BaseModel):
    username: Optional[str] = None
    full_name: Optional[str] = None
    email: EmailStr
    role: str = "student"

class UserCreate(UserBase):
    password: str

class UserPublic(UserBase):
    """Returned to the client — no password_hash exposed"""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    overall_average: float = 0.0
    risk_level: str = "low"
    weak_subjects: List[str] = []
    performance_summary: str = ""
    assigned_topic: str = ""  # New: tracks the currently assigned topic

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

class UserDB(UserPublic):
    """Internal model that includes password_hash for auth"""
    password_hash: str = ""

    model_config = ConfigDict(populate_by_name=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class Question(BaseModel):
    question_text: str
    options: List[str]
    correct_answer: str

class QuizCreateReq(BaseModel):
    subject: str
    topic: str
    difficulty: str
    number_of_questions: int
    deadline: datetime
    assigned_to: List[str]

class QuizDB(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    title: str
    subject: str
    topic: str
    difficulty: str
    number_of_questions: int
    deadline: datetime
    assigned_to: List[str]
    questions: List[Question]
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(populate_by_name=True)

class QuizAttemptReq(BaseModel):
    answers: Dict[str, str]

class QuizAttemptDB(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    quiz_id: str
    student_id: str
    subject: str
    topic: str
    score: int
    total: int
    answers: Dict[str, str]
    submitted_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(populate_by_name=True)

class ChatReq(BaseModel):
    message: str

class ChatLogDB(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    student_id: str
    message: str
    response: str
    status: str = "success"  # "success" or "failed"
    error_message: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(populate_by_name=True)

class TopicSummary(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    topic: str
    subject: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(populate_by_name=True)

