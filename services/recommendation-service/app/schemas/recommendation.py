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
