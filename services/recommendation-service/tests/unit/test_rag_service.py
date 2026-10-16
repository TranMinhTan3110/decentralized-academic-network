import uuid
from unittest.mock import MagicMock
import pytest

from app.services.rag_service import RagService
from app.models.ai_models import AIChatSession, AIChatMessage, DocumentChunk
from app.schemas.chat import CreateChatSessionRequest, AskQuestionRequest
from app.exceptions.app_exceptions import ResourceNotFoundException

def test_process_and_chunk_document_valid():
    mock_db = MagicMock()
    service = RagService(db=mock_db)
    doc_id = uuid.uuid4()

    pages = [
        {
            "page_number": 1,
            "text": "Khái niệm mạng nơ-ron nhân tạo và giải thuật lan truyền ngược trong học sâu. " * 8
        }
    ]
    mock_db.query().filter().first.return_value = None
    service.chunk_repo.delete_by_document_id = MagicMock(return_value=0)
    service.chunk_repo.create = MagicMock()

    resp = service.process_and_chunk_document(
        document_id=doc_id,
        title="Deep Learning",
        pages=pages
    )
    assert resp.validation_status == "VALID"
    assert resp.total_chunks >= 1
    assert service.chunk_repo.create.called

def test_process_and_chunk_document_rejected():
    mock_db = MagicMock()
    service = RagService(db=mock_db)
    doc_id = uuid.uuid4()

    # Empty text (< 50 words)
    pages = [{"page_number": 1, "text": "File ngắn quá ít chữ."}]
    resp = service.process_and_chunk_document(
        document_id=doc_id,
        title="Empty Doc",
        pages=pages
    )
    assert resp.validation_status == "FLAGGED"
    assert resp.total_chunks == 0

def test_create_chat_session():
    mock_db = MagicMock()
    service = RagService(db=mock_db)
    session_id = uuid.uuid4()
    doc_id = uuid.uuid4()

    mock_session = AIChatSession(
        id=session_id,
        document_id=doc_id,
        title="Session 1"
    )
    service.session_repo.create = MagicMock(return_value=mock_session)

    req = CreateChatSessionRequest(document_id=doc_id, title="Session 1")
    resp = service.create_chat_session(user_id=uuid.uuid4(), req=req)

    assert resp.id == session_id
    assert resp.document_id == doc_id

def test_ask_question_with_citations():
    mock_db = MagicMock()
    service = RagService(db=mock_db)
    session_id = uuid.uuid4()
    doc_id = uuid.uuid4()

    mock_session = AIChatSession(id=session_id, document_id=doc_id, title="Chat Session")
    service.session_repo.get_by_id = MagicMock(return_value=mock_session)

    mock_chunk = DocumentChunk(
        id=uuid.uuid4(),
        document_id=doc_id,
        chunk_index=1,
        page_number=3,
        heading="Định lý Bayes",
        content="Định lý Bayes mô tả xác suất xảy ra của một sự kiện dựa trên các điều kiện liên quan."
    )
    service.chunk_repo.search_chunks = MagicMock(return_value=[mock_chunk])

    mock_msg = AIChatMessage(
        id=uuid.uuid4(),
        session_id=session_id,
        role="assistant",
        content="Dựa vào nội dung tài liệu tại trang 3...",
        sources_found_json=[{"chunk_index": 1, "page_number": 3, "heading": "Định lý Bayes", "snippet": "..."}]
    )
    service.message_repo.create = MagicMock(return_value=mock_msg)

    req = AskQuestionRequest(question="Định lý Bayes là gì?")
    resp = service.ask_question(user_id=None, session_id=session_id, req=req)

    assert resp.role == "assistant"
    assert len(resp.sources_found) == 1
    assert resp.sources_found[0].page_number == 3
