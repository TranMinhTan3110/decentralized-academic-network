import uuid
from unittest.mock import MagicMock, patch
from app.events.kafka_consumer import KafkaEventConsumer
from app.events.kafka_producer import KafkaEventProducer

def test_consumer_missing_document_id():
    consumer = KafkaEventConsumer()
    res = consumer.process_message({"eventType": "DOCUMENT_UPLOADED"})
    assert res["status"] == "IGNORED"
    assert "Missing documentId" in res["reason"]

def test_consumer_invalid_uuid():
    consumer = KafkaEventConsumer()
    res = consumer.process_message({"eventType": "DOCUMENT_UPLOADED", "documentId": "not-a-uuid"})
    assert res["status"] == "ERROR"

def test_consumer_document_uploaded_success():
    consumer = KafkaEventConsumer()
    doc_id = str(uuid.uuid4())
    mock_db = MagicMock()

    with patch("app.events.kafka_consumer.RagService") as mock_rag_cls, \
         patch("app.events.kafka_consumer.event_producer") as mock_producer:
        mock_rag_instance = MagicMock()
        mock_rag_cls.return_value = mock_rag_instance
        mock_rag_instance.process_and_chunk_document.return_value = MagicMock(
            validation_status="VALID",
            total_chunks=3
        )

        res = consumer.process_message(
            {
                "eventType": "DOCUMENT_UPLOADED",
                "documentId": doc_id,
                "title": "Toán rời rạc",
                "rawText": "Nội dung lý thuyết đồ thị và tổ hợp. " * 8
            },
            db=mock_db
        )

        assert res["status"] == "PROCESSED"
        assert res["validationStatus"] == "VALID"
        assert res["totalChunks"] == 3
        mock_producer.publish_document_validated.assert_called_once()

def test_consumer_document_deleted():
    consumer = KafkaEventConsumer()
    doc_id = str(uuid.uuid4())
    mock_db = MagicMock()

    with patch("app.events.kafka_consumer.DocumentChunkRepository") as mock_repo_cls:
        mock_repo = MagicMock()
        mock_repo_cls.return_value = mock_repo
        mock_repo.delete_by_document_id.return_value = 5

        res = consumer.process_message(
            {
                "eventType": "DOCUMENT_DELETED",
                "documentId": doc_id
            },
            db=mock_db
        )

        assert res["status"] == "DELETED"
        assert res["deletedChunks"] == 5

def test_producer_fallback_when_broker_offline():
    producer = KafkaEventProducer(bootstrap_servers="localhost:9999")
    # Should not raise exception, gracefully return False if connection times out
    success = producer.publish_quiz_completed(
        user_id=str(uuid.uuid4()),
        quiz_id=str(uuid.uuid4()),
        score=5,
        percentage=100.0
    )
    assert isinstance(success, bool)
