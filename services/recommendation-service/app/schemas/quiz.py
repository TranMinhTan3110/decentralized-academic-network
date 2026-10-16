from datetime import datetime
from uuid import UUID
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class GenerateQuizRequest(BaseModel):
    document_id: UUID
    difficulty: str = Field(default="ADVANCED", description="BASIC, ADVANCED, OLYMPIC")
    total_questions: int = Field(default=5, ge=1, le=20)
    title: Optional[str] = None


class QuizQuestionItem(BaseModel):
    id: UUID
    question_index: int
    question_text: str
    options: Dict[str, str]
    source_heading: Optional[str] = None
    source_page: Optional[int] = None
    source_snippet: Optional[str] = None


class QuizDetailResponse(BaseModel):
    id: UUID
    document_id: UUID
    title: str
    difficulty: str
    format_mode: str
    total_questions: int
    coverage_percent: float
    questions: List[QuizQuestionItem]
    created_at: datetime


class SubmitAnswerItem(BaseModel):
    question_id: UUID
    selected_option: str = Field(..., description="Phương án chọn: A, B, C, D")


class SubmitQuizRequest(BaseModel):
    answers: List[SubmitAnswerItem]
    time_spent_seconds: int = Field(default=0, ge=0)


class QuestionGradingResult(BaseModel):
    question_id: UUID
    question_index: int
    question_text: str
    selected_option: str
    correct_answer: str
    is_correct: bool
    explanation: Optional[str] = None
    source_page: Optional[int] = None
    source_heading: Optional[str] = None


class QuizSubmissionResultResponse(BaseModel):
    attempt_id: UUID
    quiz_id: UUID
    score: int
    total_questions: int
    percentage: float
    time_spent_seconds: int
    feedback: str
    details: List[QuestionGradingResult]
    completed_at: datetime


class QuizAttemptHistoryItem(BaseModel):
    id: UUID
    quiz_id: UUID
    quiz_title: str
    score: int
    total_questions: int
    percentage: float
    time_spent_seconds: int
    completed_at: datetime
