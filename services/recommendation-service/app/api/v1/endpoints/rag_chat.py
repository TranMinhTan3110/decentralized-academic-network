from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_optional_current_user, CurrentUser
from app.schemas.common import ApiResponse
from app.schemas.chat import (
    CreateChatSessionRequest,
    ChatSessionResponse,
    AskQuestionRequest,
    ChatMessageResponse
)
from app.services.rag_service import RagService

router = APIRouter()

@router.post(
    "/sessions",
    response_model=ApiResponse[ChatSessionResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Khởi tạo phiên hỏi đáp AI mới gắn liền với tài liệu học tập"
)
def create_session(
    request: CreateChatSessionRequest,
    current_user: Optional[CurrentUser] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    service = RagService(db)
    user_id = current_user.id if current_user else None
    result = service.create_chat_session(user_id=user_id, req=request)
    return ApiResponse.ok(
        data=result,
        message="Khởi tạo phiên hỏi đáp tài liệu thành công"
    )

@router.post(
    "/{sessionId}/ask",
    response_model=ApiResponse[ChatMessageResponse],
    summary="Gửi câu hỏi tới Trợ lý AI và nhận câu trả lời kèm trích dẫn số trang"
)
def ask_question(
    sessionId: UUID,
    request: AskQuestionRequest,
    current_user: Optional[CurrentUser] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    service = RagService(db)
    user_id = current_user.id if current_user else None
    result = service.ask_question(user_id=user_id, session_id=sessionId, req=request)
    return ApiResponse.ok(
        data=result,
        message="Trợ lý AI đã trả lời câu hỏi"
    )

@router.get(
    "/{sessionId}/messages",
    response_model=ApiResponse[List[ChatMessageResponse]],
    summary="Lấy toàn bộ lịch sử trao đổi của phiên hỏi đáp"
)
def get_session_messages(
    sessionId: UUID,
    db: Session = Depends(get_db)
):
    service = RagService(db)
    result = service.get_messages(session_id=sessionId)
    return ApiResponse.ok(
        data=result,
        message="Lấy lịch sử hội thoại thành công"
    )
