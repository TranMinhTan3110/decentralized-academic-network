import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.ai_models import AIQuiz, AIQuizQuestion, UserQuizAttempt, UserDocumentInteraction
from app.repositories.quiz_repository import (
    AIQuizRepository,
    AIQuizQuestionRepository,
    UserQuizAttemptRepository
)
from app.repositories.chunk_repository import DocumentChunkRepository
from app.repositories.interaction_repository import InteractionRepository
from app.exceptions.app_exceptions import ResourceNotFoundException, ValidationException
from app.schemas.quiz import (
    GenerateQuizRequest,
    QuizDetailResponse,
    QuizQuestionItem,
    SubmitQuizRequest,
    QuizSubmissionResultResponse,
    QuestionGradingResult,
    QuizAttemptHistoryItem
)

class QuizService:
    def __init__(self, db: Session):
        self.db = db
        self.quiz_repo = AIQuizRepository(db)
        self.question_repo = AIQuizQuestionRepository(db)
        self.attempt_repo = UserQuizAttemptRepository(db)
        self.chunk_repo = DocumentChunkRepository(db)
        self.interaction_repo = InteractionRepository(db)

    def generate_quiz(self, user_id: UUID, req: GenerateQuizRequest) -> QuizDetailResponse:
        chunks = self.chunk_repo.get_by_document_id(req.document_id)
        if not chunks:
            raise ResourceNotFoundException(
                f"Tài liệu {req.document_id} chưa được trích xuất nội dung hoặc không có dữ liệu văn bản để sinh đề thi"
            )

        title = req.title or f"Bài kiểm tra trắc nghiệm AI: Tài liệu học tập (Độ khó: {req.difficulty})"
        quiz = AIQuiz(
            document_id=req.document_id,
            creator_user_id=user_id,
            title=title,
            difficulty=req.difficulty,
            format_mode="MULTIPLE_CHOICE",
            total_questions=req.total_questions,
            coverage_percent=95.0
        )
        saved_quiz = self.quiz_repo.create(quiz)

        questions: List[AIQuizQuestion] = []
        for i in range(req.total_questions):
            chunk = chunks[i % len(chunks)]
            heading = chunk.heading or f"Phần kiến thức trang {chunk.page_number}"
            snippet = chunk.content[:200] if chunk.content else "Nội dung bài giảng"

            # Create realistic options based on chunk content
            q_text = f"Câu hỏi {i + 1}: Theo nội dung bài giảng tại mục '{heading}', khái niệm hoặc kết luận nào sau đây là chính xác?"
            options = {
                "A": f"Nguyên lý chính được trình bày: {snippet[:80]}...",
                "B": "Khẳng định này hoàn toàn trái ngược với định lý trong tài liệu.",
                "C": "Hiện tượng chỉ xảy ra trong điều kiện ngoại lệ không được đề cập.",
                "D": "Không có cơ sở lý thuyết nào hỗ trợ cho mệnh đề này."
            }

            question = AIQuizQuestion(
                quiz_id=saved_quiz.id,
                question_index=i + 1,
                question_text=q_text,
                options_json=options,
                correct_answer="A",
                explanation=f"Căn cứ chính xác theo phân đoạn kiến thức tại trang {chunk.page_number}: '{snippet[:120]}...'",
                source_heading=heading,
                source_page=chunk.page_number,
                source_snippet=snippet
            )
            saved_q = self.question_repo.create(question)
            questions.append(saved_q)

        question_items = [
            QuizQuestionItem(
                id=q.id,
                question_index=q.question_index,
                question_text=q.question_text,
                options=q.options_json if isinstance(q.options_json, dict) else json.loads(q.options_json),
                source_heading=q.source_heading,
                source_page=q.source_page,
                source_snippet=q.source_snippet
            )
            for q in questions
        ]

        return QuizDetailResponse(
            id=saved_quiz.id,
            document_id=saved_quiz.document_id,
            title=saved_quiz.title,
            difficulty=saved_quiz.difficulty,
            format_mode=saved_quiz.format_mode,
            total_questions=saved_quiz.total_questions,
            coverage_percent=saved_quiz.coverage_percent,
            questions=question_items,
            created_at=saved_quiz.created_at or datetime.now(timezone.utc)
        )

    def get_quiz_for_taking(self, quiz_id: UUID) -> QuizDetailResponse:
        quiz = self.quiz_repo.get_with_questions(quiz_id)
        if not quiz:
            raise ResourceNotFoundException(f"Không tìm thấy bộ đề thi trắc nghiệm với mã: {quiz_id}")

        question_items = [
            QuizQuestionItem(
                id=q.id,
                question_index=q.question_index,
                question_text=q.question_text,
                options=q.options_json if isinstance(q.options_json, dict) else json.loads(q.options_json),
                source_heading=q.source_heading,
                source_page=q.source_page,
                source_snippet=q.source_snippet
            )
            for q in sorted(quiz.questions, key=lambda x: x.question_index)
        ]

        return QuizDetailResponse(
            id=quiz.id,
            document_id=quiz.document_id,
            title=quiz.title,
            difficulty=quiz.difficulty,
            format_mode=quiz.format_mode,
            total_questions=quiz.total_questions,
            coverage_percent=quiz.coverage_percent,
            questions=question_items,
            created_at=quiz.created_at or datetime.now(timezone.utc)
        )

    def submit_quiz(self, user_id: UUID, quiz_id: UUID, req: SubmitQuizRequest) -> QuizSubmissionResultResponse:
        quiz = self.quiz_repo.get_with_questions(quiz_id)
        if not quiz:
            raise ResourceNotFoundException(f"Không tìm thấy bộ đề thi với mã: {quiz_id}")

        if not quiz.questions:
            raise ValidationException("Bộ đề thi chưa có danh sách câu hỏi để chấm điểm")

        # Map questions by ID
        q_map = {q.id: q for q in quiz.questions}
        score = 0
        details: List[QuestionGradingResult] = []

        # Map submitted answers
        submitted_map = {a.question_id: a.selected_option.strip().upper() for a in req.answers}

        for q in sorted(quiz.questions, key=lambda x: x.question_index):
            selected = submitted_map.get(q.id, "")
            is_correct = (selected == q.correct_answer.strip().upper())
            if is_correct:
                score += 1

            details.append(
                QuestionGradingResult(
                    question_id=q.id,
                    question_index=q.question_index,
                    question_text=q.question_text,
                    selected_option=selected,
                    correct_answer=q.correct_answer,
                    is_correct=is_correct,
                    explanation=q.explanation,
                    source_page=q.source_page,
                    source_heading=q.source_heading
                )
            )

        total = len(quiz.questions)
        percentage = round((score / total) * 100, 2) if total > 0 else 0.0

        if percentage >= 80.0:
            feedback = "Xuất sắc! Bạn đã nắm rất vững kiến thức trọng tâm của tài liệu này."
        elif percentage >= 50.0:
            feedback = "Khá tốt! Bạn đã hiểu phần lớn nội dung, hãy xem lại các câu sai để hoàn thiện."
        else:
            feedback = "Cần cố gắng thêm. Hãy đọc kỹ lại các trang tài liệu được trích dẫn để ôn tập."

        attempt = UserQuizAttempt(
            user_id=user_id,
            quiz_id=quiz_id,
            score=score,
            total_questions=total,
            percentage=percentage,
            time_spent_seconds=req.time_spent_seconds,
            completed_at=datetime.now(timezone.utc)
        )
        saved_attempt = self.attempt_repo.create(attempt)

        # Log interaction: QUIZ_PRACTICE reward score = 4.0
        interaction = UserDocumentInteraction(
            user_id=user_id,
            document_id=quiz.document_id,
            interaction_type="QUIZ_PRACTICE",
            duration_seconds=req.time_spent_seconds,
            pages_viewed=total,
            reward_score=4.0
        )
        self.interaction_repo.create(interaction)

        return QuizSubmissionResultResponse(
            attempt_id=saved_attempt.id,
            quiz_id=quiz.id,
            score=score,
            total_questions=total,
            percentage=percentage,
            time_spent_seconds=req.time_spent_seconds,
            feedback=feedback,
            details=details,
            completed_at=saved_attempt.completed_at or datetime.now(timezone.utc)
        )

    def get_user_history(self, user_id: UUID) -> List[QuizAttemptHistoryItem]:
        attempts = self.attempt_repo.get_by_user_id(user_id=user_id)
        result: List[QuizAttemptHistoryItem] = []

        for att in attempts:
            quiz = self.quiz_repo.get_by_id(att.quiz_id)
            title = quiz.title if quiz else "Bài thi trắc nghiệm học thuật"
            result.append(
                QuizAttemptHistoryItem(
                    id=att.id,
                    quiz_id=att.quiz_id,
                    quiz_title=title,
                    score=att.score,
                    total_questions=att.total_questions,
                    percentage=att.percentage,
                    time_spent_seconds=att.time_spent_seconds,
                    completed_at=att.completed_at or datetime.now(timezone.utc)
                )
            )
        return result
