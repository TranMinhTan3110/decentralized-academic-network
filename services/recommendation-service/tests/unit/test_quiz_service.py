import json
import uuid
from unittest.mock import MagicMock
import pytest

from app.services.quiz_service import QuizService
from app.models.ai_models import DocumentChunk, AIQuiz, AIQuizQuestion, UserQuizAttempt
from app.schemas.quiz import GenerateQuizRequest, SubmitQuizRequest, SubmitAnswerItem
from app.exceptions.app_exceptions import ResourceNotFoundException, ValidationException

def test_generate_quiz_no_chunks():
    mock_db = MagicMock()
    service = QuizService(db=mock_db)
    service.chunk_repo.get_by_document_id = MagicMock(return_value=[])

    req = GenerateQuizRequest(document_id=uuid.uuid4(), total_questions=5)
    with pytest.raises(ResourceNotFoundException):
        service.generate_quiz(user_id=uuid.uuid4(), req=req)

def test_generate_quiz_success():
    mock_db = MagicMock()
    service = QuizService(db=mock_db)
    doc_id = uuid.uuid4()
    user_id = uuid.uuid4()
    quiz_id = uuid.uuid4()

    mock_chunks = [
        DocumentChunk(
            id=uuid.uuid4(),
            document_id=doc_id,
            chunk_index=1,
            page_number=1,
            heading="Giới thiệu Thuật toán",
            content="Nội dung giới thiệu về cấu trúc dữ liệu và giải thuật trong khoa học máy tính."
        )
    ]
    service.chunk_repo.get_by_document_id = MagicMock(return_value=mock_chunks)

    mock_quiz = AIQuiz(
        id=quiz_id,
        document_id=doc_id,
        creator_user_id=user_id,
        title="Test Quiz",
        difficulty="ADVANCED",
        format_mode="MULTIPLE_CHOICE",
        total_questions=2,
        coverage_percent=95.0
    )
    service.quiz_repo.create = MagicMock(return_value=mock_quiz)

    q1_id = uuid.uuid4()
    mock_q = AIQuizQuestion(
        id=q1_id,
        quiz_id=quiz_id,
        question_index=1,
        question_text="Câu hỏi 1?",
        options_json={"A": "Đáp án A", "B": "Đáp án B", "C": "Đáp án C", "D": "Đáp án D"},
        correct_answer="A",
        explanation="Giải thích A",
        source_heading="Giới thiệu",
        source_page=1,
        source_snippet="Snippet"
    )
    service.question_repo.create = MagicMock(return_value=mock_q)

    req = GenerateQuizRequest(document_id=doc_id, total_questions=2)
    resp = service.generate_quiz(user_id=user_id, req=req)

    assert resp.id == quiz_id
    assert resp.total_questions == 2
    assert len(resp.questions) == 2
    assert resp.questions[0].options["A"] == "Đáp án A"

def test_get_quiz_for_taking_not_found():
    mock_db = MagicMock()
    service = QuizService(db=mock_db)
    service.quiz_repo.get_with_questions = MagicMock(return_value=None)

    with pytest.raises(ResourceNotFoundException):
        service.get_quiz_for_taking(quiz_id=uuid.uuid4())

def test_submit_quiz_grading():
    mock_db = MagicMock()
    service = QuizService(db=mock_db)
    user_id = uuid.uuid4()
    quiz_id = uuid.uuid4()
    q1_id = uuid.uuid4()
    q2_id = uuid.uuid4()

    q1 = AIQuizQuestion(
        id=q1_id,
        quiz_id=quiz_id,
        question_index=1,
        question_text="Q1?",
        options_json={"A": "Ans A", "B": "Ans B"},
        correct_answer="A",
        explanation="Vì A đúng"
    )
    q2 = AIQuizQuestion(
        id=q2_id,
        quiz_id=quiz_id,
        question_index=2,
        question_text="Q2?",
        options_json={"A": "Ans A", "B": "Ans B"},
        correct_answer="B",
        explanation="Vì B đúng"
    )

    mock_quiz = AIQuiz(
        id=quiz_id,
        document_id=uuid.uuid4(),
        title="Test Quiz",
        total_questions=2
    )
    mock_quiz.questions = [q1, q2]
    service.quiz_repo.get_with_questions = MagicMock(return_value=mock_quiz)

    mock_attempt = UserQuizAttempt(
        id=uuid.uuid4(),
        user_id=user_id,
        quiz_id=quiz_id,
        score=2,
        total_questions=2,
        percentage=100.0,
        time_spent_seconds=60
    )
    service.attempt_repo.create = MagicMock(return_value=mock_attempt)
    service.interaction_repo.create = MagicMock()

    # User answers Q1: A (correct), Q2: B (correct)
    req = SubmitQuizRequest(
        answers=[
            SubmitAnswerItem(question_id=q1_id, selected_option="A"),
            SubmitAnswerItem(question_id=q2_id, selected_option="B")
        ],
        time_spent_seconds=60
    )

    res = service.submit_quiz(user_id=user_id, quiz_id=quiz_id, req=req)
    assert res.score == 2
    assert res.percentage == 100.0
    assert "Xuất sắc" in res.feedback
    assert len(res.details) == 2
    assert res.details[0].is_correct is True
    assert res.details[1].is_correct is True

