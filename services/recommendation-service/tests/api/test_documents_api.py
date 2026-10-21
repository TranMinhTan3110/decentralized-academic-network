import uuid
from app.core.database import SessionLocal
from app.models.ai_models import DocumentChunk

def test_validate_document_api(client):
    doc_id = str(uuid.uuid4())
    # Test valid text (> 50 words) with unique doc_id to avoid duplicate collision
    valid_text = f"Mã {doc_id}: Học máy và khoa học dữ liệu là các lĩnh vực phát triển nhanh chóng trong thời đại trí tuệ nhân tạo. " * 8
    res = client.post("/api/v1/documents/validate", json={
        "document_id": doc_id,
        "raw_text": valid_text
    })
    assert res.status_code == 200
    assert res.json()["data"]["is_valid"] is True
    assert res.json()["data"]["status"] == "VALID"

def test_validate_document_flagged_empty(client):
    doc_id = str(uuid.uuid4())
    res = client.post("/api/v1/documents/validate", json={
        "document_id": doc_id,
        "raw_text": "Vài chữ ngắn ngủi."
    })
    assert res.status_code == 200
    assert res.json()["data"]["is_valid"] is False
    assert res.json()["data"]["status"] == "FLAGGED"
    assert res.json()["data"]["flag_code"] == "BLANK_OR_POOR_QUALITY"

def test_process_document_api(client):
    doc_id = str(uuid.uuid4())
    academic_text = (
        f"Mã {doc_id}: Chương 1: Kiến trúc máy tính hiện đại và vi xử lý đa nhân. " * 10
    )
    db = SessionLocal()
    try:
        res = client.post(f"/api/v1/documents/{doc_id}/process", json={
            "document_id": doc_id,
            "title": "Kiến trúc máy tính",
            "raw_text": academic_text
        })
        assert res.status_code == 200
        assert res.json()["data"]["validation_status"] == "VALID"
        assert res.json()["data"]["total_chunks"] >= 1

        # Verify chunks query
        c_res = client.get(f"/api/v1/documents/{doc_id}/chunks")
        assert c_res.status_code == 200
        assert len(c_res.json()["data"]) >= 1
    finally:
        db.query(DocumentChunk).filter(DocumentChunk.document_id == uuid.UUID(doc_id)).delete()
        db.commit()
        db.close()
