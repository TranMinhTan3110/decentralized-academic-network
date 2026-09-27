from fastapi import FastAPI

# Khởi tạo ứng dụng FastAPI
app = FastAPI(title="Recommendation Service AI")

# Tạo một API cơ bản (Method GET)
@app.get("/")
def read_root():
    return {"message": "Xin chào! Máy chủ AI bằng Python đã chạy thành công 🚀"}

# Tạo một API để mô phỏng gợi ý tài liệu
@app.get("/api/ai/recommend")
def get_recommendations(user_id: str):
    # Trả về chuỗi JSON mô phỏng (sau này bạn AI sẽ thay bằng thuật toán thật)
    return {
        "user_id": user_id,
        "recommended_documents": ["doc_123", "doc_456", "doc_789"]
    }
