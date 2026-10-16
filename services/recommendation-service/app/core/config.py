import os
from typing import List
from pydantic import BaseModel, Field

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
            "mySuperSecretKeyForJwtSigningThatIsAtLeast32BytesLong"
        )
    )
    JWT_ALGORITHM: str = "HS256"
    
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
    
    # AI Gemini API (optional external LLM, has built-in offline fallback logic)
    GEMINI_API_KEY: str = Field(
        default_factory=lambda: os.getenv("GEMINI_API_KEY", "")
    )

settings = Settings()
