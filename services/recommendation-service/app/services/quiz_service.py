import os
import re
import json
import uuid
import random
import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.ai_models import AIQuiz, AIQuizQuestion, UserQuizAttempt, UserDocumentInteraction, DocumentChunk
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
from app.core.config import settings

logger = logging.getLogger(__name__)

class QuizService:
    def __init__(self, db: Session):
        self.db = db
        self.quiz_repo = AIQuizRepository(db)
        self.question_repo = AIQuizQuestionRepository(db)
        self.attempt_repo = UserQuizAttemptRepository(db)
        self.chunk_repo = DocumentChunkRepository(db)
        self.interaction_repo = InteractionRepository(db)

    def _generate_quiz_with_llm(
        self,
        chunks: List[DocumentChunk],
        total_questions: int,
        difficulty: str
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Sinh đề trắc nghiệm thông minh sử dụng OpenAI LLM (gpt-4o-mini)
        dựa trên các phân đoạn kiến thức của tài liệu.
        """
        if not settings.OPENAI_API_KEY or "PYTEST_CURRENT_TEST" in os.environ:
            return None

        try:
            import httpx

            # Thu thập ngữ cảnh đại diện phân bổ đều từ các chunks
            context_blocks = []
            step = max(1, len(chunks) // total_questions) if chunks else 1
            for i in range(min(total_questions * 2, len(chunks))):
                c = chunks[(i * step) % len(chunks)]
                heading = c.heading or f"Nội dung trang {c.page_number}"
                context_blocks.append(
                    f"--- Phân đoạn tại trang {c.page_number} ({heading}) ---\n{c.content}"
                )

            context_str = "\n\n".join(context_blocks[:8])

            difficulty_labels = {
                "BASIC": "cơ bản (nhận biết, định nghĩa cốt lõi)",
                "ADVANCED": "nâng cao (thông hiểu, phân tích nguyên lý)",
                "OLYMPIC": "chuyên sâu (tình huống thực tế, giải quyết vấn đề)"
            }
            diff_text = difficulty_labels.get(difficulty, "nâng cao")

            system_prompt = (
                "Bạn là Chuyên gia Khảo thí và Giảng viên AI DeDocu. "
                "Nhiệm vụ của bạn là đọc kỹ tài liệu học tập được cung cấp và biên soạn bộ đề thi trắc nghiệm khách quan 4 lựa chọn (A, B, C, D) "
                f"với mức độ {diff_text}. "
                "CÁC QUY TẮC BẮT BUỘC:\n"
                "1. Tuyệt đối KHÔNG viết tiền tố 'Câu 1:', 'Câu hỏi 1:', '1.' ở phần question_text (vì giao diện đã tự động gắn số thứ tự câu hỏi). Chỉ ghi nội dung câu hỏi trực tiếp.\n"
                "2. Nội dung câu hỏi phải đa dạng: định nghĩa, nhận định đúng/sai, áp dụng tình huống thực tế, so sánh cơ chế.\n"
                "3. Bốn phương án A, B, C, D phải chứa nội dung chuyên môn thực tế bám sát tài liệu bài học, có tính gây nhiễu tốt (plausible distractors), văn phong chuẩn mực học thuật.\n"
                "4. Vị trí đáp án đúng ('correct_answer') BẮT BUỘC phải được phân bố ngẫu nhiên và đa dạng giữa 'A', 'B', 'C', 'D' (TUYỆT ĐỐI KHÔNG luôn luôn gán là 'A').\n"
                "5. Phần 'explanation' giải thích rõ ràng tại sao đáp án được chọn là chính xác dựa theo ngữ cảnh tài liệu.\n"
                "6. Trả về đúng định dạng JSON theo schema đã chỉ định."
            )

            user_prompt = (
                f"Dưới đây là các đoạn văn bản trích xuất từ tài liệu học tập:\n\n{context_str}\n\n"
                f"Hãy tạo đúng {total_questions} câu hỏi trắc nghiệm 4 lựa chọn bằng tiếng Việt dưới định dạng JSON với cấu trúc:\n"
                "{\n"
                '  "questions": [\n'
                "    {\n"
                '      "question_text": "Nội dung câu hỏi...",\n'
                '      "options": {\n'
                '        "A": "Nội dung phương án A",\n'
                '        "B": "Nội dung phương án B",\n'
                '        "C": "Nội dung phương án C",\n'
                '        "D": "Nội dung phương án D"\n'
                "      },\n"
                '      "correct_answer": "A",\n'
                '      "explanation": "Lời giải chi tiết...",\n'
                '      "source_heading": "Tiêu đề phần kiến thức",\n'
                '      "source_page": 1,\n'
                '      "source_snippet": "Trích dẫn câu then chốt từ tài liệu"\n'
                "    }\n"
                "  ]\n"
                "}"
            )

            res = httpx.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.5,
                    "max_tokens": 3000
                },
                timeout=35.0
            )

            if res.status_code == 200:
                payload = res.json()
                content_str = payload["choices"][0]["message"]["content"]
                parsed = json.loads(content_str)
                raw_qs = parsed.get("questions", [])
                valid_qs: List[Dict[str, Any]] = []
                letters = {"A", "B", "C", "D"}

                for q in raw_qs:
                    q_text = str(q.get("question_text", "")).strip()
                    # Loại bỏ triệt để tiền tố lặp 'Câu X:' nếu LLM vô tình sinh ra
                    q_text = re.sub(r'^(Câu|Câu hỏi)\s*\d+\s*[:.-]\s*', '', q_text, flags=re.IGNORECASE).strip()
                    options = q.get("options", {})
                    correct = str(q.get("correct_answer", "")).strip().upper()

                    if q_text and isinstance(options, dict) and letters.issubset(options.keys()) and correct in letters:
                        valid_qs.append({
                            "question_text": q_text,
                            "options": {k: str(options[k]).strip() for k in ["A", "B", "C", "D"]},
                            "correct_answer": correct,
                            "explanation": str(q.get("explanation", "Căn cứ theo nội dung bài giảng.")).strip(),
                            "source_heading": str(q.get("source_heading", "")).strip() or "Nội dung bài giảng",
                            "source_page": int(q.get("source_page", 1)),
                            "source_snippet": str(q.get("source_snippet", "")).strip()
                        })

                if len(valid_qs) >= total_questions:
                    return valid_qs[:total_questions]
                elif len(valid_qs) > 0:
                    return valid_qs
        except Exception as e:
            logger.warning(f"[QuizService] LLM generate quiz failed, falling back to heuristic: {e}")

        return None

    def _generate_quiz_heuristic(
        self,
        chunks: List[DocumentChunk],
        total_questions: int,
        difficulty: str
    ) -> List[Dict[str, Any]]:
        """
        Thuật toán Heuristic thông minh sinh đề thi khi offline hoặc không có API key:
        - Đa dạng hóa mẫu câu hỏi linh hoạt, không lặp tiền tố 'Câu hỏi X:'
        - Trích xuất ý chính thực tế từ các chunks làm đáp án đúng
        - Lấy distractors từ các chunks khác nhau trong cùng tài liệu (cross-chunk sampling)
        - Xáo trộn ngẫu nhiên vị trí đáp án đúng (A, B, C, D)
        """
        question_templates = [
            "Theo nội dung tại mục '{heading}', khẳng định nào sau đây phản ánh chính xác nhất nguyên lý được đề cập?",
            "Trong phần '{heading}', luận điểm hoặc đặc điểm trọng tâm nào dưới đây được áp dụng?",
            "Khái niệm hoặc cơ chế cốt lõi được trình bày trong mục '{heading}' là gì?",
            "Nhận định nào sau đây là ĐÚNG khi tìm hiểu về nội dung '{heading}'?",
            "Ý nghĩa hoặc mục tiêu chính được phân tích trong phần '{heading}' là gì?",
            "Đâu là phát biểu phù hợp với nội dung bài giảng tại mục '{heading}'?"
        ]

        generic_distractor_pool = [
            "Chỉ áp dụng khi không có ràng buộc về mặt hiệu năng hoặc tài nguyên hệ thống.",
            "Phương pháp này tập trung giải quyết các tác vụ ngoại vi mà không can thiệp vào kiến trúc lõi.",
            "Yêu cầu phải loại bỏ hoàn toàn tính phụ thuộc giữa các module trước khi thực thi.",
            "Nguyên lý này bị hạn chế bởi tính đồng bộ và chưa tối ưu hóa cho mô hình phân tán.",
            "Mô hình chỉ được khuyến nghị sử dụng trong môi trường kiểm thử cục bộ.",
            "Cơ chế này đã được thay thế hoàn toàn bởi các giải pháp quản lý trạng thái tự động.",
            "Khẳng định này không có cơ sở lý thuyết chứng minh trong phạm vi tài liệu bài giảng.",
            "Hiện tượng này chỉ xảy ra như một ngoại lệ tạm thời khi gặp lỗi phần cứng."
        ]

        # Thu thập các câu văn có ý nghĩa từ toàn bộ các chunks để làm distractors phong phú
        all_sentences: List[str] = []
        for c in chunks:
            if c.content:
                parts = [s.strip() for s in re.split(r'[\n\.]+', c.content) if len(s.strip()) >= 35]
                all_sentences.extend(parts)

        results: List[Dict[str, Any]] = []
        num_chunks = len(chunks)

        for i in range(total_questions):
            target_chunk = chunks[i % num_chunks]
            heading = target_chunk.heading or f"Kiến thức trang {target_chunk.page_number}"
            # Dọn dẹp heading nếu có tiền tố thừa
            heading = re.sub(r'^(Trang\s*\d+\s*:\s*)', '', heading).strip() or f"Phần {i + 1}"

            # 1. Sinh câu hỏi từ template luân phiên
            tpl = question_templates[i % len(question_templates)]
            q_text = tpl.format(heading=heading)

            # 2. Trích xuất câu đúng từ target_chunk
            target_sentences = [
                s.strip() for s in re.split(r'[\n\.]+', target_chunk.content or '') if len(s.strip()) >= 30
            ]
            if target_sentences:
                chosen_sentence = target_sentences[0]
                # Cắt gọn câu nếu quá dài
                if len(chosen_sentence) > 130:
                    chosen_sentence = chosen_sentence[:127] + "..."
                correct_content = f"Nguyên lý được xác nhận: {chosen_sentence}"
            else:
                snippet = (target_chunk.content or "Nội dung trọng tâm của bài giảng")[:100]
                correct_content = f"Trọng tâm phân tích: {snippet}..."

            # 3. Thu thập 3 distractors
            distractors: List[str] = []

            # Thử lấy từ các chunk lân cận (cross-chunk distractors)
            for offset in [1, 2, 3]:
                other_idx = (i + offset) % num_chunks
                if other_idx != (i % num_chunks):
                    other_chunk = chunks[other_idx]
                    other_sentences = [
                        s.strip() for s in re.split(r'[\n\.]+', other_chunk.content or '') if len(s.strip()) >= 35
                    ]
                    for s in other_sentences:
                        s_text = s[:120] + "..." if len(s) > 120 else s
                        candidate = f"Đặc tính liên quan: {s_text}"
                        if candidate not in distractors and candidate != correct_content:
                            distractors.append(candidate)
                            break
                if len(distractors) >= 3:
                    break

            # Bổ sung từ all_sentences hoặc generic pool nếu chưa đủ 3
            if len(distractors) < 3:
                for s in all_sentences:
                    candidate = f"Khái niệm tham chiếu: {s[:110]}..."
                    if candidate not in distractors and candidate != correct_content:
                        distractors.append(candidate)
                    if len(distractors) >= 3:
                        break

            # Nếu vẫn chưa đủ thì dùng generic pool
            pool_idx = (i * 2) % len(generic_distractor_pool)
            while len(distractors) < 3:
                cand = generic_distractor_pool[pool_idx % len(generic_distractor_pool)]
                if cand not in distractors:
                    distractors.append(cand)
                pool_idx += 1

            distractors = distractors[:3]

            # 4. Xáo trộn ngẫu nhiên vị trí đáp án đúng (A, B, C, D)
            letters = ["A", "B", "C", "D"]
            correct_letter = random.choice(letters)

            options: Dict[str, str] = {}
            distractor_idx = 0
            for letter in letters:
                if letter == correct_letter:
                    options[letter] = correct_content
                else:
                    options[letter] = distractors[distractor_idx]
                    distractor_idx += 1

            snippet_ref = (target_chunk.content or "")[:150]
            explanation = (
                f"Căn cứ chính xác theo phân đoạn kiến thức tại trang {target_chunk.page_number} "
                f"(mục '{heading}'): '{correct_content}'"
            )

            results.append({
                "question_text": q_text,
                "options": options,
                "correct_answer": correct_letter,
                "explanation": explanation,
                "source_heading": heading,
                "source_page": target_chunk.page_number,
                "source_snippet": snippet_ref
            })

        return results

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

        # 1. Ưu tiên sinh câu hỏi bằng OpenAI LLM (gpt-4o-mini)
        raw_questions = self._generate_quiz_with_llm(
            chunks=chunks,
            total_questions=req.total_questions,
            difficulty=req.difficulty
        )

        # 2. Tự động fallback sang thuật toán Heuristic thông minh nếu không có LLM
        if not raw_questions:
            raw_questions = self._generate_quiz_heuristic(
                chunks=chunks,
                total_questions=req.total_questions,
                difficulty=req.difficulty
            )

        questions: List[AIQuizQuestion] = []
        for i, raw_q in enumerate(raw_questions):
            question = AIQuizQuestion(
                quiz_id=saved_quiz.id,
                question_index=i + 1,
                question_text=raw_q["question_text"],
                options_json=raw_q["options"],
                correct_answer=raw_q["correct_answer"],
                explanation=raw_q["explanation"],
                source_heading=raw_q.get("source_heading", f"Phần {i + 1}"),
                source_page=raw_q.get("source_page", 1),
                source_snippet=raw_q.get("source_snippet", "")
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
