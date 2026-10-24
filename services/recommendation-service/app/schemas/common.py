from datetime import datetime, timezone
from typing import Generic, Optional, TypeVar, Any
from pydantic import BaseModel, Field

T = TypeVar("T")

class ApiResponse(BaseModel, Generic[T]):
    success: bool
    message: str
    data: Optional[T] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @classmethod
    def ok(cls, data: T = None, message: str = "Thao tác thành công") -> "ApiResponse[T]":
        return cls(success=True, message=message, data=data)

    @classmethod
    def err(cls, message: str = "Đã xảy ra lỗi", data: Optional[T] = None) -> "ApiResponse[Optional[T]]":
        return cls(success=False, message=message, data=data)


class PageMeta(BaseModel):
    page: int = 1
    page_size: int = 10
    total_elements: int = 0
    total_pages: int = 0
