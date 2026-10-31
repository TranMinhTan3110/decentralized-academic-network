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

    finally:
        # Cleanup
        db.query(DocumentChunk).filter(DocumentChunk.document_id == doc_id).delete()
        db.query(AIQuiz).filter(AIQuiz.document_id == doc_id).delete()
        db.commit()
        db.close()
