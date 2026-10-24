from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session, joinedload

from app.models.ai_models import AIChatSession, AIChatMessage
from app.repositories.base_repository import BaseRepository

class ChatSessionRepository(BaseRepository[AIChatSession]):
    def __init__(self, db: Session):
        super().__init__(AIChatSession, db)

    def get_with_messages(self, session_id: UUID) -> Optional[AIChatSession]:
        return (
            self.db.query(AIChatSession)
            .options(joinedload(AIChatSession.messages))
            .filter(AIChatSession.id == session_id)
            .first()
        )

    def get_by_user_and_doc(self, user_id: UUID, document_id: UUID) -> List[AIChatSession]:
        return (
            self.db.query(AIChatSession)
            .filter(AIChatSession.user_id == user_id, AIChatSession.document_id == document_id)
            .order_by(AIChatSession.created_at.desc())
            .all()
        )


class ChatMessageRepository(BaseRepository[AIChatMessage]):
    def __init__(self, db: Session):
        super().__init__(AIChatMessage, db)

    def get_by_session_id(self, session_id: UUID) -> List[AIChatMessage]:
        return (
            self.db.query(AIChatMessage)
            .filter(AIChatMessage.session_id == session_id)
            .order_by(AIChatMessage.created_at.asc())
            .all()
        )
