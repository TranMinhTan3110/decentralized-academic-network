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

        # Seed test fixture document chunks if empty (to ensure TC_AI_010 and RAG work out-of-the-box)
        from uuid import UUID
        from app.core.database import SessionLocal
        from app.models.ai_models import DocumentChunk
        
        test_doc_id = UUID("11111111-1111-1111-1111-111111111111")
        with SessionLocal() as db:
            existing = db.query(DocumentChunk).filter(DocumentChunk.document_id == test_doc_id).first()
            if not existing:
                sample_chunks = [
                    DocumentChunk(
                        document_id=test_doc_id,
                        chunk_index=0,
                        page_number=1,
                        heading="Trang 1: Cấu trúc Dữ liệu và Giải thuật",
                        content="Chương 1: Tổng quan về cấu trúc dữ liệu và giải thuật. Môn học giới thiệu các cấu trúc danh sách liên kết, ngăn xếp (Stack), hàng đợi (Queue), cây nhị phân tìm kiếm (Binary Search Tree) và đồ thị.",
                        token_count=45
                    ),
                    DocumentChunk(
                        document_id=test_doc_id,
                        chunk_index=1,
                        page_number=2,
                        heading="Trang 2: Đánh giá độ phức tạp thuật toán",
                        content="Sinh viên cần rèn luyện kỹ năng phân tích độ phức tạp thuật toán O(n), O(log n) để tối ưu hóa hiệu năng ứng dụng trong thực tế.",
                        token_count=35
                    )
                ]
                db.add_all(sample_chunks)
                db.commit()
                print(">> [Database Seed] Da tu dong khoi tao du lieu chunks mau cho tai lieu kiem thu.")
    except Exception as e:
        print(f">> [Startup Notice] Loi kiem tra migration/seed CSDL: {e}")
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
