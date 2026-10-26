from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.api.deps import get_db, get_current_user, CurrentUser
from app.schemas.common import ApiResponse

router = APIRouter()

@router.get("/", response_model=ApiResponse[dict])
def root_status():
    return ApiResponse.ok(
        data={"service": "recommendation-service", "status": "UP", "version": "2.0.0"},
        message="Recommendation & AI Service (Python FastAPI) đang hoạt động ổn định"
    )

@router.get("/health", response_model=ApiResponse[dict])
def health_check(db: Session = Depends(get_db)):
    db_status = "UP"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"DOWN: {str(e)}"

    return ApiResponse.ok(
        data={
            "service": "recommendation-service",
            "database": db_status,
            "status": "UP" if db_status == "UP" else "DEGRADED"
        },
        message="Hệ thống sẵn sàng tiếp nhận yêu cầu"
    )

@router.get("/me", response_model=ApiResponse[dict])
def get_my_profile(current_user: CurrentUser = Depends(get_current_user)):
    return ApiResponse.ok(
        data={
            "user_id": str(current_user.id),
            "email": current_user.email,
            "role": current_user.role
        },
        message="Xác thực danh tính người dùng thành công"
    )