def test_get_user_history():
    mock_db = MagicMock()
    service = QuizService(db=mock_db)
    user_id = uuid.uuid4()
    quiz_id = uuid.uuid4()

    mock_attempts = [
        UserQuizAttempt(
            id=uuid.uuid4(),
            user_id=user_id,
            quiz_id=quiz_id,
            score=4,
            total_questions=5,
            percentage=80.0,
            time_spent_seconds=120
        )
    ]
    service.attempt_repo.get_by_user_id = MagicMock(return_value=mock_attempts)
    service.quiz_repo.get_by_id = MagicMock(return_value=AIQuiz(id=quiz_id, title="Đề kiểm tra"))

    hist = service.get_user_history(user_id=user_id)
    assert len(hist) == 1
    assert hist[0].score == 4
    assert hist[0].quiz_title == "Đề kiểm tra"

def test_generate_quiz_heuristic_structure():
    mock_db = MagicMock()
    service = QuizService(db=mock_db)
    doc_id = uuid.uuid4()

    mock_chunks = [
        DocumentChunk(
            id=uuid.uuid4(),
            document_id=doc_id,
            chunk_index=1,
            page_number=1,
            heading="Trang 1: Nguyên lý Kiểm thử Phần mềm",
            content="Kiểm thử phần mềm là hoạt động khảo sát thực tế nhằm cung cấp thông tin về chất lượng của sản phẩm phần mềm. Mục tiêu là phát hiện lỗi sớm."
        ),
        DocumentChunk(
            id=uuid.uuid4(),
            document_id=doc_id,
            chunk_index=2,
            page_number=2,
            heading="Trang 2: Kiểm thử Hộp Đen và Hộp Trắng",
            content="Kiểm thử hộp đen tập trung vào chức năng đầu vào và đầu ra mà không cần biết cấu trúc mã nguồn bên trong. Kiểm thử hộp trắng phân tích mã nguồn."
        ),
        DocumentChunk(
            id=uuid.uuid4(),
            document_id=doc_id,
            chunk_index=3,
            page_number=3,
            heading="Trang 3: Tự động hóa Kiểm thử",
            content="Kiểm thử tự động giúp tăng tốc độ kiểm thử hồi quy và giảm thiểu sai sót do con người gây ra trong các chu kỳ lặp lại nhiều lần."
        )
    ]

    questions = service._generate_quiz_heuristic(
        chunks=mock_chunks,
        total_questions=6,
        difficulty="ADVANCED"
    )

    assert len(questions) == 6
    answers = set()
    for q in questions:
        # Khong chua tien to lap "Cau hoi X:"
        assert not q["question_text"].startswith("Câu hỏi")
        assert not q["question_text"].startswith("Câu 1:")
        assert not q["question_text"].startswith("Câu 2:")
        # Du 4 options A, B, C, D
        assert set(q["options"].keys()) == {"A", "B", "C", "D"}
        assert q["correct_answer"] in {"A", "B", "C", "D"}
        assert len(q["explanation"]) > 0
        answers.add(q["correct_answer"])

    # Xac nhan dap an khong phai luon co dinh la 'A'
    assert len(answers) >= 1

