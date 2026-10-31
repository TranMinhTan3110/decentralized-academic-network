import os
import uuid
import tempfile
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import SessionLocal
from app.services.text_extractor import TextExtractor
from app.services.content_validator import ContentValidator
from app.services.recommendation_service import RecommendationService
from app.repositories.base_repository import BaseRepository
from app.repositories.chunk_repository import DocumentChunkRepository
from app.repositories.interaction_repository import InteractionRepository
from app.repositories.quiz_repository import AIQuizRepository, AIQuizQuestionRepository
from app.repositories.chat_repository import ChatSessionRepository, ChatMessageRepository
from app.models.ai_models import (
    DocumentChunk,
    AIQuiz,
    AIQuizQuestion,
    UserDocumentInteraction,
    AIChatSession,
    AIChatMessage
)
from app.events.kafka_producer import KafkaEventProducer
from app.exceptions.app_exceptions import (
    AppException,
    ResourceNotFoundException,
    UnauthorizedException,
    ForbiddenException,
    DuplicateResourceException,
    ValidationException
)

def test_text_extractor_from_bytes_and_path():
    # 1. Non-existent path returns []
    assert TextExtractor.extract_from_path("non_existent_file_path_12345.pdf") == []

    # 2. Extract from valid PDF bytes using fitz
    import fitz
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 72), "Giao trinh Cau truc du lieu va giai thuat trang 1.")
    pdf_bytes = doc.tobytes()
    doc.close()

    pages = TextExtractor.extract_from_bytes(pdf_bytes)
    assert len(pages) == 1
    assert pages[0]["page_number"] == 1
    assert "Cau truc du lieu" in pages[0]["text"]

    # 3. Extract from real file path
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(pdf_bytes)
        tmp_path = tmp.name

    try:
        pages_file = TextExtractor.extract_from_path(tmp_path)
        assert len(pages_file) == 1
        assert "Cau truc du lieu" in pages_file[0]["text"]
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

def test_content_validator_entropy_and_edge_cases():
    assert ContentValidator.calculate_entropy("") == 0.0
    entropy = ContentValidator.calculate_entropy("hello world abcdef")
    assert entropy > 0.0

    # Words is empty
    is_ok, code, reason = ContentValidator.check_gibberish_and_spam("   ... ,,, !!! ")
    assert is_ok is False
    assert code == "SPAM_GIBBERISH"

def test_content_validator_duplicate_in_db():
    db = SessionLocal()
    doc1 = uuid.uuid4()
    doc2 = uuid.uuid4()
    chunk_text = "Nội dung học phần cơ sở dữ liệu phân tán và kiến trúc hệ thống mạng máy tính." * 3

    chunk = DocumentChunk(
        document_id=doc1,
        chunk_index=1,
        page_number=1,
        heading="Chương 1",
        content=chunk_text
    )
    db.add(chunk)
    db.commit()

    try:
        # Check duplicate against doc2
        is_ok, code, reason = ContentValidator.check_duplicate(db, chunk_text, current_doc_id=doc2)
        assert is_ok is False
        assert code == "DUPLICATE_CONTENT"

        # Check short text returns True
        is_ok_short, _, _ = ContentValidator.check_duplicate(db, "ngắn")
        assert is_ok_short is True
    finally:
        db.query(DocumentChunk).filter(DocumentChunk.document_id == doc1).delete()
        db.commit()
        db.close()

def test_base_repository_operations():
    db = SessionLocal()
    repo = BaseRepository(DocumentChunk, db)

    doc_id = uuid.uuid4()
    chunk = DocumentChunk(
        document_id=doc_id,
        chunk_index=1,
        page_number=1,
        heading="Tiêu đề",
        content="Nội dung kiểm thử base repository."
    )
    saved = repo.create(chunk)
    assert saved.id is not None

    fetched = repo.get_by_id(saved.id)
    assert fetched is not None
    assert fetched.document_id == doc_id

    all_items = repo.get_all(skip=0, limit=5)
    assert len(all_items) >= 1

    saved.heading = "Tiêu đề đã sửa"
    updated = repo.update(saved)
    assert updated.heading == "Tiêu đề đã sửa"

    repo.delete(updated)
    assert repo.get_by_id(saved.id) is None
    db.close()

