from motor.motor_asyncio import AsyncIOMotorClient
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
import os

ENV_FILE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))

class Settings(BaseSettings):
    mongodb_uri: str = "mongodb://localhost:27017"
    jwt_secret: str = "supersecret12345"
    groq_api_key: str = ""

    @field_validator("groq_api_key")
    @classmethod
    def strip_api_key(cls, v: str) -> str:
        return v.strip()

    model_config = SettingsConfigDict(
        env_file=ENV_FILE_PATH,
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

print(f"DEBUG: Exact absolute path of .env file loaded: {ENV_FILE_PATH}")
if settings.groq_api_key:
    print(f"DEBUG: GROQ_API_KEY exists at runtime. Length: {len(settings.groq_api_key)}, Safe preview: {settings.groq_api_key[:4]}***")
else:
    print("DEBUG: GROQ_API_KEY IS MISSING at runtime.")

client = AsyncIOMotorClient(settings.mongodb_uri)
db = client.edumentor

def get_db():
    return db
