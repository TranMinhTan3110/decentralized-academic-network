from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_optional_current_user, CurrentUser
from app.schemas.common import ApiResponse
from app.schemas.quiz import (
    GenerateQuizRequest,
    QuizDetailResponse,
    SubmitQuizRequest,
    QuizSubmissionResultResponse,
    QuizAttemptHistoryItem
)
from app.services.quiz_service import QuizService

router = APIRouter()

DEFAULT_GUEST_USER_ID = UUID("00000000-0000-0000-0000-000000000001")

@router.post(
    "/generate",
    response_model=ApiResponse[QuizDetailResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Tự động đọc nội dung tài liệu và sinh bộ câu hỏi trắc nghiệm AI"
)
def generate_quiz(
    request: GenerateQuizRequest,
    current_user: Optional[CurrentUser] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    service = QuizService(db)
    user_id = current_user.id if current_user else DEFAULT_GUEST_USER_ID
    result = service.generate_quiz(user_id=user_id, req=request)
    return ApiResponse.ok(
        data=result,
        message="Sinh bộ đề thi trắc nghiệm AI thành công từ nội dung tài liệu"
    )

@router.get(
    "/{quizId}",
    response_model=ApiResponse[QuizDetailResponse],
    summary="Lấy chi tiết đề thi trắc nghiệm phục vụ giao diện làm bài (ẩn đáp án đúng)"
)
def get_quiz_detail(
    quizId: UUID,
    db: Session = Depends(get_db)
):
    service = QuizService(db)
    result = service.get_quiz_for_taking(quiz_id=quizId)
    return ApiResponse.ok(
        data=result,
        message="Lấy dữ liệu đề thi trắc nghiệm thành công"
    )

@router.post(
    "/{quizId}/submit",
    response_model=ApiResponse[QuizSubmissionResultResponse],
    summary="Nộp bài thi trắc nghiệm, chấm điểm tự động và nhận giải thích chi tiết"
)
def submit_quiz_attempt(
    quizId: UUID,
    request: SubmitQuizRequest,
    current_user: Optional[CurrentUser] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    service = QuizService(db)
    user_id = current_user.id if current_user else DEFAULT_GUEST_USER_ID
    result = service.submit_quiz(user_id=user_id, quiz_id=quizId, req=request)
    return ApiResponse.ok(
        data=result,
        message="Chấm điểm bài làm hoàn tất"
    )

@router.get(
    "/history/me",
    response_model=ApiResponse[List[QuizAttemptHistoryItem]],
    summary="Lấy lịch sử các lượt làm bài kiểm tra trắc nghiệm của sinh viên hiện tại"
)
def get_my_quiz_history(
    current_user: Optional[CurrentUser] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    service = QuizService(db)
    user_id = current_user.id if current_user else DEFAULT_GUEST_USER_ID
    result = service.get_user_history(user_id=user_id)
    return ApiResponse.ok(
        data=result,
        message="Lấy lịch sử luyện thi trắc nghiệm thành công"
    )