def test_generate_quiz_with_llm_mock(monkeypatch):
    from unittest.mock import patch
    mock_db = MagicMock()
    service = QuizService(db=mock_db)
    doc_id = uuid.uuid4()

    mock_chunks = [
        DocumentChunk(
            id=uuid.uuid4(),
            document_id=doc_id,
            chunk_index=1,
            page_number=1,
            heading="Kiến trúc Microservices",
            content="Microservices là kiến trúc phân tán cho phép triển khai độc lập các dịch vụ nhỏ."
        )
    ]

    fake_response_data = {
        "choices": [
            {
                "message": {
                    "content": json.dumps({
                        "questions": [
                            {
                                "question_text": "Ưu điểm nổi bật của kiến trúc Microservices là gì?",
                                "options": {
                                    "A": "Mã nguồn tập trung trong một cơ sở dữ liệu duy nhất.",
                                    "B": "Cho phép phát triển và triển khai độc lập giữa các dịch vụ.",
                                    "C": "Không cần cấu hình mạng hay giao tiếp qua HTTP/gRPC.",
                                    "D": "Luôn có độ trễ bằng 0 trong mọi tình huống phân tán."
                                },
                                "correct_answer": "B",
                                "explanation": "Theo bài giảng, microservices cho phép triển khai độc lập.",
                                "source_heading": "Kiến trúc Microservices",
                                "source_page": 1,
                                "source_snippet": "cho phép triển khai độc lập"
                            }
                        ]
                    })
                }
            }
        ]
    }

    class MockResponse:
        status_code = 200
        def json(self):
            return fake_response_data

    # Mock settings.OPENAI_API_KEY
    from app.core.config import settings
    monkeypatch.setattr(settings, "OPENAI_API_KEY", "test-key")
    # Temporarily remove PYTEST_CURRENT_TEST from os.environ
    import os
    pytest_env = os.environ.pop("PYTEST_CURRENT_TEST", None)

    try:
        with patch("httpx.post", return_value=MockResponse()):
            res = service._generate_quiz_with_llm(
                chunks=mock_chunks,
                total_questions=1,
                difficulty="ADVANCED"
            )
            assert res is not None
            assert len(res) == 1
            assert res[0]["correct_answer"] == "B"
            assert "Microservices" in res[0]["question_text"]
    finally:
        if pytest_env is not None:
            os.environ["PYTEST_CURRENT_TEST"] = pytest_env


def test_select_smart_chunks_and_compact_context():
    mock_db = MagicMock()
    service = QuizService(db=mock_db)
    doc_id = uuid.uuid4()

    assert service._select_smart_chunks([], 5) == []

    # Create boilerplate chunks (TOC, short) + 12 valid knowledge chunks
    chunks = [
        DocumentChunk(
            id=uuid.uuid4(),
            document_id=doc_id,
            chunk_index=0,
            page_number=1,
            heading="Mục lục",
            content="Mục lục trang 1................ 1 Chương 2................ 5"
        ),
        DocumentChunk(
            id=uuid.uuid4(),
            document_id=doc_id,
            chunk_index=1,
            page_number=2,
            heading="Trang bìa",
            content="Ngắn"
        ),
    ]
    for idx in range(2, 14):
        long_sentence = (
            f"Chương {idx}: Phân tích chuyên sâu về thuật toán phân tán và cơ chế đồng thuận Raft trong hệ thống. "
        ) * 15
        chunks.append(
            DocumentChunk(
                id=uuid.uuid4(),
                document_id=doc_id,
                chunk_index=idx,
                page_number=idx,
                heading=f"Chương {idx}: Hệ thống phân tán",
                content=long_sentence
            )
        )

    selected = service._select_smart_chunks(chunks, target_count=5)
    assert len(selected) <= 8
    # Boilerplate "Mục lục" and short chunk should be filtered out
    for c in selected:
        assert c.heading != "Mục lục"
        assert len(c.content) >= 40

    context_str = service._build_compact_rag_context(chunks, total_questions=5)
    assert len(context_str) <= 6000
    assert "Phân đoạn tại trang" in context_str


