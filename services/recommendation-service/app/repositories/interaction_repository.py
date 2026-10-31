from typing import List, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.models.ai_models import UserDocumentInteraction
from app.repositories.base_repository import BaseRepository

class InteractionRepository(BaseRepository[UserDocumentInteraction]):
    def __init__(self, db: Session):
        super().__init__(UserDocumentInteraction, db)

    def get_by_user_id(self, user_id: UUID, limit: int = 100) -> List[UserDocumentInteraction]:
        return (
            self.db.query(UserDocumentInteraction)
            .filter(UserDocumentInteraction.user_id == user_id)
            .order_by(UserDocumentInteraction.created_at.desc())
            .limit(limit)
            .all()
        )

    def get_trending_documents(self, limit: int = 10) -> List[Tuple[UUID, float, int]]:
        """
        Aggregate total reward_score and interaction count per document
        Returns list of (document_id, total_score, interaction_count)
        """
        results = (
            self.db.query(
                UserDocumentInteraction.document_id,
                func.sum(UserDocumentInteraction.reward_score).label("total_score"),
                func.count(UserDocumentInteraction.id).label("interaction_count"),
            )
            .group_by(UserDocumentInteraction.document_id)
            .order_by(desc("total_score"))
            .limit(limit)
            .all()
        )
        return [(r[0], float(r[1] or 0.0), int(r[2])) for r in results]

    def get_user_interacted_doc_ids(self, user_id: UUID) -> List[UUID]:
        rows = (
            self.db.query(UserDocumentInteraction.document_id)
            .filter(UserDocumentInteraction.user_id == user_id)
            .distinct()
            .all()
        )
        return [r[0] for r in rows]
