import uuid
from typing import List, Optional, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, status, UploadFile, File, Form
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
from app.services.text_extractor import TextExtractor
from app.models.ai_models import AIChatSession
from app.repositories.chat_repository import ChatSessionRepository

router = APIRouter()

@router.post(
    "/upload-source",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Tải lên tệp tài liệu học tập (PDF/TXT), tự động bóc tách chữ và băm Chunks cho phiên hỏi đáp"
)
async def upload_chat_source(
    file: UploadFile = File(...),
    sessionId: Optional[str] = Form(None),
    title: Optional[str] = Form(None),
    current_user: Optional[CurrentUser] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    service = RagService(db)
    session_repo = ChatSessionRepository(db)

    # 1. Resolve or create chat session
    session = None
    if sessionId:
        try:
            parsed_id = UUID(sessionId)
            session = session_repo.get_by_id(parsed_id)
        except Exception:
            session = None

    if not session:
        doc_id = uuid.uuid4()
        session_title = title or file.filename or "Phiên hỏi đáp tài liệu"
        session = session_repo.create(
            AIChatSession(
                id=uuid.uuid4(),
                user_id=current_user.id if current_user else None,
                document_id=doc_id,
                title=session_title
            )
        )

    # 2. Extract pages from file bytes
    file_bytes = await file.read()
    pages = TextExtractor.extract_from_bytes(file_bytes)
    if not pages or not any(p.get("text", "").strip() for p in pages):
        pages = [{"page_number": 1, "text": f"Tài liệu {file.filename}: {file_bytes.decode('utf-8', errors='ignore') or 'Nội dung bài giảng học thuật.'}"}]

    # 3. Process & chunk document
    result = service.process_and_chunk_document(
        document_id=session.document_id,
        title=file.filename,
        pages=pages,
        skip_validation=True,
        clear_existing=False
    )

    return ApiResponse.ok(
        data={
            "session_id": str(session.id),
            "document_id": str(session.document_id),
            "file_name": file.filename,
            "total_chunks": result.total_chunks,
            "pages_count": len(pages),
            "preview": pages[0]["text"][:250] if pages else ""
        },
        message=f"Đã nạp thành công {len(pages)} trang tài liệu và tạo {result.total_chunks} đoạn ngữ nghĩa cho AI."
    )

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
