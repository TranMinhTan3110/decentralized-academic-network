import uuid
from app.core.database import SessionLocal
from app.models.ai_models import DocumentChunk, AIChatSession, AIChatMessage

def test_chat_full_flow_api(client):
    doc_id = str(uuid.uuid4())
    db = SessionLocal()

    try:
        # 1. Process document first to have chunks
        proc_res = client.post(f"/api/v1/documents/{doc_id}/process", json={
            "document_id": doc_id,
            "title": "Mạng máy tính",
            "raw_text": f"Tài liệu {doc_id}: Giao thức TCP là giao thức hướng kết nối đảm bảo dữ liệu được truyền tải tin cậy. " * 8
        })
        assert proc_res.status_code == 200
        assert proc_res.json()["data"]["validation_status"] == "VALID"

        # 2. Create chat session
        s_res = client.post("/api/v1/chat/sessions", json={
            "document_id": doc_id,
            "title": "Hỏi đáp Giao thức mạng"
        })
        assert s_res.status_code == 201
        session_id = s_res.json()["data"]["id"]

        # 3. Ask question
        ask_res = client.post(f"/api/v1/chat/{session_id}/ask", json={
            "question": "Giao thức TCP có tin cậy không?"
        })
        assert ask_res.status_code == 200
        msg_data = ask_res.json()["data"]
        assert msg_data["role"] == "assistant"
        assert "Dựa vào nội dung" in msg_data["content"]
        assert len(msg_data["sources_found"]) >= 1

        # 4. Get messages history
        hist_res = client.get(f"/api/v1/chat/{session_id}/messages")
        assert hist_res.status_code == 200
        messages = hist_res.json()["data"]
        assert len(messages) >= 2  # user question + assistant answer

    finally:
        db.query(AIChatMessage).filter(AIChatMessage.session_id == uuid.UUID(session_id)).delete() if "session_id" in locals() else None
        db.query(AIChatSession).filter(AIChatSession.document_id == uuid.UUID(doc_id)).delete()
        db.query(DocumentChunk).filter(DocumentChunk.document_id == uuid.UUID(doc_id)).delete()
        db.commit()
        db.close()
