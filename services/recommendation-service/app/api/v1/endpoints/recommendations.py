from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, CurrentUser
from app.schemas.common import ApiResponse
from app.schemas.recommendation import RecommendationResponse
from app.services.recommendation_service import RecommendationService

router = APIRouter()

@router.get(
    "/me",
    response_model=ApiResponse[RecommendationResponse],
    summary="Lấy danh sách tài liệu gợi ý cá nhân hóa cho sinh viên hiện tại"
)
def get_my_recommendations(
    university_id: Optional[str] = Query(None, description="Mã trường đại học để ưu tiên đề xuất"),
    major: Optional[str] = Query(None, description="Ngành/khoa học để ưu tiên đề xuất"),
    limit: int = Query(10, ge=1, le=50, description="Số lượng tài liệu đề xuất tối đa"),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = RecommendationService(db)
    result = service.get_personal_recommendations(
        user_id=current_user.id,
        university_id=university_id,
        major=major,
        limit=limit
    )
    return ApiResponse.ok(
        data=result,
        message="Lấy danh sách tài liệu gợi ý cá nhân hóa thành công"
    )

@router.get(
    "/trending",
    response_model=ApiResponse[RecommendationResponse],
    summary="Lấy danh sách tài liệu thịnh hành nhất toàn hệ thống"
)
def get_trending_documents(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    service = RecommendationService(db)
    result = service.get_trending_recommendations(limit=limit)
    return ApiResponse.ok(
        data=result,
        message="Lấy danh sách tài liệu thịnh hành thành công"
    )

@router.get(
    "/related/{documentId}",
    response_model=ApiResponse[RecommendationResponse],
    summary="Lấy danh sách các tài liệu liên quan đến một tài liệu cụ thể"
)
def get_related_documents(
    documentId: UUID,
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db)
):
    service = RecommendationService(db)
    result = service.get_related_recommendations(document_id=documentId, limit=limit)
    return ApiResponse.ok(
        data=result,
        message="Lấy danh sách tài liệu tương tự thành công"
    )
