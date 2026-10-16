from uuid import UUID
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ValidationResultResponse(BaseModel):
    is_valid: bool
    status: str = Field(..., description="VALID, FLAGGED, REJECTED")
    flag_code: Optional[str] = None
    reason: Optional[str] = None
    total_words: int = 0
    pages_count: int = 0
    confidence_score: float = 1.0


class ProcessDocumentRequest(BaseModel):
    document_id: UUID
    title: Optional[str] = None
    raw_text: Optional[str] = None
    file_path: Optional[str] = None


class ProcessDocumentResponse(BaseModel):
    document_id: UUID
    total_chunks: int
    validation_status: str
    message: str
