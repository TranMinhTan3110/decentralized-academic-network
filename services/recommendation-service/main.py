import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from alembic.config import Config
from alembic import command

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Tu dong kiem tra va chay Alembic Migration khi FastAPI khoi dong (tuong tu Flyway trong Java)
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        alembic_ini_path = os.path.join(base_dir, "alembic.ini")
        if os.path.exists(alembic_ini_path):
            alembic_cfg = Config(alembic_ini_path)
            command.upgrade(alembic_cfg, "head")
            print(">> [Alembic] Da tu dong cap nhat CSDL ai_service_db len phien ban moi nhat.")
    except Exception as e:
        print(f">> [Canh bao Alembic] Khong the tu dong migration (PostgreSQL co the chua san sang): {e}")
    yield

# Khoi tao ung dung FastAPI
app = FastAPI(title="Recommendation & AI Service", lifespan=lifespan)

# API kiem tra trang thai he thong
@app.get("/")
def read_root():
    return {"message": "May chu AI bang Python da chay thanh cong"}

# API goi y tai lieu hoc thuat
@app.get("/api/ai/recommend")
def get_recommendations(user_id: str):
    return {
        "user_id": user_id,
        "recommended_documents": ["doc_123", "doc_456", "doc_789"]
    }
