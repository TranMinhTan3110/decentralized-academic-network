import re
import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.ai_models import DocumentChunk, AIChatSession, AIChatMessage
from app.repositories.chunk_repository import DocumentChunkRepository
from app.repositories.chat_repository import ChatSessionRepository, ChatMessageRepository
from app.services.content_validator import ContentValidator
from app.exceptions.app_exceptions import ResourceNotFoundException, ValidationException
from app.schemas.chat import (
    CreateChatSessionRequest,
    ChatSessionResponse,
    AskQuestionRequest,
    ChatMessageResponse,
    SourceCitationItem
)
from app.schemas.content_validation import ProcessDocumentResponse

class RagService:
    def __init__(self, db: Session):
        self.db = db
        self.chunk_repo = DocumentChunkRepository(db)
        self.session_repo = ChatSessionRepository(db)
        self.message_repo = ChatMessageRepository(db)

    def process_and_chunk_document(
        self,
        document_id: UUID,
        title: Optional[str],
        pages: List[Dict[str, Any]]
    ) -> ProcessDocumentResponse:
        # 1. Validate content quality & fraud
        validation = ContentValidator.validate_content(pages=pages, db=self.db, document_id=document_id)
        if not validation.is_valid:
            return ProcessDocumentResponse(
                document_id=document_id,
                total_chunks=0,
                validation_status=validation.status,
                message=f"Thẩm định thất bại: {validation.reason} [Mã cờ: {validation.flag_code}]"
            )

        # 2. Clear old chunks if re-processing
        self.chunk_repo.delete_by_document_id(document_id)

        # 3. Semantic chunking (approx 300 - 500 characters per chunk with page preservation)
        chunk_index = 1
        created_chunks: List[DocumentChunk] = []

        for p in pages:
            page_num = p.get("page_number", 1)
            text = p.get("text", "").strip()
            if not text:
                continue

            # Split by paragraphs or double newlines
            paragraphs = [para.strip() for para in text.split("\n\n") if para.strip()]
            if not paragraphs:
                paragraphs = [text]

            current_chunk = ""
            current_heading = f"Trang {page_num}: {title or 'Bài giảng học thuật'}"

            for para in paragraphs:
                if len(para) > 20 and len(para) < 120 and (para.startswith("#") or para.isupper() or ":" in para):
                    current_heading = para.strip("#").strip()

                if len(current_chunk) + len(para) < 500:
                    current_chunk += " " + para
                else:
                    if current_chunk.strip():
                        c = DocumentChunk(
                            document_id=document_id,
                            chunk_index=chunk_index,
                            page_number=page_num,
                            heading=current_heading[:255],
                            content=current_chunk.strip(),
                            token_count=len(current_chunk.split())
                        )
                        self.chunk_repo.create(c)
                        created_chunks.append(c)
                        chunk_index += 1
                    current_chunk = para

            if current_chunk.strip():
                c = DocumentChunk(
                    document_id=document_id,
                    chunk_index=chunk_index,
                    page_number=page_num,
                    heading=current_heading[:255],
                    content=current_chunk.strip(),
                    token_count=len(current_chunk.split())
                )
                self.chunk_repo.create(c)
                created_chunks.append(c)
                chunk_index += 1

        return ProcessDocumentResponse(
            document_id=document_id,
            total_chunks=len(created_chunks),
            validation_status="VALID",
            message=f"Phân tích tài liệu thành công: Tạo {len(created_chunks)} phân đoạn ngữ nghĩa (chunks)."
        )

    def create_chat_session(self, user_id: Optional[UUID], req: CreateChatSessionRequest) -> ChatSessionResponse:
        session = AIChatSession(
            user_id=user_id,
            document_id=req.document_id,
            title=req.title or "Hỏi đáp bài giảng AI"
        )
        saved = self.session_repo.create(session)
        return ChatSessionResponse(
            id=saved.id,
            document_id=saved.document_id,
            title=saved.title,
            created_at=saved.created_at or datetime.now(timezone.utc)
        )

    def ask_question(
        self,
        user_id: Optional[UUID],
        session_id: UUID,
        req: AskQuestionRequest
    ) -> ChatMessageResponse:
        session = self.session_repo.get_by_id(session_id)
        if not session:
            raise ResourceNotFoundException(f"Không tìm thấy phiên hỏi đáp với mã: {session_id}")

        # 1. Save user question
        user_msg = AIChatMessage(
            session_id=session_id,
            role="user",
            content=req.question.strip()
        )
        self.message_repo.create(user_msg)

        # 2. Retrieve top relevant chunks for RAG
        matched_chunks = self.chunk_repo.search_chunks(
            document_id=session.document_id,
            query_text=req.question,
            limit=3
        )

        sources: List[SourceCitationItem] = []
        if matched_chunks:
            for mc in matched_chunks:
                sources.append(
                    SourceCitationItem(
                        chunk_index=mc.chunk_index,
                        page_number=mc.page_number,
                        heading=mc.heading,
                        snippet=mc.content[:200]
                    )
                )

            # Synthesize academic answer
            top_content = matched_chunks[0].content
            answer_text = (
                f"Dựa vào nội dung tài liệu tại trang {matched_chunks[0].page_number} "
                f"({matched_chunks[0].heading}):\n\n"
                f"{top_content[:350]}...\n\n"
                f"Tóm tắt: Kiến thức giải đáp trực tiếp cho câu hỏi của bạn được trích lục chính xác từ văn bản gốc."
            )
        else:
            answer_text = (
                "Tôi đã tra cứu toàn bộ tài liệu nhưng không tìm thấy đoạn văn nào liên quan trực tiếp đến câu hỏi của bạn. "
                "Bạn vui lòng cung cấp thêm từ khóa hoặc đặt câu hỏi chi tiết hơn."
            )

        sources_json = [s.model_dump() for s in sources]
        assistant_msg = AIChatMessage(
            session_id=session_id,
            role="assistant",
            content=answer_text,
            sources_found_json=sources_json
        )
        saved_assistant = self.message_repo.create(assistant_msg)

        return ChatMessageResponse(
            id=saved_assistant.id,
            session_id=saved_assistant.session_id,
            role="assistant",
            content=saved_assistant.content,
            sources_found=sources,
            created_at=saved_assistant.created_at or datetime.now(timezone.utc)
        )

    def get_messages(self, session_id: UUID) -> List[ChatMessageResponse]:
        session = self.session_repo.get_by_id(session_id)
        if not session:
            raise ResourceNotFoundException(f"Không tìm thấy phiên trò chuyện với mã: {session_id}")

        messages = self.message_repo.get_by_session_id(session_id)
        res = []
        for m in messages:
            sources = None
            if m.sources_found_json:
                data = m.sources_found_json if isinstance(m.sources_found_json, list) else json.loads(m.sources_found_json)
                sources = [SourceCitationItem(**item) for item in data]

            res.append(
                ChatMessageResponse(
                    id=m.id,
                    session_id=m.session_id,
                    role=m.role,
                    content=m.content,
                    sources_found=sources,
                    created_at=m.created_at or datetime.now(timezone.utc)
                )
            )
        return res
