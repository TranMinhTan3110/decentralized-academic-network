from datetime import datetime
from uuid import UUID
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class CreateChatSessionRequest(BaseModel):
    document_id: UUID
    title: Optional[str] = "Hỏi đáp bài giảng AI"


class SourceCitationItem(BaseModel):
    chunk_index: int
    page_number: int
    heading: Optional[str] = None
    snippet: str


class ChatMessageResponse(BaseModel):
    id: UUID
    session_id: UUID
    role: str = Field(..., description="user hoặc assistant")
    content: str
    sources_found: Optional[List[SourceCitationItem]] = None
    created_at: datetime


class ChatSessionResponse(BaseModel):
    id: UUID
    document_id: UUID
    title: str
    created_at: datetime


class AskQuestionRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=2000)
    mode: Optional[str] = Field("focus_upload", description="normal | search_docs | focus_upload")
