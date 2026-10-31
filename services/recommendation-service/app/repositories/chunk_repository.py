from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.ai_models import DocumentChunk
from app.repositories.base_repository import BaseRepository

class DocumentChunkRepository(BaseRepository[DocumentChunk]):
    def __init__(self, db: Session):
        super().__init__(DocumentChunk, db)

    def get_by_document_id(self, document_id: UUID) -> List[DocumentChunk]:
        return (
            self.db.query(DocumentChunk)
            .filter(DocumentChunk.document_id == document_id)
            .order_by(DocumentChunk.chunk_index.asc())
            .all()
        )

    def delete_by_document_id(self, document_id: UUID) -> int:
        deleted = (
            self.db.query(DocumentChunk)
            .filter(DocumentChunk.document_id == document_id)
            .delete(synchronize_session=False)
        )
        self.db.commit()
        return deleted

    def search_chunks(self, document_id: UUID, query_text: str, limit: int = 5) -> List[DocumentChunk]:
        # Simple text search matching or chunk retrieval
        query = self.db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id)
        if query_text.strip():
            words = query_text.lower().split()
            # Rank chunks containing any words
            chunks = query.all()
            scored = []
            for c in chunks:
                content_lower = c.content.lower()
                score = sum(1 for w in words if w in content_lower)
                scored.append((score, c))
            scored.sort(key=lambda x: x[0], reverse=True)
            return [c for score, c in scored[:limit] if score > 0] or chunks[:limit]
        return query.limit(limit).all()
