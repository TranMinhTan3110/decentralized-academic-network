import uuid
from app.core.database import SessionLocal
from app.models.ai_models import DocumentChunk, AIQuiz, AIQuizQuestion

def test_generate_quiz_unauthorized(client):
    res = client.post("/api/v1/quiz/generate", json={
        "document_id": str(uuid.uuid4()),
        "total_questions": 3
    })
    assert res.status_code == 401
    assert res.json()["success"] is False

def test_generate_quiz_document_not_found(client, auth_headers):
    # Non-existent document
    res = client.post("/api/v1/quiz/generate", json={
        "document_id": str(uuid.uuid4()),
        "total_questions": 3
    }, headers=auth_headers)
    assert res.status_code == 404
    assert res.json()["success"] is False

def test_quiz_full_flow_api(client, auth_headers):
    # Setup test chunk in DB
    db = SessionLocal()
    doc_id = uuid.uuid4()
    chunk = DocumentChunk(
        document_id=doc_id,
        chunk_index=1,
        page_number=1,
        heading="Cấu trúc dữ liệu nâng cao",
        content="Cây đỏ đen (Red-Black Tree) là một dạng cây nhị phân tìm kiếm tự cân bằng."
    )
    db.add(chunk)
    db.commit()

    try:
        # 1. Generate Quiz
        gen_res = client.post("/api/v1/quiz/generate", json={
            "document_id": str(doc_id),
            "difficulty": "ADVANCED",
            "total_questions": 2,
            "title": "Trắc nghiệm Cấu trúc dữ liệu"
        }, headers=auth_headers)

        assert gen_res.status_code == 201
        quiz_data = gen_res.json()["data"]
        quiz_id = quiz_data["id"]
        assert len(quiz_data["questions"]) == 2
        q1_id = quiz_data["questions"][0]["id"]

        # 2. Get Quiz detail for taking
        get_res = client.get(f"/api/v1/quiz/{quiz_id}")
        assert get_res.status_code == 200
        assert get_res.json()["data"]["id"] == quiz_id

        # 3. Submit Quiz
        sub_res = client.post(f"/api/v1/quiz/{quiz_id}/submit", json={
            "answers": [
                {"question_id": q1_id, "selected_option": "A"}
            ],
            "time_spent_seconds": 45
        }, headers=auth_headers)

        assert sub_res.status_code == 200
        sub_data = sub_res.json()["data"]
        assert sub_data["quiz_id"] == quiz_id
        assert sub_data["score"] >= 0
        assert "feedback" in sub_data

        # 4. Get Quiz history
        hist_res = client.get("/api/v1/quiz/history/me", headers=auth_headers)
        assert hist_res.status_code == 200
        assert len(hist_res.json()["data"]) >= 1

        # 5. Export Quiz to Kahoot Excel (.xlsx)
        kahoot_res = client.get(f"/api/v1/quiz/{quiz_id}/export/kahoot")
        assert kahoot_res.status_code == 200
        assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in kahoot_res.headers["content-type"]
        assert "kahoot_quiz_" in kahoot_res.headers.get("content-disposition", "")
        assert len(kahoot_res.content) > 100

        # 6. Export Quiz to Wayground Excel (.xlsx)
        wg_res = client.get(f"/api/v1/quiz/{quiz_id}/export/wayground")
        assert wg_res.status_code == 200
        assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in wg_res.headers["content-type"]
        assert "wayground_quiz_" in wg_res.headers.get("content-disposition", "")
        assert len(wg_res.content) > 100

    finally:
        # Cleanup
        db.query(DocumentChunk).filter(DocumentChunk.document_id == doc_id).delete()
        db.query(AIQuiz).filter(AIQuiz.document_id == doc_id).delete()
        db.commit()
        db.close()

def test_export_quiz_not_found_api(client):
    fake_id = uuid.uuid4()
    res1 = client.get(f"/api/v1/quiz/{fake_id}/export/kahoot")
    assert res1.status_code == 404

    res2 = client.get(f"/api/v1/quiz/{fake_id}/export/wayground")
    assert res2.status_code == 404