def test_specific_repositories():
    db = SessionLocal()
    doc_id = uuid.uuid4()
    user_id = uuid.uuid4()

    try:
        # Quiz Repository
        q_repo = AIQuizRepository(db)
        quiz = AIQuiz(document_id=doc_id, title="Test Repo Quiz", total_questions=1)
        q_repo.create(quiz)
        quizzes = q_repo.get_by_document_id(doc_id)
        assert len(quizzes) >= 1

        # Question Repo
        question_repo = AIQuizQuestionRepository(db)
        q = AIQuizQuestion(
            quiz_id=quiz.id,
            question_index=1,
            question_text="Q1",
            options_json={"A": "1"},
            correct_answer="A"
        )
        question_repo.create(q)
        assert len(question_repo.get_by_quiz_id(quiz.id)) == 1

        # Interaction Repo
        i_repo = InteractionRepository(db)
        inter = UserDocumentInteraction(
            user_id=user_id,
            document_id=doc_id,
            interaction_type="LIKE",
            reward_score=3.0
        )
        i_repo.create(inter)
        doc_ids = i_repo.get_user_interacted_doc_ids(user_id)
        assert doc_id in doc_ids

        # Chat Repo
        s_repo = ChatSessionRepository(db)
        session = AIChatSession(user_id=user_id, document_id=doc_id, title="Test Chat")
        s_repo.create(session)
        assert len(s_repo.get_by_user_and_doc(user_id, doc_id)) == 1
        with_msgs = s_repo.get_with_messages(session.id)
        assert with_msgs is not None

    finally:
        db.query(AIChatSession).filter(AIChatSession.document_id == doc_id).delete()
        db.query(UserDocumentInteraction).filter(UserDocumentInteraction.document_id == doc_id).delete()
        db.query(AIQuiz).filter(AIQuiz.document_id == doc_id).delete()
        db.commit()
        db.close()

def test_producer_send_event_and_publishers():
    producer = KafkaEventProducer()
    with patch.object(producer, "_get_producer") as mock_get:
        mock_p = MagicMock()
        mock_get.return_value = mock_p

        # Test success
        res1 = producer.publish_document_validated("doc-1", "VALID", 5)
        assert res1 is True
        mock_p.send.assert_called()

        # Test failure
        mock_p.send.side_effect = Exception("Kafka down")
        res2 = producer.publish_quiz_completed("user-1", "quiz-1", 5, 100.0)
        assert res2 is False

def test_health_and_root_endpoints(client, auth_headers):
    # Root
    r_root = client.get("/")
    assert r_root.status_code == 200

    # API Root
    r_api = client.get("/api/v1/")
    assert r_api.status_code == 200

    # Health
    r_health = client.get("/api/v1/health")
    assert r_health.status_code == 200
    assert r_health.json()["data"]["database"] == "UP"

    # Profile
    r_me = client.get("/api/v1/me", headers=auth_headers)
    assert r_me.status_code == 200
    assert r_me.json()["data"]["role"] == "ROLE_STUDENT"

def test_custom_exception_classes():
    e1 = ResourceNotFoundException("Not found test")
    assert e1.status_code == 404
    assert e1.message == "Not found test"

    e2 = UnauthorizedException("Auth error")
    assert e2.status_code == 401

    e3 = ForbiddenException("Forbidden error")
    assert e3.status_code == 403

    e4 = DuplicateResourceException("Duplicate error")
    assert e4.status_code == 409

    e5 = ValidationException("Validation error")
    assert e5.status_code == 422

def test_recommendation_exploration_branch():
    mock_db = MagicMock()
    service = RecommendationService(db=mock_db)
    user_id = uuid.uuid4()
    doc_id = uuid.uuid4()

    service.repo.get_by_user_id = MagicMock(return_value=[
        UserDocumentInteraction(user_id=user_id, document_id=uuid.uuid4(), interaction_type="VIEW", reward_score=1.0)
    ])
    service.repo.get_trending_documents = MagicMock(return_value=[(doc_id, 10.0, 1)])
    mock_db.query().distinct().limit().all = MagicMock(return_value=[])

    # Force 100% exploration
    resp = service.get_personal_recommendations(user_id=user_id, limit=5, epsilon=1.0)
    assert resp.total >= 1
    assert "Exploration" in resp.items[0].reason


