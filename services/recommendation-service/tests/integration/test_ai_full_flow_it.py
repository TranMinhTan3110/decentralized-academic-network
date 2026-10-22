import uuid
from app.core.database import SessionLocal
from app.events.kafka_consumer import KafkaEventConsumer
from app.services.recommendation_service import RecommendationService
from app.services.quiz_service import QuizService
from app.schemas.quiz import GenerateQuizRequest, SubmitQuizRequest, SubmitAnswerItem
from app.models.ai_models import DocumentChunk, AIQuiz, UserQuizAttempt, UserDocumentInteraction

def test_ai_full_flow_integration():
    """
    End-to-End Integration Test on real ai_service_db:
    1. Kafka Ingestion: DOCUMENT_UPLOADED triggers chunking & content validation.
    2. Recommendation: Trending & Personal recommendations query real DB interactions.
    3. Quiz Generation: Generates quiz questions directly from real stored chunks.
    4. Quiz Submission & Scoring: Submits answers, calculates score & updates user attempt history.
    """
    db = SessionLocal()
    doc_id = uuid.uuid4()
    user_id = uuid.uuid4()

    try:
        # Step 1: Kafka consumer processes DOCUMENT_UPLOADED event
        consumer = KafkaEventConsumer()
        academic_text = (
            f"Tài liệu IT {doc_id}: Trí tuệ nhân tạo và học máy hiện đại. "
            "Các giải thuật học có giám sát bao gồm hồi quy tuyến tính và cây quyết định. "
        ) * 6

        msg_result = consumer.process_message(
            {
                "eventType": "DOCUMENT_UPLOADED",
                "documentId": str(doc_id),
                "title": "Học máy cơ bản",
                "rawText": academic_text
            },
            db=db
        )
        assert msg_result["status"] == "PROCESSED"
        assert msg_result["validationStatus"] == "VALID"
        assert msg_result["totalChunks"] >= 1

        # Step 2: Recommendations
        rec_service = RecommendationService(db)
        trending = rec_service.get_trending_recommendations(limit=5)
        assert trending.total >= 1

        personal = rec_service.get_personal_recommendations(user_id=user_id, limit=5)
        assert personal.total >= 1

        # Step 3: Quiz Generation from real chunks
        quiz_service = QuizService(db)
        gen_req = GenerateQuizRequest(
            document_id=doc_id,
            difficulty="ADVANCED",
            total_questions=2,
            title="Đề thi IT"
        )
        quiz_resp = quiz_service.generate_quiz(user_id=user_id, req=gen_req)
        assert quiz_resp.total_questions == 2
        assert len(quiz_resp.questions) == 2
        q1_id = quiz_resp.questions[0].id

        # Step 4: Submit Quiz
        sub_req = SubmitQuizRequest(
            answers=[
                SubmitAnswerItem(question_id=q1_id, selected_option="A")
            ],
            time_spent_seconds=40
        )
        grade_resp = quiz_service.submit_quiz(user_id=user_id, quiz_id=quiz_resp.id, req=sub_req)
        assert grade_resp.score >= 0
        assert grade_resp.total_questions == 2

        # Step 5: Verify history
        history = quiz_service.get_user_history(user_id=user_id)
        assert len(history) >= 1
        assert history[0].quiz_id == quiz_resp.id

    finally:
        # Cleanup
        db.query(UserQuizAttempt).filter(UserQuizAttempt.user_id == user_id).delete()
        db.query(AIQuiz).filter(AIQuiz.document_id == doc_id).delete()
        db.query(UserDocumentInteraction).filter(UserDocumentInteraction.document_id == doc_id).delete()
        db.query(DocumentChunk).filter(DocumentChunk.document_id == doc_id).delete()
        db.commit()
        db.close()
