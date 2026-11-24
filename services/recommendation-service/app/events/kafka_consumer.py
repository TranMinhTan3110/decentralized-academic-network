import json
import time
import threading
import uuid
from typing import Dict, Any, Optional, List
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
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None

    @staticmethod
    def _fetch_pages_from_remote(doc_id: uuid.UUID, title: str, ipfs_cid: Optional[str], preview_cid: Optional[str]) -> List[Dict[str, Any]]:
        """
        Tự động kéo nội dung PDF của tài liệu mới đăng từ document-service preview endpoint
        hoặc trực tiếp từ IPFS Gateway để bóc tách chữ phục vụ RAG.
        """
        try:
            import httpx
            urls_to_try = [
                f"{settings.DOCUMENT_SERVICE_URL}/api/v1/documents/{doc_id}/attachments/0/preview",
            ]
            target_cid = preview_cid or ipfs_cid
            if target_cid:
                urls_to_try.append(f"{settings.IPFS_GATEWAY_URL}/{target_cid}")

            with httpx.Client(timeout=15.0, follow_redirects=True) as client:
                for url in urls_to_try:
                    try:
                        resp = client.get(url)
                        if resp.status_code == 200 and resp.content and len(resp.content) > 64:
                            extracted = TextExtractor.extract_from_bytes(resp.content, filename=f"{title}.pdf")
                            if extracted and any(p.get("text", "").strip() for p in extracted):
                                return extracted
                    except Exception:
                        continue
        except Exception:
            pass
        return []

    def process_message(self, message_data: Dict[str, Any], db: Optional[Session] = None) -> Dict[str, Any]:
        """
        Xử lý sự kiện từ Kafka topic document-events:
        - Tương thích với cả sự kiện chuẩn có eventType ("DOCUMENT_UPLOADED" / "DOCUMENT_DELETED")
        - Tương thích trực tiếp với payload DocumentUploadedEvent từ Java document-service
          ({documentId, userId, title, ipfsCid, previewIpfsCid, totalPages, universityId, courseId})
        """
        event_type = message_data.get("eventType") or message_data.get("event_type")
        interaction_type = message_data.get("interactionType") or message_data.get("interaction_type")
        doc_id_str = message_data.get("documentId") or message_data.get("document_id")

        if not doc_id_str:
            return {"status": "IGNORED", "reason": "Missing documentId"}

        try:
            doc_id = uuid.UUID(str(doc_id_str))
        except (ValueError, TypeError):
            return {"status": "ERROR", "reason": "Invalid document UUID"}

        # Tự suy luận event_type khi nhận payload trực tiếp từ Java DocumentEventProducer
        if not event_type:
            if interaction_type:
                return {"status": "IGNORED", "reason": f"Interaction event: {interaction_type}"}
            if any(k in message_data for k in ("ipfsCid", "previewIpfsCid", "title", "rawText", "filePath")):
                event_type = "DOCUMENT_UPLOADED"

        should_close_db = False
        if db is None:
            db = SessionLocal()
            should_close_db = True

        try:
            if event_type in ("DOCUMENT_UPLOADED", "DOCUMENT_APPROVED", "DOCUMENT_CREATED"):
                title = message_data.get("title", "Tài liệu học thuật")
                raw_text = message_data.get("rawText") or message_data.get("raw_text")
                file_path = message_data.get("filePath") or message_data.get("file_path")
                ipfs_cid = message_data.get("ipfsCid") or message_data.get("ipfs_cid")
                preview_cid = message_data.get("previewIpfsCid") or message_data.get("preview_ipfs_cid")

                pages: List[Dict[str, Any]] = []
                if raw_text:
                    pages = [{"page_number": 1, "text": raw_text}]
                elif file_path:
                    pages = TextExtractor.extract_from_path(file_path)
                elif ipfs_cid or preview_cid:
                    pages = self._fetch_pages_from_remote(doc_id, title, ipfs_cid, preview_cid)

                is_real_remote_upload = bool(ipfs_cid or preview_cid) and not raw_text and not file_path
                if not pages:
                    pages = [{"page_number": 1, "text": f"Nội dung tài liệu học thuật: {title}. " * 8}]

                rag_service = RagService(db)
                result = rag_service.process_and_chunk_document(
                    document_id=doc_id,
                    title=title,
                    pages=pages,
                    skip_validation=is_real_remote_upload
                )

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

    def _consume_loop(self) -> None:
        while not self._stop_event.is_set():
            consumer = None
            try:
                from kafka import KafkaConsumer
                consumer = KafkaConsumer(
                    self.topic,
                    bootstrap_servers=self.bootstrap_servers,
                    group_id="recommendation-ai-rag-consumer-group",
                    auto_offset_reset="latest",
                    enable_auto_commit=True,
                    value_deserializer=lambda m: json.loads(m.decode("utf-8", errors="ignore")),
                    consumer_timeout_ms=2000,
                )
                print(f">> [Kafka Consumer] Đang lắng nghe sự kiện tài liệu mới trên topic '{self.topic}'...")
                while not self._stop_event.is_set():
                    for msg in consumer:
                        if self._stop_event.is_set():
                            break
                        if isinstance(msg.value, dict):
                            res = self.process_message(msg.value)
                            if res.get("status") in ("PROCESSED", "DELETED"):
                                print(f">> [Kafka Consumer] Đã tự động đồng bộ RAG cho tài liệu {res.get('documentId')} ({res.get('status')}).")
            except Exception:
                # Nếu Kafka chưa bật ở môi trường dev đơn lẻ, đợi 15s rồi thử kết nối lại êm ái
                self._stop_event.wait(15.0)
            finally:
                if consumer is not None:
                    try:
                        consumer.close()
                    except Exception:
                        pass

    def start_background_worker(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._consume_loop, name="ai-kafka-doc-consumer", daemon=True)
        self._thread.start()

    def stop_background_worker(self) -> None:
        self._stop_event.set()


kafka_doc_consumer = KafkaEventConsumer()
