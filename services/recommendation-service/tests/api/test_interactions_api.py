import uuid

def test_log_interaction_unauthorized(client):
    doc_id = str(uuid.uuid4())
    res = client.post("/api/v1/interactions/log", json={
        "document_id": doc_id,
        "interaction_type": "VIEW",
        "duration_seconds": 45,
        "pages_viewed": 2
    })
    assert res.status_code == 401
    assert res.json()["success"] is False

def test_log_interaction_success(client, auth_headers):
    doc_id = str(uuid.uuid4())
    res = client.post("/api/v1/interactions/log", json={
        "document_id": doc_id,
        "interaction_type": "DOWNLOAD",
        "duration_seconds": 10,
        "pages_viewed": 1
    }, headers=auth_headers)

    assert res.status_code == 201
    data = res.json()
    assert data["success"] is True
    assert data["data"]["interaction_type"] == "DOWNLOAD"
    assert data["data"]["reward_score"] == 5.0
