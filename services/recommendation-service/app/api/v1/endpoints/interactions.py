from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, CurrentUser
from app.schemas.common import ApiResponse
from app.schemas.interaction import LogInteractionRequest, InteractionResponse
from app.services.interaction_service import InteractionService

router = APIRouter()

@router.post(
    "/log",
    response_model=ApiResponse[InteractionResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Ghi nhận hành vi tương tác tài liệu của người dùng"
)
def log_interaction(
    request: LogInteractionRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = InteractionService(db)
    result = service.log_interaction(user_id=current_user.id, req=request)
    return ApiResponse.ok(
        data=result,
        message="Ghi nhận hành vi tương tác và tính điểm reward thành công"
    )
