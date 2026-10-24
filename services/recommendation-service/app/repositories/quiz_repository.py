from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session, joinedload

from app.models.ai_models import AIQuiz, AIQuizQuestion, UserQuizAttempt
from app.repositories.base_repository import BaseRepository

class AIQuizRepository(BaseRepository[AIQuiz]):
    def __init__(self, db: Session):
        super().__init__(AIQuiz, db)

    def get_with_questions(self, quiz_id: UUID) -> Optional[AIQuiz]:
        return (
            self.db.query(AIQuiz)
            .options(joinedload(AIQuiz.questions))
            .filter(AIQuiz.id == quiz_id)
            .first()
        )

    def get_by_document_id(self, document_id: UUID) -> List[AIQuiz]:
        return (
            self.db.query(AIQuiz)
            .filter(AIQuiz.document_id == document_id)
            .order_by(AIQuiz.created_at.desc())
            .all()
        )


class AIQuizQuestionRepository(BaseRepository[AIQuizQuestion]):
    def __init__(self, db: Session):
        super().__init__(AIQuizQuestion, db)

    def get_by_quiz_id(self, quiz_id: UUID) -> List[AIQuizQuestion]:
        return (
            self.db.query(AIQuizQuestion)
            .filter(AIQuizQuestion.quiz_id == quiz_id)
            .order_by(AIQuizQuestion.question_index.asc())
            .all()
        )


class UserQuizAttemptRepository(BaseRepository[UserQuizAttempt]):
    def __init__(self, db: Session):
        super().__init__(UserQuizAttempt, db)

    def get_by_user_id(self, user_id: UUID, limit: int = 50) -> List[UserQuizAttempt]:
        return (
            self.db.query(UserQuizAttempt)
            .filter(UserQuizAttempt.user_id == user_id)
            .order_by(UserQuizAttempt.completed_at.desc())
            .limit(limit)
            .all()
        )
