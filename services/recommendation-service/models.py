import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, UniqueConstraint, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from database import Base

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    page_number = Column(Integer, nullable=False)
    heading = Column(String(255))
    content = Column(Text, nullable=False)
    formula = Column(Text)
    token_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint('document_id', 'chunk_index', name='uq_doc_chunk'),
    )


class AIQuiz(Base):
    __tablename__ = "ai_quizzes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), nullable=False)
    creator_user_id = Column(UUID(as_uuid=True))
    title = Column(String(255), nullable=False)
    difficulty = Column(String(30), default="ADVANCED")
    format_mode = Column(String(30), default="MULTIPLE_CHOICE")
    total_questions = Column(Integer, nullable=False, default=5)
    coverage_percent = Column(Float, default=95.0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    questions = relationship("AIQuizQuestion", back_populates="quiz", cascade="all, delete-orphan")


class AIQuizQuestion(Base):
    __tablename__ = "ai_quiz_questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quiz_id = Column(UUID(as_uuid=True), ForeignKey("ai_quizzes.id", ondelete="CASCADE"), nullable=False)
    question_index = Column(Integer, nullable=False)
    question_text = Column(Text, nullable=False)
    options_json = Column(JSONB, nullable=False)
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text)
    source_heading = Column(String(255))
    source_page = Column(Integer)
    source_snippet = Column(Text)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    quiz = relationship("AIQuiz", back_populates="questions")


class UserQuizAttempt(Base):
    __tablename__ = "user_quiz_attempts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    quiz_id = Column(UUID(as_uuid=True), ForeignKey("ai_quizzes.id", ondelete="CASCADE"), nullable=False)
    score = Column(Integer, nullable=False)
    total_questions = Column(Integer, nullable=False)
    percentage = Column(Float, nullable=False)
    time_spent_seconds = Column(Integer, default=0)
    completed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class UserDocumentInteraction(Base):
    __tablename__ = "user_document_interactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    document_id = Column(UUID(as_uuid=True), nullable=False)
    interaction_type = Column(String(50), nullable=False)  # 'VIEW', 'LIKE', 'DOWNLOAD', 'BOOKMARK'
    duration_seconds = Column(Integer, default=0)
    pages_viewed = Column(Integer, default=1)
    reward_score = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class AIChatSession(Base):
    __tablename__ = "ai_chat_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True))
    document_id = Column(UUID(as_uuid=True), nullable=False)
    title = Column(String(255), default="Hỏi đáp bài giảng AI")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    messages = relationship("AIChatMessage", back_populates="session", cascade="all, delete-orphan")


class AIChatMessage(Base):
    __tablename__ = "ai_chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("ai_chat_sessions.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False)  # 'user', 'assistant'
    content = Column(Text, nullable=False)
    sources_found_json = Column(JSONB)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    session = relationship("AIChatSession", back_populates="messages")
