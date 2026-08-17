from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Secure Leave Management API"
    ENV: str = "development"
    SECRET_KEY: str = "dev-secret-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    DATABASE_URL: str = "sqlite:///./leave_management.db"
    CORS_ORIGINS: str = "http://localhost:5173"
    MAX_FAILED_LOGINS: int = 5
    LOCKOUT_MINUTES: int = 15
    LOGIN_RATE_LIMIT: int = 10

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
