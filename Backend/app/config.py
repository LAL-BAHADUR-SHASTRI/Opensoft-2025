import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # Server settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8000))
    
    # Database settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./database.db")
    SQL_DEBUG: bool = os.getenv("SQL_DEBUG", "False").lower() == "true"
    
    # App settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your_secret_key_here")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()