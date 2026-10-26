import os
from typing import List, Dict, Any

class TextExtractor:
    @staticmethod
    def extract_from_bytes(pdf_bytes: bytes) -> List[Dict[str, Any]]:
        """Extract text page by page from raw PDF bytes using PyMuPDF"""
        pages = []
        try:
            import pymupdf  # PyMuPDF
            doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
            if doc.is_encrypted and doc.needs_pass:
                # Attempt empty password fallback
                if not doc.authenticate(""):
                    from app.exceptions.app_exceptions import AppException
                    raise AppException(
                        status_code=400,
                        message="Tệp PDF này đã được cài đặt mật khẩu bảo vệ. Vui lòng mở khóa hoặc sử dụng tệp PDF không có mật khẩu."
                    )
            for page_idx in range(len(doc)):
                page = doc[page_idx]
                text = page.get_text("text").strip().replace("\x00", "")
                pages.append({
                    "page_number": page_idx + 1,
                    "text": text
                })
            doc.close()
        except Exception as e:
            from app.exceptions.app_exceptions import AppException
            if isinstance(e, AppException):
                raise e
            if pdf_bytes.startswith(b"%PDF"):
                raise AppException(
                    status_code=400,
                    message=f"Không thể đọc nội dung tệp PDF do lỗi định dạng hoặc bảo vệ: {str(e)}"
                )
            # Fallback for plain text files
            pages.append({
                "page_number": 1,
                "text": pdf_bytes.decode("utf-8", errors="ignore").replace("\x00", "")
            })
        return pages

    @staticmethod
    def extract_from_path(file_path: str) -> List[Dict[str, Any]]:
        """Extract text page by page from PDF file on disk"""
        if not os.path.exists(file_path):
            return []
        with open(file_path, "rb") as f:
            return TextExtractor.extract_from_bytes(f.read())