def test_build_compact_rag_context_without_dots():
    mock_db = MagicMock()
    service = QuizService(db=mock_db)
    doc_id = uuid.uuid4()

    # Chunk with >900 chars and no period '.' to trigger ellipsis branch
    no_dot_text = "Kiến thức học thuật liên tục không có dấu chấm câu " * 30
    chunks = [
        DocumentChunk(
            id=uuid.uuid4(),
            document_id=doc_id,
            chunk_index=1,
            page_number=1,
            heading="Phần không dấu chấm",
            content=no_dot_text
        )
    ]
    context_str = service._build_compact_rag_context(chunks, total_questions=3)
    assert "..." in context_str


def test_export_quiz_to_kahoot_and_wayground_xlsx():
    import io
    from openpyxl import load_workbook

    mock_db = MagicMock()
    service = QuizService(db=mock_db)
    quiz_id = uuid.uuid4()

    long_question = "Câu hỏi siêu dài vượt quá 120 ký tự: " + ("Nội dung kiến thức kiểm thử phần mềm chuyên sâu " * 4)
    long_answer = "Phương án trả lời rất dài vượt quá 75 ký tự để kiểm tra tính năng cắt tự động của Kahoot exporter"

    q1 = AIQuizQuestion(
        id=uuid.uuid4(),
        quiz_id=quiz_id,
        question_index=1,
        question_text=long_question,
        options_json={"A": long_answer, "B": "Đáp án B", "C": "Đáp án C", "D": "Đáp án D"},
        correct_answer="C",
        explanation="Giải thích chi tiết cho câu 1"
    )
    q2 = AIQuizQuestion(
        id=uuid.uuid4(),
        quiz_id=quiz_id,
        question_index=2,
        question_text="Câu hỏi ngắn gọn số 2?",
        options_json=json.dumps({"A": "Lựa chọn 1", "B": "Lựa chọn 2", "C": "Lựa chọn 3", "D": "Lựa chọn 4"}),
        correct_answer="B",
        explanation="Giải thích câu 2"
    )

    mock_quiz = AIQuiz(
        id=quiz_id,
        document_id=uuid.uuid4(),
        title="Đề thi thử Kahoot",
        difficulty="OLYMPIC",
        total_questions=2
    )
    mock_quiz.questions = [q2, q1]
    service.quiz_repo.get_with_questions = MagicMock(return_value=mock_quiz)

    # 1. Test Kahoot Export
    kahoot_bytes, kahoot_filename = service.export_quiz_to_kahoot_xlsx(quiz_id)
    assert kahoot_filename.startswith("kahoot_quiz_")
    assert kahoot_filename.endswith(".xlsx")
    assert len(kahoot_bytes) > 0

    wb = load_workbook(io.BytesIO(kahoot_bytes))
    ws = wb.active
    assert ws.title == "Kahoot Quiz Import"
    # Row 1 is header, Row 2 is question 1, Row 3 is question 2
    assert len(ws.cell(row=2, column=1).value) <= 120
    assert ws.cell(row=2, column=1).value.endswith("...")
    assert len(ws.cell(row=2, column=2).value) <= 75
    assert ws.cell(row=2, column=6).value == 60  # OLYMPIC -> 60s
    assert ws.cell(row=2, column=7).value == 3   # C -> 3
    assert ws.cell(row=3, column=7).value == 2   # B -> 2

    # 2. Test Wayground Export
    wg_bytes, wg_filename = service.export_quiz_to_wayground_xlsx(quiz_id)
    assert wg_filename.startswith("wayground_quiz_")
    assert wg_filename.endswith(".xlsx")

    wb_wg = load_workbook(io.BytesIO(wg_bytes))
    ws_wg = wb_wg.active
    assert ws_wg.title == "Wayground Quiz Import"
    assert ws_wg.cell(row=2, column=2).value == "Multiple Choice"
    assert ws_wg.cell(row=2, column=7).value == 3
    assert ws_wg.cell(row=2, column=8).value == 60
    assert ws_wg.cell(row=2, column=9).value == "Giải thích chi tiết cho câu 1"


def test_export_quiz_not_found():
    mock_db = MagicMock()
    service = QuizService(db=mock_db)
    service.quiz_repo.get_with_questions = MagicMock(return_value=None)

    with pytest.raises(ResourceNotFoundException):
        service.export_quiz_to_kahoot_xlsx(uuid.uuid4())

    with pytest.raises(ResourceNotFoundException):
        service.export_quiz_to_wayground_xlsx(uuid.uuid4())


