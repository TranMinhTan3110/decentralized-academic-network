from uuid import UUID
from typing import List, Optional
from pydantic import BaseModel, Field

class RecommendationItem(BaseModel):
    document_id: UUID
    title: Optional[str] = "Tài liệu học thuật liên quan"
    score: float = Field(..., description="Điểm đánh giá đề xuất")
    reason: str = Field(..., description="Lý do đề xuất: Thịnh hành, Phù hợp ngành học, hoặc Gợi ý cá nhân hóa")

class RecommendationResponse(BaseModel):
    total: int
    algorithm_applied: str
    items: List[RecommendationItem]


class KnowledgeGraphEdge(BaseModel):
    source_id: UUID
    target_id: UUID
    similarity: float = Field(..., ge=0.0, le=1.0, description="Độ tương đồng ngữ nghĩa Cosine (0.0 - 1.0)")
    shared_keywords: List[str] = Field(default_factory=list, description="Từ khóa học thuật chung nổi bật")
    relation_type: str = Field(default="semantic", description="Loại liên kết: semantic | co_interaction")


class KnowledgeGraphResponse(BaseModel):
    total_documents: int
    total_edges: int
    algorithm_applied: str
    edges: List[KnowledgeGraphEdge]


class OriginalityCheckResponse(BaseModel):
    document_id: UUID
    originality_score: float = Field(..., ge=0.0, le=100.0, description="Tỷ lệ nguyên bản phần trăm (0 - 100%)")
    max_similarity: float = Field(..., ge=0.0, le=1.0, description="Độ tương đồng cao nhất phát hiện được")
    most_similar_doc_id: Optional[UUID] = Field(default=None, description="Mã tài liệu có nội dung giống nhất")
    most_similar_doc_title: Optional[str] = Field(default=None, description="Tiêu đề tài liệu có nội dung giống nhất")
    shared_keywords: List[str] = Field(default_factory=list, description="Các từ khóa trùng lặp chính")
    status_label: str = Field(..., description="Đánh giá: Nguyên bản cao / Đạt chuẩn / Cần lưu ý")
    algorithm_applied: str = Field(default="TF-IDF Cosine Similarity & Chunk Shingling")

