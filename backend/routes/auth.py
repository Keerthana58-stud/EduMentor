from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from database import get_db
import models
import utils
from deps import get_current_user

router = APIRouter()

@router.post("/register", response_model=models.UserPublic)
async def register(user: models.UserCreate):
    db = get_db()
    existing_user = await db["users"].find_one({"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    existing_email = await db["users"].find_one({"email": user.email})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = utils.get_password_hash(user.password)
    user_dict = user.model_dump()
    user_dict["password_hash"] = hashed_password
    del user_dict["password"]
    user_dict["overall_average"] = 0.0
    user_dict["risk_level"] = "low"
    user_dict["weak_subjects"] = []
    user_dict["performance_summary"] = ""

    result = await db["users"].insert_one(user_dict)
    created_user = await db["users"].find_one({"_id": result.inserted_id})
    return models.UserDB(**created_user)

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    db = get_db()
    user = await db["users"].find_one({"username": form_data.username})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not utils.verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = utils.create_access_token(
        data={"sub": user["username"], "role": user.get("role", "student")}
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user.get("role", "student")}

@router.get("/me", response_model=models.UserPublic)
async def read_users_me(current_user: models.UserDB = Depends(get_current_user)):
    return current_user
