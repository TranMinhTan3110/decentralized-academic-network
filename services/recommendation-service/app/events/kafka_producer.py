import json
from typing import Dict, Any, Optional

from app.core.config import settings

class KafkaEventProducer:
    def __init__(self, bootstrap_servers: Optional[str] = None):
        self.bootstrap_servers = bootstrap_servers or settings.KAFKA_BOOTSTRAP_SERVERS
        self._producer = None

    def _get_producer(self):
        if self._producer is None:
            try:
                from kafka import KafkaProducer
                self._producer = KafkaProducer(
                    bootstrap_servers=self.bootstrap_servers,
                    value_serializer=lambda v: json.dumps(v).encode("utf-8"),
                    request_timeout_ms=3000,
                    max_block_ms=3000
                )
            except Exception as e:
                # Non-blocking graceful fallback
                print(f">> [Kafka Producer Warning] Không thể kết nối Kafka broker: {e}")
                self._producer = None
        return self._producer

    def send_event(self, topic: str, event_data: Dict[str, Any]) -> bool:
        producer = self._get_producer()
        if not producer:
            return False
        try:
            future = producer.send(topic, value=event_data)
            producer.flush(timeout=2)
            return True
        except Exception as e:
            print(f">> [Kafka Send Error] Gửi event sang topic {topic} thất bại: {e}")
            return False

    def publish_document_validated(self, document_id: str, status: str, total_chunks: int) -> bool:
        return self.send_event("ai-events", {
            "eventType": "DOCUMENT_VALIDATED",
            "documentId": document_id,
            "status": status,
            "totalChunks": total_chunks
        })

    def publish_quiz_completed(self, user_id: str, quiz_id: str, score: int, percentage: float, attempt_id: Optional[str] = None) -> bool:
        sent_ai = self.send_event("ai-events", {
            "eventType": "QUIZ_COMPLETED",
            "userId": user_id,
            "quizId": quiz_id,
            "attemptId": attempt_id,
            "score": score,
            "percentage": percentage
        })
        if percentage >= 80.0:
            idemp_key = f"quiz-{user_id}-{attempt_id or quiz_id}"
            self.send_event("user-reputation-events", {
                "userId": user_id,
                "actionType": "COMPLETE_QUIZ",
                "points": 5,
                "referenceId": quiz_id,
                "description": f"Hoàn thành bài trắc nghiệm AI đạt {percentage}%",
                "idempotencyKey": idemp_key
            })
        return sent_ai

event_producer = KafkaEventProducer()
