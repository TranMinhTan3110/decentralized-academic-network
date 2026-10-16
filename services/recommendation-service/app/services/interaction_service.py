from uuid import UUID
from sqlalchemy.orm import Session

from app.models.ai_models import UserDocumentInteraction
from app.repositories.interaction_repository import InteractionRepository
from app.schemas.interaction import LogInteractionRequest, InteractionResponse

class InteractionService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = InteractionRepository(db)

    def calculate_reward_score(self, interaction_type: str, duration_seconds: int, pages_viewed: int) -> float:
        """
        Calculates standardized reward scores:
        DOWNLOAD: 5.0
        QUIZ_PRACTICE: 4.0
        LIKE: 3.0
        BOOKMARK: 2.0
        VIEW: 1.0 (if duration >= 30s or pages >= 2), else 0.5
        """
        itype = interaction_type.strip().upper()
        if itype == "DOWNLOAD":
            return 5.0
        elif itype == "QUIZ_PRACTICE":
            return 4.0
        elif itype == "LIKE":
            return 3.0
        elif itype == "BOOKMARK":
            return 2.0
        elif itype == "VIEW":
            if duration_seconds >= 30 or pages_viewed >= 2:
                return 1.0
            return 0.5
        return 0.5

    def log_interaction(self, user_id: UUID, req: LogInteractionRequest) -> InteractionResponse:
        reward = self.calculate_reward_score(req.interaction_type, req.duration_seconds, req.pages_viewed)
        interaction = UserDocumentInteraction(
            user_id=user_id,
            document_id=req.document_id,
            interaction_type=req.interaction_type.strip().upper(),
            duration_seconds=req.duration_seconds,
            pages_viewed=req.pages_viewed,
            reward_score=reward
        )
        saved = self.repo.create(interaction)
        from datetime import datetime, timezone
        return InteractionResponse(
            id=saved.id,
            user_id=saved.user_id,
            document_id=saved.document_id,
            interaction_type=saved.interaction_type,
            reward_score=saved.reward_score,
            duration_seconds=saved.duration_seconds,
            pages_viewed=saved.pages_viewed,
            created_at=saved.created_at or datetime.now(timezone.utc)
        )
