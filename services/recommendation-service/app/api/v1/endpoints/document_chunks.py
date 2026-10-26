from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, CurrentUser
from app.schemas.common import ApiResponse
from app.schemas.content_validation import (
    ProcessDocumentRequest,
    ProcessDocumentResponse,
    ValidationResultResponse
)
from app.services.rag_service import RagService
from app.services.content_validator import ContentValidator
from app.services.text_extractor import TextExtractor
from app.repositories.chunk_repository import DocumentChunkRepository
from app.models.ai_models import DocumentChunk

router = APIRouter()

@router.post(
    "/{documentId}/process",
    response_model=ApiResponse[ProcessDocumentResponse],
    summary="Tiếp nhận văn bản tài liệu, kiểm định chất lượng và phân tách đoạn ngữ nghĩa (Chunks)"
)
def process_document(
    documentId: UUID,
    request: ProcessDocumentRequest,
    db: Session = Depends(get_db)
):
    service = RagService(db)
    pages = []
    if request.raw_text:
        pages = [{"page_number": 1, "text": request.raw_text}]
    elif request.file_path:
        pages = TextExtractor.extract_from_path(request.file_path)
    else:
        pages = [{"page_number": 1, "text": f"Tài liệu học thuật {documentId} nội dung tổng quan."}]

    result = service.process_and_chunk_document(
        document_id=documentId,
        title=request.title,
        pages=pages
    )
    return ApiResponse.ok(
        data=result,
        message=result.message
    )

@router.get(
    "/{documentId}/chunks",
    response_model=ApiResponse[List[dict]],
    summary="Lấy danh sách các phân đoạn ngữ nghĩa (Chunks) của một tài liệu"
)
def get_document_chunks(
    documentId: UUID,
    db: Session = Depends(get_db)
):
    repo = DocumentChunkRepository(db)
    chunks = repo.get_by_document_id(documentId)
    data = [
        {
            "id": str(c.id),
            "chunk_index": c.chunk_index,
            "page_number": c.page_number,
            "heading": c.heading,
            "content": c.content,
            "token_count": c.token_count
        }
        for c in chunks
    ]
    return ApiResponse.ok(
        data=data,
        message=f"Lấy thành công {len(data)} phân đoạn của tài liệu"
    )

@router.post(
    "/validate",
    response_model=ApiResponse[ValidationResultResponse],
    summary="Thẩm định chất lượng tệp, kiểm tra file trắng, spam chữ và bản quyền thương mại"
)
def validate_document(
    request: ProcessDocumentRequest,
    db: Session = Depends(get_db)
):
    pages = []
    if request.raw_text:
        pages = [{"page_number": 1, "text": request.raw_text}]
    elif request.file_path:
        pages = TextExtractor.extract_from_path(request.file_path)
    else:
        pages = [{"page_number": 1, "text": ""}]

    res = ContentValidator.validate_content(pages=pages, db=db, document_id=request.document_id)
    return ApiResponse.ok(
        data=res,
        message="Thẩm định tệp hoàn tất"
    )
