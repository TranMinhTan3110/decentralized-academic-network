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


def is_running_in_docker() -> bool:
    return (
        os.path.exists("/.dockerenv")
        or os.path.exists("/run/.containerenv")
        or os.getenv("RUNNING_IN_DOCKER", "").lower() in ("1", "true", "yes")
    )


def _resolve_service_env_url(env_key: str, local_default: str, docker_default: str) -> str:
    raw = os.getenv(env_key, "").strip().rstrip("/")
    in_docker = is_running_in_docker()
    if raw:
        # Trong container Docker của recommendation-service (cổng 8000), localhost:8081/8082/8080
        # trỏ vào chính container này thay vì các microservice khác -> tự chuyển sang service DNS của Docker.
        if in_docker and ("//localhost:" in raw or "//127.0.0.1:" in raw):
            return docker_default.rstrip("/")
        return raw
    return (docker_default if in_docker else local_default).rstrip("/")


def _resolve_kafka_bootstrap() -> str:
    raw = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "").strip()
    in_docker = is_running_in_docker()
    if raw:
        if in_docker and (raw.startswith("localhost:") or raw.startswith("127.0.0.1:")):
            return "kafka:9092"
        return raw
    return "kafka:9092" if in_docker else "localhost:9092"


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
    KAFKA_BOOTSTRAP_SERVERS: str = Field(default_factory=_resolve_kafka_bootstrap)
    KAFKA_DOCUMENT_TOPIC: str = "document-events"
    KAFKA_CONSUMER_ENABLED: bool = Field(
        default_factory=lambda: os.getenv("KAFKA_CONSUMER_ENABLED", "true").lower() in ("1", "true", "yes")
    )
    USER_SERVICE_URL: str = Field(
        default_factory=lambda: _resolve_service_env_url(
            "USER_SERVICE_URL", "http://localhost:8081", "http://user-service:8081"
        )
    )
    DOCUMENT_SERVICE_URL: str = Field(
        default_factory=lambda: _resolve_service_env_url(
            "DOCUMENT_SERVICE_URL", "http://localhost:8082", "http://document-service:8082"
        )
    )
    IPFS_GATEWAY_URL: str = Field(
        default_factory=lambda: _resolve_service_env_url(
            "IPFS_GATEWAY_URL", "http://localhost:8080/ipfs", "http://ipfs-kubo:8080/ipfs"
        )
    )
    PUBLIC_DOCUMENT_API_FALLBACK_URL: str = Field(
        default_factory=lambda: os.getenv(
            "PUBLIC_DOCUMENT_API_FALLBACK_URL", "https://dedocu.duckdns.org/doc"
        ).rstrip("/")
    )

    # OpenAI & Gemini LLM API (optional external LLM, has built-in offline fallback logic)
    OPENAI_API_KEY: str = Field(
        default_factory=lambda: os.getenv("OPENAI_API_KEY", "")
    )
    GEMINI_API_KEY: str = Field(
        default_factory=lambda: os.getenv("GEMINI_API_KEY", "")
    )

    def get_document_service_urls(self) -> List[str]:
        """
        Danh sách các endpoint ứng viên của document-service theo thứ tự ưu tiên.
        Khi chạy trong Docker trên EC2 (kể cả khi docker-compose chưa truyền biến môi trường
        hoặc khác bridge network), tự động thử qua tên service nội bộ, tên container và
        cổng reverse-proxy công khai để đảm bảo luôn truy vấn được kho học liệu thực.
        """
        urls: List[str] = []
        primary = (self.DOCUMENT_SERVICE_URL or "").strip().rstrip("/")
        if primary:
            urls.append(primary)

        if is_running_in_docker():
            for candidate in (
                "http://document-service:8082",
                "http://dev_document_service:8082",
                self.PUBLIC_DOCUMENT_API_FALLBACK_URL,
            ):
                cleaned = (candidate or "").strip().rstrip("/")
                if cleaned and cleaned not in urls:
                    urls.append(cleaned)

        return urls


settings = Settings()
