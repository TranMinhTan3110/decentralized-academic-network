from datetime import datetime
from uuid import UUID
from typing import Optional
from pydantic import BaseModel, Field

class LogInteractionRequest(BaseModel):
    document_id: UUID
    interaction_type: str = Field(..., description="VIEW, LIKE, DOWNLOAD, BOOKMARK, QUIZ_PRACTICE")
    duration_seconds: int = Field(default=0, ge=0)
    pages_viewed: int = Field(default=1, ge=1)

class InteractionResponse(BaseModel):
    id: UUID
    user_id: UUID
    document_id: UUID
    interaction_type: str
    reward_score: float
    duration_seconds: int
    pages_viewed: int
    created_at: datetime
