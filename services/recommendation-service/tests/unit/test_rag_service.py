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

def test_ask_question_session_not_found():
    mock_db = MagicMock()
    service = RagService(db=mock_db)
    service.session_repo.get_by_id = MagicMock(return_value=None)

    req = AskQuestionRequest(question="Test question")
    with pytest.raises(ResourceNotFoundException):
        service.ask_question(user_id=None, session_id=uuid.uuid4(), req=req)

def test_ask_question_no_chunks_found():
    mock_db = MagicMock()
    service = RagService(db=mock_db)
    session_id = uuid.uuid4()
    mock_session = AIChatSession(id=session_id, document_id=uuid.uuid4(), title="Chat Session")
    service.session_repo.get_by_id = MagicMock(return_value=mock_session)
    service.chunk_repo.search_chunks = MagicMock(return_value=[])

    mock_msg = AIChatMessage(
        id=uuid.uuid4(),
        session_id=session_id,
        role="assistant",
        content="Không tìm thấy",
        sources_found_json=[]
    )
    service.message_repo.create = MagicMock(return_value=mock_msg)

    req = AskQuestionRequest(question="Unknown question")
    resp = service.ask_question(user_id=None, session_id=session_id, req=req)
    assert resp.role == "assistant"
    assert len(resp.sources_found) == 0

def test_get_messages_success_and_not_found():
    mock_db = MagicMock()
    service = RagService(db=mock_db)
    session_id = uuid.uuid4()

    # Not found
    service.session_repo.get_by_id = MagicMock(return_value=None)
    with pytest.raises(ResourceNotFoundException):
        service.get_messages(session_id)

    # Success
    mock_session = AIChatSession(id=session_id, document_id=uuid.uuid4(), title="Chat Session")
    service.session_repo.get_by_id = MagicMock(return_value=mock_session)
    mock_msg1 = AIChatMessage(id=uuid.uuid4(), session_id=session_id, role="user", content="Hi")
    mock_msg2 = AIChatMessage(
        id=uuid.uuid4(),
        session_id=session_id,
        role="assistant",
        content="Hello",
        sources_found_json=[{"chunk_index": 1, "page_number": 1, "heading": "Intro", "snippet": "Text"}]
    )
    service.message_repo.get_by_session_id = MagicMock(return_value=[mock_msg1, mock_msg2])

    msgs = service.get_messages(session_id)
    assert len(msgs) == 2
    assert msgs[0].role == "user"
    assert msgs[1].role == "assistant"
    assert msgs[1].sources_found[0].heading == "Intro"

def test_synthesize_with_llm_cases(monkeypatch):
    from unittest.mock import patch
    from app.core.config import settings

    mock_db = MagicMock()
    service = RagService(db=mock_db)
    chunk = DocumentChunk(chunk_index=1, page_number=1, heading="Title", content="Content snippet")

    # 1. No key returns None
    monkeypatch.setattr(settings, "OPENAI_API_KEY", None)
    assert service._synthesize_with_llm("query", [chunk]) is None

    # 2. Key present, simulate non-pytest call with successful response
    monkeypatch.setattr(settings, "OPENAI_API_KEY", "dummy-key")
    monkeypatch.delenv("PYTEST_CURRENT_TEST", raising=False)

    with patch("httpx.post") as mock_post:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "choices": [{"message": {"content": "Trả lời từ GPT"}}]
        }
        mock_post.return_value = mock_resp

        ans = service._synthesize_with_llm("query", [chunk])
        assert ans == "Trả lời từ GPT"

    # 3. Exception in httpx returns None
    with patch("httpx.post", side_effect=Exception("API error")):
        assert service._synthesize_with_llm("query", [chunk]) is None

