import uuid
from unittest.mock import MagicMock
from app.services.interaction_service import InteractionService
from app.schemas.interaction import LogInteractionRequest
from app.models.ai_models import UserDocumentInteraction

def test_calculate_reward_scores():
    service = InteractionService(db=MagicMock())
    assert service.calculate_reward_score("DOWNLOAD", 0, 1) == 5.0
    assert service.calculate_reward_score("QUIZ_PRACTICE", 0, 1) == 4.0
    assert service.calculate_reward_score("LIKE", 0, 1) == 3.0
    assert service.calculate_reward_score("BOOKMARK", 0, 1) == 2.0
    assert service.calculate_reward_score("VIEW", 40, 1) == 1.0
    assert service.calculate_reward_score("VIEW", 10, 3) == 1.0
    assert service.calculate_reward_score("VIEW", 5, 1) == 0.5
    assert service.calculate_reward_score("UNKNOWN", 0, 0) == 0.5

def test_log_interaction_service():
    mock_db = MagicMock()
    service = InteractionService(db=mock_db)
    user_id = uuid.uuid4()
    doc_id = uuid.uuid4()

    req = LogInteractionRequest(
        document_id=doc_id,
        interaction_type="DOWNLOAD",
        duration_seconds=120,
        pages_viewed=5
    )

    mock_saved = UserDocumentInteraction(
        id=uuid.uuid4(),
        user_id=user_id,
        document_id=doc_id,
        interaction_type="DOWNLOAD",
        reward_score=5.0,
        duration_seconds=120,
        pages_viewed=5
    )
    service.repo.create = MagicMock(return_value=mock_saved)

    resp = service.log_interaction(user_id=user_id, req=req)
    assert resp.user_id == user_id
    assert resp.document_id == doc_id
    assert resp.reward_score == 5.0
    assert resp.interaction_type == "DOWNLOAD"
