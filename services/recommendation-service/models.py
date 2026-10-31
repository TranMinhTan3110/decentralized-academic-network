# Re-export from app.models.ai_models for backward compatibility and Alembic
from app.models.ai_models import (
    DocumentChunk,
    AIQuiz,
    AIQuizQuestion,
    UserQuizAttempt,
    UserDocumentInteraction,
    AIChatSession,
    AIChatMessage,
)

__all__ = [
    "DocumentChunk",
    "AIQuiz",
    "AIQuizQuestion",
    "UserQuizAttempt",
    "UserDocumentInteraction",
    "AIChatSession",
    "AIChatMessage",
]
