import uuid

def test_get_trending_recommendations_api(client):
    res = client.get("/api/v1/recommendations/trending?limit=5")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "items" in data["data"]
    assert len(data["data"]["items"]) <= 5

def test_get_personal_recommendations_unauthorized(client):
    res = client.get("/api/v1/recommendations/me")
    assert res.status_code == 401
    assert res.json()["success"] is False

def test_get_personal_recommendations_authorized(client, auth_headers):
    res = client.get("/api/v1/recommendations/me?major=Software+Engineering", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "items" in data["data"]

def test_get_related_recommendations_api(client):
    doc_id = str(uuid.uuid4())
    res = client.get(f"/api/v1/recommendations/related/{doc_id}?limit=3")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "items" in data["data"]
