import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from alembic.config import Config
from alembic import command

from app.core.config import settings
from app.api.v1.api_router import api_router
from app.exceptions.handlers import register_exception_handlers
from app.schemas.common import ApiResponse

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-run Alembic Migration on startup (equivalent to Flyway in Java user-service)
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        root_dir = os.path.dirname(current_dir)
        alembic_ini_path = os.path.join(root_dir, "alembic.ini")
        if os.path.exists(alembic_ini_path):
            alembic_cfg = Config(alembic_ini_path)
            command.upgrade(alembic_cfg, "head")
            print(">> [Alembic] Da tu dong cap nhat CSDL ai_service_db len phien ban moi nhat.")
    except Exception as e:
        print(f">> [Alembic Notice] Khong the chay tu dong migration hoac da o phien ban moi nhat: {e}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="2.0.0",
    description="Microservice gợi ý tài liệu học thuật, luyện thi trắc nghiệm AI và hỏi đáp RAG",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Global Exception Handlers
register_exception_handlers(app)

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Root endpoint for quick uptime check
@app.get("/", response_model=ApiResponse[dict], tags=["Root"])
def root():
    return ApiResponse.ok(
        data={"service": "recommendation-service", "status": "UP", "version": "2.0.0"},
        message="Recommendation & AI Service (Python FastAPI) đang hoạt động ổn định"
    )
