import re
import unicodedata
from typing import List, Tuple
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.ai_models import DocumentChunk
from app.repositories.base_repository import BaseRepository

# Cụm từ mở đầu hội thoại cần loại bỏ khi trích xuất chủ đề học thuật
CONVERSATIONAL_PREFIX_PATTERNS = [
    r"^(?:xin chào[,.\s]*)?(?:cho\s+(?:tôi|mình|em)\s+(?:xin|hỏi|tìm|xem)\s+)",
    r"^(?:tôi|mình|em)\s+(?:đang\s+)?(?:muốn|cần)\s+(?:tìm(?:\s+kiếm)?|xem|xin|học|ôn(?:\s+tập)?)\s+",
    r"^(?:hãy\s+|làm\s+ơn\s+|vui\s+lòng\s+)?(?:tìm(?:\s+kiếm)?|gợi\s+ý|đề\s+xuất|tra\s+cứu)(?:\s+giúp(?:\s+(?:tôi|mình|em))?)?\s+",
    r"^(?:có\s+)?(?:những\s+|các\s+)?(?:tài\s+liệu|giáo\s+trình|bài\s+giảng|đề\s+thi|đề\s+cương|bài\s+tập|sách|slide)\s+(?:nào\s+)?(?:về\s+|môn\s+|chuyên\s+ngành\s+|liên\s+quan\s+đến\s+|cho\s+môn\s+)?",
]

TRAILING_FILLER_PATTERNS = [
    r"\s+(?:cho\s+(?:tôi|mình|em))?(?:\s+với|\s+nhé|\s+nha|\s+ạ|\s+không|\s+ko|\s+nào)?[?.!,\s]*$",
]

VIETNAMESE_STOPWORDS = {
    "tôi", "mình", "em", "bạn", "chúng", "ta", "muốn", "cần", "đang", "tìm", "kiếm",
    "xin", "cho", "hỏi", "xem", "giúp", "với", "nhé", "nha", "ạ", "không", "ko",
    "tài", "liệu", "giáo", "trình", "bài", "giảng", "đề", "thi", "cương", "tập",
    "môn", "học", "thuật", "ngành", "chuyên", "về", "của", "trong", "trên", "dưới",
    "các", "những", "một", "nhiều", "có", "là", "được", "này", "đó", "kia", "nào",
    "thì", "mà", "và", "hoặc", "hay", "như", "thế", "sao", "gì", "ai", "ở", "đâu",
    "liên", "quan", "đến", "tới", "phần", "chương", "mục", "ý", "chính", "tóm", "tắt",
    "nội", "dung", "file", "tệp", "pdf", "docx",
    # Phiên bản không dấu khi người dùng gõ tiếng Việt không dấu
    "toi", "minh", "muon", "can", "dang", "tim", "kiem", "giup", "voi", "khong",
    "tai", "lieu", "giao", "trinh", "bai", "giang", "de", "cuong", "mon", "thuat",
    "nganh", "chuyen", "cua", "nhung", "nhieu", "duoc", "nay", "nao", "hoac",
}

SUMMARY_INTENT_KEYWORDS = (
    "tóm tắt", "tổng quan", "nói gì", "toàn bộ", "ý chính", "nội dung chính", "khái quát"
)


def fold_vietnamese_accents(text: str) -> str:
    if not text:
        return ""
    text = text.replace("đ", "d").replace("Đ", "D")
    normalized = unicodedata.normalize("NFD", text)
    return "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn").lower()


def has_vietnamese_diacritics(text: str) -> bool:
    if not text:
        return False
    return text.lower() != fold_vietnamese_accents(text)


def contains_whole_phrase(haystack: str, needle: str) -> bool:
    if not haystack or not needle:
        return False
    pattern = rf"(?<!\w){re.escape(needle)}(?!\w)"
    return re.search(pattern, haystack, flags=re.IGNORECASE) is not None


def extract_academic_search_topic(raw_query: str) -> Tuple[str, List[str]]:
    """
    Tách chủ đề học thuật cốt lõi và danh sách từ khóa mang nghĩa từ câu hỏi tự nhiên.
    Ví dụ:
      "tôi muốn tìm tài liệu giải tích" -> ("giải tích", ["giải", "tích"])
      "tôi muốn tìm tài liệu triết học" -> ("triết học", ["triết"])
    """
    cleaned = re.sub(r"\s+", " ", (raw_query or "").strip())
    topic = cleaned.lower()

    # Cũng hỗ trợ bóc tiền tố khi người dùng gõ không dấu (vd: "toi muon tim tai lieu giai tich")
    unaccented_prefixes = [
        r"^(?:toi|minh|em)\s+(?:dang\s+)?(?:muon|can)\s+(?:tim(?:\s+kiem)?|xem|xin|hoc|on(?:\s+tap)?)\s+",
        r"^(?:tim(?:\s+kiem)?|goi\s+y|tra\s+cuu)\s+",
        r"^(?:tai\s+lieu|giao\s+trinh|bai\s+giang|de\s+thi)\s+(?:ve\s+|mon\s+)?",
    ]

    for _ in range(3):
        prev = topic
        for pat in CONVERSATIONAL_PREFIX_PATTERNS + unaccented_prefixes:
            topic = re.sub(pat, "", topic, flags=re.IGNORECASE).strip()
        if topic == prev:
            break

    for pat in TRAILING_FILLER_PATTERNS:
        topic = re.sub(pat, "", topic, flags=re.IGNORECASE).strip()

    topic = re.sub(r"^(?:về|môn|học\s+phần|chủ\s+đề|ve|mon)\s+", "", topic, flags=re.IGNORECASE).strip()
    topic = topic.strip(" ?.!,:;\"'()[]{}")

    raw_tokens = re.findall(r"[0-9a-zA-ZÀ-ỹ]+", topic if topic else cleaned.lower())
    meaningful_tokens = [
        tok for tok in raw_tokens
        if len(tok) >= 2 and tok.lower() not in VIETNAMESE_STOPWORDS
    ]

    if not meaningful_tokens and raw_tokens:
        meaningful_tokens = [tok for tok in raw_tokens if len(tok) >= 2]

    if not topic and meaningful_tokens:
        topic = " ".join(meaningful_tokens)

    return topic, meaningful_tokens


