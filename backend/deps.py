from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from database import get_db, settings
import models

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if username is None:
            raise credentials_exception
        token_data = models.TokenData(username=username, role=role)
    except JWTError:
        raise credentials_exception

    db = get_db()
    user_data = await db["users"].find_one({"username": token_data.username})
    if user_data is None:
        raise credentials_exception
    # Convert ObjectId _id to string before building model
    user_data["_id"] = str(user_data["_id"])
    return models.UserDB(**user_data)

async def get_current_admin(current_user: models.UserDB = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user
