from uuid import UUID
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class WatermarkDetectionInfo(BaseModel):
    has_watermark: bool = False
    watermark_type: Optional[str] = Field(
        default=None,
        description="NONE | EXTERNAL_PLATFORM | PERSONAL_THIRD_PARTY | PERSONAL_SELF | GRAPHIC_STAMP"
    )
    detected_text: Optional[str] = None
    matched_owner: bool = False
    details: Optional[str] = None


class ValidationResultResponse(BaseModel):
    is_valid: bool
    status: str = Field(..., description="VALID, WARNING, FLAGGED, REJECTED")
    flag_code: Optional[str] = None
    reason: Optional[str] = None
    total_words: int = 0
    pages_count: int = 0
    confidence_score: float = 1.0
    file_name: Optional[str] = None
    file_extension: Optional[str] = None
    requires_confirmation: bool = False
    warnings: List[str] = Field(default_factory=list)
    watermark_info: Optional[WatermarkDetectionInfo] = None


class MultiFileValidationResponse(BaseModel):
    overall_valid: bool
    overall_status: str = Field(..., description="VALID, WARNING, FLAGGED")
    requires_confirmation: bool = False
    auto_merge_images_to_pdf: bool = False
    total_files: int = 0
    summary_message: str
    file_results: List[ValidationResultResponse] = Field(default_factory=list)


class ProcessDocumentRequest(BaseModel):
    document_id: UUID
    title: Optional[str] = None
    raw_text: Optional[str] = None
    file_path: Optional[str] = None
    uploader_name: Optional[str] = None
    uploader_username: Optional[str] = None
    uploader_email: Optional[str] = None


class ProcessDocumentResponse(BaseModel):
    document_id: UUID
    total_chunks: int
    validation_status: str
    message: str
