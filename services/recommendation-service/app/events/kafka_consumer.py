import json
import uuid
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.services.rag_service import RagService
from app.repositories.chunk_repository import DocumentChunkRepository
from app.services.text_extractor import TextExtractor
from app.events.kafka_producer import event_producer

class KafkaEventConsumer:
    def __init__(self, bootstrap_servers: Optional[str] = None, topic: Optional[str] = None):
        self.bootstrap_servers = bootstrap_servers or settings.KAFKA_BOOTSTRAP_SERVERS
        self.topic = topic or settings.KAFKA_DOCUMENT_TOPIC

    def process_message(self, message_data: Dict[str, Any], db: Optional[Session] = None) -> Dict[str, Any]:
        """Process incoming document event payload from document-service"""
        event_type = message_data.get("eventType") or message_data.get("event_type")
        doc_id_str = message_data.get("documentId") or message_data.get("document_id")

        if not doc_id_str:
            return {"status": "IGNORED", "reason": "Missing documentId"}

        try:
            doc_id = uuid.UUID(str(doc_id_str))
        except (ValueError, TypeError):
            return {"status": "ERROR", "reason": "Invalid document UUID"}

        should_close_db = False
        if db is None:
            db = SessionLocal()
            should_close_db = True

        try:
            if event_type in ("DOCUMENT_UPLOADED", "DOCUMENT_APPROVED", "DOCUMENT_CREATED"):
                title = message_data.get("title", "Tài liệu học thuật")
                raw_text = message_data.get("rawText") or message_data.get("raw_text")
                file_path = message_data.get("filePath") or message_data.get("file_path")

                pages = []
                if raw_text:
                    pages = [{"page_number": 1, "text": raw_text}]
                elif file_path:
                    pages = TextExtractor.extract_from_path(file_path)
                else:
                    pages = [{"page_number": 1, "text": f"Nội dung tài liệu học thuật: {title}. " * 8}]

                rag_service = RagService(db)
                result = rag_service.process_and_chunk_document(
                    document_id=doc_id,
                    title=title,
                    pages=pages
                )

                # Send outbound event
                event_producer.publish_document_validated(
                    document_id=str(doc_id),
                    status=result.validation_status,
                    total_chunks=result.total_chunks
                )

                return {
                    "status": "PROCESSED",
                    "eventType": event_type,
                    "documentId": str(doc_id),
                    "validationStatus": result.validation_status,
                    "totalChunks": result.total_chunks
                }

            elif event_type in ("DOCUMENT_DELETED", "DOCUMENT_REMOVED"):
                chunk_repo = DocumentChunkRepository(db)
                deleted_count = chunk_repo.delete_by_document_id(doc_id)
                return {
                    "status": "DELETED",
                    "eventType": event_type,
                    "documentId": str(doc_id),
                    "deletedChunks": deleted_count
                }

            return {"status": "IGNORED", "reason": f"Unhandled eventType: {event_type}"}

        finally:
            if should_close_db:
                db.close()
