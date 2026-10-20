import os
from typing import List
from pydantic import BaseModel, Field

# Auto-load .env if present in service directory
_env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
if os.path.exists(_env_path):
    with open(_env_path, "r", encoding="utf-8") as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _k, _v = _line.split("=", 1)
                os.environ.setdefault(_k.strip(), _v.strip())

class Settings(BaseModel):
    PROJECT_NAME: str = "Recommendation & AI Service"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = Field(
        default_factory=lambda: os.getenv(
            "DATABASE_URL",
            "postgresql+psycopg://root:rootpassword@localhost:5432/ai_service_db"
        )
    )
    
    # Security / JWT (Shared secret with user-service)
    JWT_SECRET_KEY: str = Field(
        default_factory=lambda: os.getenv(
            "JWT_SECRET_KEY",
            "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970"
        )
    )
    JWT_ALGORITHM: str = "HS256"
    JWT_ALGORITHMS: List[str] = ["HS256", "HS512"]
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]
    
    # Kafka
    KAFKA_BOOTSTRAP_SERVERS: str = Field(
        default_factory=lambda: os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    )
    KAFKA_DOCUMENT_TOPIC: str = "document-events"
    
    # OpenAI & AI LLM API (optional external LLM, has built-in offline fallback logic)
    OPENAI_API_KEY: str = Field(
        default_factory=lambda: os.getenv("OPENAI_API_KEY", "")
    )
    GEMINI_API_KEY: str = Field(
        default_factory=lambda: os.getenv("GEMINI_API_KEY", "")
    )

settings = Settings()
