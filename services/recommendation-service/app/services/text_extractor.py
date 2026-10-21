import os
from typing import List, Dict, Any

class TextExtractor:
    @staticmethod
    def extract_from_bytes(pdf_bytes: bytes) -> List[Dict[str, Any]]:
        """Extract text page by page from raw PDF bytes using PyMuPDF"""
        pages = []
        try:
            import fitz  # PyMuPDF
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            for page_idx in range(len(doc)):
                page = doc[page_idx]
                text = page.get_text("text").strip()
                pages.append({
                    "page_number": page_idx + 1,
                    "text": text
                })
            doc.close()
        except Exception as e:
            # Fallback if fitz fails on malformed bytes
            pages.append({
                "page_number": 1,
                "text": pdf_bytes.decode("utf-8", errors="ignore")
            })
        return pages

    @staticmethod
    def extract_from_path(file_path: str) -> List[Dict[str, Any]]:
        """Extract text page by page from PDF file on disk"""
        if not os.path.exists(file_path):
            return []
        with open(file_path, "rb") as f:
            return TextExtractor.extract_from_bytes(f.read())
