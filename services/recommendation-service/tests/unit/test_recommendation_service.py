import uuid
from unittest.mock import MagicMock
from app.services.recommendation_service import RecommendationService
from app.models.ai_models import UserDocumentInteraction

def test_get_trending_recommendations_with_data():
    mock_db = MagicMock()
    service = RecommendationService(db=mock_db)
    doc1 = uuid.uuid4()
    doc2 = uuid.uuid4()

    service.repo.get_trending_documents = MagicMock(return_value=[
        (doc1, 25.0, 5),
        (doc2, 14.0, 3)
    ])

    res = service.get_trending_recommendations(limit=10)
    assert res.total == 2
    assert res.items[0].document_id == doc1
    assert res.items[0].score == 25.0
    assert "Thịnh hành" in res.items[0].reason

def test_get_personal_recommendations_cold_start():
    mock_db = MagicMock()
    service = RecommendationService(db=mock_db)
    user_id = uuid.uuid4()
    doc1 = uuid.uuid4()

    # User has no interactions
    service.repo.get_by_user_id = MagicMock(return_value=[])
    service.repo.get_trending_documents = MagicMock(return_value=[(doc1, 15.0, 3)])

    res = service.get_personal_recommendations(
        user_id=user_id,
        major="Khoa học máy tính",
        limit=5
    )
    assert res.total >= 1
    assert "Khoa học máy tính" in res.items[0].reason
    assert "Cold-Start" in res.algorithm_applied

def test_get_personal_recommendations_with_history():
    mock_db = MagicMock()
    service = RecommendationService(db=mock_db)
    user_id = uuid.uuid4()
    seen_doc = uuid.uuid4()
    unseen_doc = uuid.uuid4()

    service.repo.get_by_user_id = MagicMock(return_value=[
        UserDocumentInteraction(user_id=user_id, document_id=seen_doc, interaction_type="VIEW", reward_score=1.0)
    ])
    service.repo.get_trending_documents = MagicMock(return_value=[
        (unseen_doc, 20.0, 4),
        (seen_doc, 10.0, 2)
    ])
    mock_db.query().limit().all = MagicMock(return_value=[])

    res = service.get_personal_recommendations(user_id=user_id, limit=5, epsilon=0.0)
    assert res.total >= 1
    assert "Multi-Armed Bandit" in res.algorithm_applied
    assert res.items[0].document_id == unseen_doc

def test_get_related_recommendations():
    mock_db = MagicMock()
    service = RecommendationService(db=mock_db)
    doc_id = uuid.uuid4()
    related_doc = uuid.uuid4()
    user_id = uuid.uuid4()

    mock_db.query().filter().distinct().all = MagicMock(return_value=[(user_id,)])
    mock_db.query().filter().distinct().limit().all = MagicMock(return_value=[(related_doc,)])
    mock_db.query().filter().group_by().order_by().limit().all = MagicMock(return_value=[(related_doc, 3)])

    res = service.get_related_recommendations(document_id=doc_id, limit=5)
    assert res.total >= 1
    assert res.items[0].document_id == related_doc