class DocumentChunkRepository(BaseRepository[DocumentChunk]):
    def __init__(self, db: Session):
        super().__init__(DocumentChunk, db)

    def get_by_document_id(self, document_id: UUID) -> List[DocumentChunk]:
        return (
            self.db.query(DocumentChunk)
            .filter(DocumentChunk.document_id == document_id)
            .order_by(DocumentChunk.chunk_index.asc())
            .all()
        )

    def delete_by_document_id(self, document_id: UUID) -> int:
        deleted = (
            self.db.query(DocumentChunk)
            .filter(DocumentChunk.document_id == document_id)
            .delete(synchronize_session=False)
        )
        self.db.commit()
        return deleted

    @staticmethod
    def _score_chunk(chunk: DocumentChunk, topic: str, tokens: List[str]) -> float:
        heading_text = (chunk.heading or "").lower()
        content_text = (chunk.content or "").lower()
        query_has_accents = has_vietnamese_diacritics(topic) or any(has_vietnamese_diacritics(t) for t in tokens)

        folded_heading = fold_vietnamese_accents(heading_text)
        folded_content = fold_vietnamese_accents(content_text)

        score = 0.0
        if topic and len(topic) >= 2:
            if contains_whole_phrase(heading_text, topic):
                score += 8.0
            elif not query_has_accents and contains_whole_phrase(folded_heading, fold_vietnamese_accents(topic)):
                score += 6.5

            if contains_whole_phrase(content_text, topic):
                score += 5.0
            elif not query_has_accents and contains_whole_phrase(folded_content, fold_vietnamese_accents(topic)):
                score += 4.0

        for tok in tokens:
            tok_low = tok.lower()
            f_tok = fold_vietnamese_accents(tok_low)
            if contains_whole_phrase(heading_text, tok_low):
                score += 2.5
            elif not query_has_accents and len(f_tok) >= 3 and contains_whole_phrase(folded_heading, f_tok):
                score += 1.8

            if contains_whole_phrase(content_text, tok_low):
                score += 1.5
            elif not query_has_accents and len(f_tok) >= 3 and contains_whole_phrase(folded_content, f_tok):
                score += 1.2

        return score

    def search_chunks(self, document_id: UUID, query_text: str, limit: int = 5) -> List[DocumentChunk]:
        chunks = (
            self.db.query(DocumentChunk)
            .filter(DocumentChunk.document_id == document_id)
            .order_by(DocumentChunk.chunk_index.asc())
            .all()
        )
        if not chunks:
            return []

        if not query_text or not query_text.strip():
            return chunks[:limit]

        topic, tokens = extract_academic_search_topic(query_text)
        scored = [(self._score_chunk(c, topic, tokens), c) for c in chunks]
        scored.sort(key=lambda x: (x[0], -x[1].chunk_index), reverse=True)

        matched = [c for s, c in scored[:limit] if s > 0]
        if matched:
            return matched

        return chunks[:limit]

    def search_chunks_global(self, query_text: str, limit: int = 5) -> List[DocumentChunk]:
        """
        Tìm kiếm các đoạn kiến thức khớp thực sự trên TOÀN BỘ kho document_chunks của hệ thống.
        Tuyệt đối không trả về đoạn ngẫu nhiên nếu điểm khớp bằng 0.
        """
        if not query_text or not query_text.strip():
            return []

        topic, tokens = extract_academic_search_topic(query_text)
        if not topic and not tokens:
            return []

        seed_doc_id = UUID("11111111-1111-1111-1111-111111111111")
        all_chunks = (
            self.db.query(DocumentChunk)
            .filter(DocumentChunk.document_id != seed_doc_id)
            .limit(1000)
            .all()
        )

        min_threshold = 5.0 if len(tokens) >= 2 else 2.5
        scored = []
        for c in all_chunks:
            sc = self._score_chunk(c, topic, tokens)
            if sc >= min_threshold:
                scored.append((sc, c))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [c for _, c in scored[:limit]]