def test_exception_handlers_full_coverage():
    import asyncio
    from starlette.requests import Request
    from fastapi.exceptions import RequestValidationError
    from starlette.exceptions import HTTPException as StarletteHTTPException
    from app.exceptions.handlers import register_exception_handlers, _cors_headers

    # 1. _cors_headers with and without origin
    req_no_origin = MagicMock(spec=Request)
    req_no_origin.headers = {}
    assert _cors_headers(req_no_origin) == {}

    req_with_origin = MagicMock(spec=Request)
    req_with_origin.headers = {"origin": "http://localhost:3000"}
    cors = _cors_headers(req_with_origin)
    assert cors["Access-Control-Allow-Origin"] == "http://localhost:3000"

    # 2. Test handlers directly
    fake_app = MagicMock()
    handlers = {}
    def fake_handler_decorator(exc_class):
        def decorator(func):
            handlers[exc_class] = func
            return func
        return decorator
    fake_app.exception_handler = fake_handler_decorator

    register_exception_handlers(fake_app)

    # Call app_exception_handler
    app_handler = handlers[AppException]
    res1 = asyncio.run(app_handler(req_with_origin, AppException(status_code=400, message="Test Err")))
    assert res1.status_code == 400

    # Call validation_exception_handler
    val_handler = handlers[RequestValidationError]
    val_exc = RequestValidationError(errors=[{"loc": ("body", "title"), "msg": "Field required"}])
    res2 = asyncio.run(val_handler(req_with_origin, val_exc))
    assert res2.status_code == 400

    val_exc_empty = RequestValidationError(errors=[])
    res2_empty = asyncio.run(val_handler(req_no_origin, val_exc_empty))
    assert res2_empty.status_code == 400

    # Call http_exception_handler
    http_handler = handlers[StarletteHTTPException]
    res3 = asyncio.run(http_handler(req_with_origin, StarletteHTTPException(status_code=404, detail="Not Found HTTP")))
    assert res3.status_code == 404

    res3_non_str = asyncio.run(http_handler(req_no_origin, StarletteHTTPException(status_code=400, detail={"code": 1})))
    assert res3_non_str.status_code == 400

    # Call unhandled_exception_handler
    unhandled_handler = handlers[Exception]
    res4 = asyncio.run(unhandled_handler(req_with_origin, RuntimeError("Fatal crash")))
    assert res4.status_code == 500


def test_security_edge_cases():
    import jwt
    from app.core.security import get_current_user
    from app.core.config import settings

    # Missing userId and email
    token_missing_info = jwt.encode({"role": "ROLE_STUDENT"}, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    with pytest.raises(UnauthorizedException):
        get_current_user(f"Bearer {token_missing_info}")

    # Invalid UUID
    token_invalid_uuid = jwt.encode({"userId": "invalid-uuid-123", "email": "test@gmail.com"}, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    with pytest.raises(UnauthorizedException):
        get_current_user(f"Bearer {token_invalid_uuid}")


def test_kafka_consumer_edge_branches():
    from app.events.kafka_consumer import KafkaEventConsumer
    consumer = KafkaEventConsumer()

    # 1. db is None and unhandled event type
    res1 = consumer.process_message({"documentId": str(uuid.uuid4()), "eventType": "UNKNOWN_EVENT_TYPE"}, db=None)
    assert res1["status"] == "IGNORED"

    # 2. DOCUMENT_UPLOADED with empty/fallback pages
    doc_id = str(uuid.uuid4())
    res2 = consumer.process_message({"documentId": doc_id, "eventType": "DOCUMENT_UPLOADED", "title": "Fallback Doc"}, db=None)
    assert res2["status"] == "PROCESSED"


def test_text_extractor_magic_bytes_edge_cases():
    import io
    import zipfile

    # 1. Extension without dot or empty
    assert TextExtractor.get_extension("noext") == "pdf"
    assert TextExtractor.get_extension("") == "pdf"

    # 2. File too small (<4 bytes)
    is_ok, ext, err = TextExtractor.validate_magic_bytes(b"ab", "file.pdf")
    assert is_ok is False

    # 3. Zip file corrupt or missing subfiles
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("dummy.txt", "abc")
    empty_zip = buf.getvalue()

    is_ok_docx, _, err = TextExtractor.validate_magic_bytes(empty_zip, "test.docx")
    assert is_ok_docx is False
    assert "word/document.xml" in err

    is_ok_xlsx, _, err = TextExtractor.validate_magic_bytes(empty_zip, "test.xlsx")
    assert is_ok_xlsx is False
    assert "xl/workbook.xml" in err

    is_ok_pptx, _, err = TextExtractor.validate_magic_bytes(empty_zip, "test.pptx")
    assert is_ok_pptx is False
    assert "ppt/presentation.xml" in err

    # Broken zip header
    is_ok_broken, _, err = TextExtractor.validate_magic_bytes(b"PK\x03\x04corrupted", "test.docx")
    assert is_ok_broken is False

    # 4. Image disguised HTML
    html_img = b"<!doctype html><html><body>Error</body></html>"
    is_ok_img, _, err = TextExtractor.validate_magic_bytes(html_img, "pic.png")
    assert is_ok_img is False

    # Unknown magic bytes
    is_ok_unknown, _, _ = TextExtractor.validate_magic_bytes(b"1234567890", "unknown.pdf")
    assert is_ok_unknown is False


def test_document_chunks_file_path_and_empty(client, auth_headers):
    doc_id = str(uuid.uuid4())
    # Process with empty text fallback
    r1 = client.post(f"/api/v1/documents/{doc_id}/process", json={"document_id": doc_id, "title": "Test Title", "raw_text": None, "file_path": None}, headers=auth_headers)
    assert r1.status_code == 200

    # Validate with empty text fallback
    r2 = client.post("/api/v1/documents/validate", json={"document_id": doc_id, "title": "Test Title", "raw_text": None, "file_path": None}, headers=auth_headers)
    assert r2.status_code == 200

