from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Industrial Knowledge Intelligence Platform"
    API_V1_STR: str = "/api"

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/iki"
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None

    # AI/ML & Graph DB credentials (loaded for AI/ML module)
    NEO4J_URI: Optional[str] = None
    NEO4J_USERNAME: Optional[str] = None
    NEO4J_PASSWORD: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None

    # Auth
    JWT_SECRET: str = "default_hackathon_jwt_secret_key_change_me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # Scheduler
    FAILURE_SCAN_INTERVAL_HOURS: int = 6

    # Frontend / CORS
    VITE_API_BASE_URL: str = "http://localhost:5173"

    # Force mock mode or auto-detect
    MOCK_AI_ML: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

