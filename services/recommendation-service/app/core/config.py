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


def _load_cors_origins() -> List[str]:
    default_origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://dedocu-dev.vercel.app",
        "https://dedocu.vercel.app",
        "https://dedocu.duckdns.org",
    ]
    raw_extra = os.getenv("CORS_ORIGINS", "")
    if raw_extra.strip():
        for item in raw_extra.split(","):
            cleaned = item.strip().rstrip("/")
            if cleaned and cleaned not in default_origins:
                default_origins.append(cleaned)
    return default_origins


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
    CORS_ORIGINS: List[str] = Field(default_factory=_load_cors_origins)

    # Kafka & Internal Microservices
    KAFKA_BOOTSTRAP_SERVERS: str = Field(
        default_factory=lambda: os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    )
    KAFKA_DOCUMENT_TOPIC: str = "document-events"
    KAFKA_CONSUMER_ENABLED: bool = Field(
        default_factory=lambda: os.getenv("KAFKA_CONSUMER_ENABLED", "true").lower() in ("1", "true", "yes")
    )
    USER_SERVICE_URL: str = Field(
        default_factory=lambda: os.getenv("USER_SERVICE_URL", "http://localhost:8081").rstrip("/")
    )
    DOCUMENT_SERVICE_URL: str = Field(
        default_factory=lambda: os.getenv("DOCUMENT_SERVICE_URL", "http://localhost:8082").rstrip("/")
    )
    IPFS_GATEWAY_URL: str = Field(
        default_factory=lambda: os.getenv("IPFS_GATEWAY_URL", "http://localhost:8080/ipfs").rstrip("/")
    )

    # OpenAI & Gemini LLM API (optional external LLM, has built-in offline fallback logic)
    OPENAI_API_KEY: str = Field(
        default_factory=lambda: os.getenv("OPENAI_API_KEY", "")
    )
    GEMINI_API_KEY: str = Field(
        default_factory=lambda: os.getenv("GEMINI_API_KEY", "")
    )


settings = Settings()
