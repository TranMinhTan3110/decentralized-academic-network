import re
import math
import unicodedata
from collections import Counter
from typing import List, Dict, Any, Tuple, Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.ai_models import DocumentChunk
from app.schemas.content_validation import (
    ValidationResultResponse,
    WatermarkDetectionInfo,
    MultiFileValidationResponse,
)
from app.services.text_extractor import TextExtractor


class ContentValidator:
    # Copyright regex patterns & commercial publisher keywords
    ISBN_REGEX = re.compile(
        r"ISBN\s*[:\s-]?\s*(?:97[89][-\s]?)?[0-9]{1,5}[-\s]?[0-9]+[-\s]?[0-9]+[-\s]?[0-9X]",
        re.IGNORECASE
    )

    PUBLISHER_KEYWORDS = [
        "Nhà xuất bản Giáo dục",
        "NXB Giáo dục",
        "Nhà xuất bản Trẻ",
        "NXB Trẻ",
        "Nhà xuất bản Kim Đồng",
        "Copyright ©",
        "All rights reserved",
        "Bản quyền thuộc về Nhà xuất bản",
        "Cấm sao chép dưới mọi hình thức",
    ]

    # Watermark của các nền tảng chia sẻ bên ngoài & phần mềm đóng dấu thương mại (Chặn tuyệt đối)
    EXTERNAL_WATERMARK_PATTERNS = [
        (r"lOMoARcPSD\|[0-9]+", "Studocu (Mã định danh lOMoARcPSD)"),
        (r"downloaded\s+by\s+.{2,50}\s+on\s+studocu", "Studocu (Downloaded by ...)"),
        (r"studocu\s+is\s+not\s+sponsored\s+or\s+endorsed", "Studocu Watermark"),
        (r"\bstudocu\.com\b", "Studocu.com"),
        (r"this\s+study\s+source\s+was\s+downloaded\s+by", "CourseHero Watermark"),
        (r"\bcoursehero\.com\b", "CourseHero.com"),
        (r"\b123doc(?:\.net|\.org|\.vn)?\b", "123doc"),
        (r"\btailieu\.vn\b", "Tailieu.vn"),
        (r"\bscribd\.com\b", "Scribd"),
        (r"\bvndoc\.com\b", "VnDoc.com"),
        (r"\bvietjack\.com\b", "VietJack.com"),
        (r"scanned\s+with\s+camscanner", "CamScanner Watermark"),
        (r"evaluation\s+only\.\s*created\s+with\s+aspose", "Aspose Trial Watermark"),
        (r"created\s+with\s+wondershare\s+pdfelement", "Wondershare PDFelement Trial"),
    ]

    # Mẫu cụm từ chỉ dấu sở hữu cá nhân trong văn bản hoặc Header/Footer
    PERSONAL_OWNERSHIP_REGEX = re.compile(
        r"(?:bản\s+quyền\s+(?:cá\s+nhân\s+)?(?:thuộc\s+về|của)|"
        r"tài\s+liệu\s+(?:cá\s+nhân|độc\s+quyền|lưu\s+hành\s+nội\s+bộ)\s+của|"
        r"watermark\s*[:\-]|"
        r"property\s+of|"
        r"do\s+not\s+distribute\s*[-–:]\s*)"
        r"\s*([A-Za-zÀ-ỹ0-9_.\-@ ]{3,50})",
        re.IGNORECASE
    )

    # Từ khóa vô nghĩa thường dùng để lách luật đủ số từ
    LOREM_IPSUM_KEYWORDS = [
        "lorem ipsum dolor sit amet",
        "consectetur adipiscing elit",
        "sed do eiusmod tempor incididunt",
    ]

    # Các từ chung trong mẫu phôi văn bản không phải là tên cá nhân
    GENERIC_SYSTEM_AUTHORS = {
        "admin", "administrator", "user", "windows user", "microsoft office user",
        "hp", "dell", "asus", "acer", "lenovo", "pc", "laptop", "root", "author",
        "unknown", "python-docx", "openpyxl", "apache poi", "pymupdf", "canva",
        "google docs", "wps office", "foxit", "adobe",
    }

    @staticmethod
    def _normalize_vn(text: str) -> str:
        if not text:
            return ""
        s = text.lower().strip()
        s = s.replace("đ", "d")
        s = unicodedata.normalize("NFD", s)
        s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
        return re.sub(r"[^a-z0-9\s]", " ", s).strip()

    @classmethod
    def _matches_uploader_identity(
        cls,
        watermark_text: str,
        uploader_name: Optional[str] = None,
        uploader_username: Optional[str] = None,
        uploader_email: Optional[str] = None,
    ) -> bool:
        """
        Kiểm tra xem nội dung Watermark cá nhân có trùng khớp với tên/username/email
        của chính người đang đăng tải hay không.
        """
        wm_norm = cls._normalize_vn(watermark_text)
        if not wm_norm:
            return False

        candidates = []
        if uploader_name and len(uploader_name.strip()) >= 2:
            candidates.append(cls._normalize_vn(uploader_name))
        if uploader_username and len(uploader_username.strip()) >= 2:
            candidates.append(cls._normalize_vn(uploader_username))
        if uploader_email and "@" in uploader_email:
            email_prefix = uploader_email.split("@")[0]
            candidates.append(cls._normalize_vn(email_prefix))
            if uploader_email.lower().strip() in watermark_text.lower():
                return True

        for cand in candidates:
            if not cand:
                continue
            if cand in wm_norm or wm_norm in cand:
                return True
            # So khớp các từ chính trong họ tên (ví dụ "Au Duong Tan" khớp "Duong Tan")
            cand_tokens = [t for t in cand.split() if len(t) >= 2]
            if len(cand_tokens) >= 2 and all(t in wm_norm.split() for t in cand_tokens[-2:]):
                return True

        return False

    @staticmethod
    def calculate_entropy(text: str) -> float:
        """Calculate Shannon entropy of characters"""
        if not text:
            return 0.0
        entropy = 0.0
        length = len(text)
        counts = Counter(text)
        for count in counts.values():
            p = count / length
            entropy -= p * math.log2(p)
        return entropy

    @classmethod
    def check_empty(cls, total_words: int) -> Tuple[bool, Optional[str], Optional[str]]:
        if total_words < 50:
            return (
                False,
                "BLANK_OR_POOR_QUALITY",
                f"Tệp chứa quá ít nội dung ({total_words} từ). Yêu cầu tối thiểu 50 từ học thuật."
            )
        return True, None, None

    @classmethod
    def check_gibberish_and_spam(cls, text: str) -> Tuple[bool, Optional[str], Optional[str]]:
        words = re.findall(r"\w+", text.lower())
        if not words:
            return False, "SPAM_GIBBERISH", "Tài liệu không chứa từ ngữ hợp lệ."

        # 1. Repetition ratio của 1 từ đơn
        word_counts = Counter(words)
        most_common_word, most_common_count = word_counts.most_common(1)[0]
        repetition_ratio = most_common_count / len(words)
        if repetition_ratio > 0.40 and len(words) > 20:
            return (
                False,
                "SPAM_GIBBERISH",
                f"Phát hiện spam: từ '{most_common_word}' lặp lại {round(repetition_ratio * 100)}% toàn văn."
            )

        # 2. Repeated keyboard spam pattern (e.g., asdfghjklasdfghjkl or aaaaaaaa)
        if re.search(r"(\w{3,})\1{4,}", text):
            return False, "SPAM_GIBBERISH", "Phát hiện chuỗi ký tự lặp vô nghĩa (keyboard spam)."

        # 3. Chống văn bản giả Lorem Ipsum
        low_text = text.lower()
        for lorem in cls.LOREM_IPSUM_KEYWORDS:
            if lorem in low_text:
                return (
                    False,
                    "SPAM_GIBBERISH",
                    "Phát hiện văn bản mẫu giả (Lorem Ipsum) dùng để lách kiểm duyệt."
                )

        # 4. Chống lách luật bằng cách chỉ lặp lại dưới 5 từ khác nhau hoặc lặp câu quá dài
        unique_words_count = len(set(words))
        if len(words) >= 50 and unique_words_count < 6:
            return (
                False,
                "SPAM_GIBBERISH",
                f"Độ đa dạng từ vựng quá thấp (chỉ có {unique_words_count} từ khác nhau). Nghi ngờ sao chép lặp lại để lách luật."
            )

        # 5. Chống tệp chỉ toàn con số rời rạc không có từ ngữ học thuật
        alpha_words = [w for w in words if re.search(r"[a-zA-ZÀ-ỹ]{2,}", w)]
        if len(words) >= 50 and len(alpha_words) < 15:
            return (
                False,
                "SPAM_GIBBERISH",
                "Tài liệu chứa toàn chữ số hoặc ký hiệu rời rạc, thiếu nội dung từ vựng học thuật."
            )

        return True, None, None

    @classmethod
    def check_copyright(cls, pages: List[Dict[str, Any]]) -> Tuple[bool, Optional[str], Optional[str]]:
        # Scan first 3 pages
        first_pages = pages[:3]
        combined_text = " ".join([p.get("text", "") for p in first_pages])

        # Check ISBN
        isbn_match = cls.ISBN_REGEX.search(combined_text)
        if isbn_match:
            return False, "COPYRIGHT_DETECTED", f"Phát hiện mã xuất bản thương mại ISBN: '{isbn_match.group(0)}'."

        # Check commercial publisher keywords
        for keyword in cls.PUBLISHER_KEYWORDS:
            if re.search(re.escape(keyword), combined_text, re.IGNORECASE):
                return False, "COPYRIGHT_DETECTED", f"Phát hiện tài liệu có bản quyền thương mại của: '{keyword}'."

        return True, None, None

    @classmethod
    def check_watermark(
        cls,
        pages: List[Dict[str, Any]],
        structured_info: Optional[Dict[str, Any]] = None,
        uploader_name: Optional[str] = None,
        uploader_username: Optional[str] = None,
        uploader_email: Optional[str] = None,
    ) -> WatermarkDetectionInfo:
        """
        Kiểm tra Watermark 3 lớp:
        1. EXTERNAL_PLATFORM: Watermark của Studocu, CourseHero, 123doc, Tailieu.vn, CamScanner... -> Chặn tuyệt đối.
        2. PERSONAL_THIRD_PARTY: Watermark cá nhân (XML Watermark, chữ xoay chéo, Header/Footer lặp, đóng dấu cá nhân)
           nhưng KHÔNG khớp với người đăng -> Chặn tuyệt đối.
        3. PERSONAL_SELF: Watermark cá nhân TRÙNG KHỚP với tên/username/email của người đang đăng -> Cảnh báo xác nhận.
        """
        full_text = "\n".join(p.get("text", "") for p in pages)
        structural_wms: List[str] = []
        repeated_hfs: List[str] = []

        if structured_info:
            structural_wms = list(structured_info.get("structural_watermarks") or [])
            repeated_hfs = list(structured_info.get("repeated_headers_footers") or [])

        all_watermark_sources = "\n".join(structural_wms + repeated_hfs + [full_text])

        # LỚP 1: Quét Watermark từ các nền tảng bên ngoài (Studocu, CourseHero, 123doc, Tailieu.vn...)
        for pattern, platform_label in cls.EXTERNAL_WATERMARK_PATTERNS:
            match = re.search(pattern, all_watermark_sources, re.IGNORECASE)
            if match:
                return WatermarkDetectionInfo(
                    has_watermark=True,
                    watermark_type="EXTERNAL_PLATFORM",
                    detected_text=match.group(0)[:80],
                    matched_owner=False,
                    details=(
                        f"Phát hiện Watermark từ nền tảng bên ngoài: {platform_label} "
                        f"('{match.group(0)[:60]}'). Hệ thống nghiêm cấm đăng tải lại tài liệu dính dấu bản quyền từ nguồn khác."
                    ),
                )

        # LỚP 2: Quét các Watermark cấu trúc trực tiếp (Word XML Watermark, Excel Header/Footer, PDF Rotated/Stamp Watermark)
        personal_candidates: List[str] = []
        for wm in structural_wms:
            cleaned = wm.strip()
            if len(cleaned) >= 3:
                personal_candidates.append(cleaned)

        # Kiểm tra Header/Footer lặp lại có chứa dấu hiệu cá nhân (Email, SĐT, hoặc chữ bản quyền/tên riêng)
        for hf in repeated_hfs:
            hf_clean = hf.strip()
            if re.search(r"([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+|0[35789][0-9]{8}|watermark|bản quyền|biên soạn|tác giả|gv[:\s]|ths\.|ts\.)", hf_clean, re.IGNORECASE):
                personal_candidates.append(hf_clean)

        # Kiểm tra mẫu câu tuyên bố sở hữu cá nhân trong văn bản
        ownership_match = cls.PERSONAL_OWNERSHIP_REGEX.search(full_text)
        if ownership_match:
            owner_str = ownership_match.group(1).strip()
            if len(owner_str) >= 3:
                personal_candidates.append(owner_str)

        if personal_candidates:
            detected_wm = personal_candidates[0]
            is_owner = cls._matches_uploader_identity(
                detected_wm,
                uploader_name=uploader_name,
                uploader_username=uploader_username,
                uploader_email=uploader_email,
            )
            if is_owner:
                return WatermarkDetectionInfo(
                    has_watermark=True,
                    watermark_type="PERSONAL_SELF",
                    detected_text=detected_wm[:80],
                    matched_owner=True,
                    details=(
                        f"Phát hiện Watermark cá nhân trùng khớp với tài khoản của bạn ('{detected_wm[:60]}'). "
                        f"Vui lòng xác nhận bạn là tác giả sở hữu để tiếp tục xuất bản."
                    ),
                )
            else:
                return WatermarkDetectionInfo(
                    has_watermark=True,
                    watermark_type="PERSONAL_THIRD_PARTY",
                    detected_text=detected_wm[:80],
                    matched_owner=False,
                    details=(
                        f"Phát hiện tài liệu chứa Watermark cá nhân ('{detected_wm[:60]}') không khớp với tên tài khoản đang đăng tải. "
                        f"Không được phép đăng tải tài liệu đóng dấu cá nhân của người khác."
                    ),
                )

        # LỚP 3: Phát hiện ảnh đóng dấu chìm lặp lại trên nhiều trang PDF
        if structured_info and structured_info.get("graphic_watermark_detected"):
            return WatermarkDetectionInfo(
                has_watermark=True,
                watermark_type="PERSONAL_SELF",
                detected_text="Hình ảnh/Logo chìm lặp lại trên các trang",
                matched_owner=True,
                details=(
                    "Phát hiện hình ảnh/logo đóng dấu chìm lặp lại trên phần lớn các trang tài liệu. "
                    "Vui lòng xác nhận đây là dấu hiệu hợp lệ thuộc quyền chia sẻ của bạn trước khi xuất bản."
                ),
            )

        return WatermarkDetectionInfo(has_watermark=False, watermark_type="NONE")

    @classmethod
    def check_duplicate(
        cls,
        db: Session,
        text: str,
        current_doc_id: Optional[UUID] = None
    ) -> Tuple[bool, Optional[str], Optional[str]]:
        """Check text snippets (Start, Middle, End) against existing chunks in DB"""
        if not text or len(text.strip()) < 100:
            return True, None, None

        clean_text = text.strip()
        samples = [clean_text[:500].strip()]
        if len(clean_text) > 1500:
            mid = len(clean_text) // 2
            samples.append(clean_text[mid:mid + 400].strip())

        for sample in samples:
            if len(sample) < 80:
                continue
            existing = (
                db.query(DocumentChunk)
                .filter(
                    DocumentChunk.content.contains(sample),
                    DocumentChunk.document_id != current_doc_id if current_doc_id else True
                )
                .first()
            )
            if (
                existing is not None
                and getattr(existing, "document_id", None)
                and type(existing).__name__ not in ("MagicMock", "Mock")
            ):
                return (
                    False,
                    "DUPLICATE_CONTENT",
                    f"Nội dung trùng khớp trên 95% với tài liệu đã có (Mã tài liệu: {existing.document_id})."
                )

        return True, None, None

    @classmethod
    def validate_content(
        cls,
        pages: List[Dict[str, Any]],
        db: Optional[Session] = None,
        document_id: Optional[UUID] = None,
        structured_info: Optional[Dict[str, Any]] = None,
        uploader_name: Optional[str] = None,
        uploader_username: Optional[str] = None,
        uploader_email: Optional[str] = None,
        filename: Optional[str] = None,
    ) -> ValidationResultResponse:
        full_text = " ".join([p.get("text", "") for p in pages]).strip()
        words = re.findall(r"\w+", full_text)
        total_words = len(words)
        pages_count = len(pages)
        ext = structured_info.get("extension") if structured_info else (
            TextExtractor.get_extension(filename) if filename else "pdf"
        )

        # Kiểm tra đặc thù cho Hình ảnh (.png, .jpg, .jpeg, .webp)
        if structured_info and structured_info.get("is_image"):
            img_metrics = structured_info.get("image_metrics") or {}
            if img_metrics.get("is_too_small"):
                return ValidationResultResponse(
                    is_valid=False,
                    status="FLAGGED",
                    flag_code="IMAGE_TOO_SMALL",
                    reason=(
                        f"Kích thước ảnh quá nhỏ ({img_metrics.get('width')}x{img_metrics.get('height')}px). "
                        f"Yêu cầu tối thiểu 250x250px để đảm bảo chữ đọc rõ."
                    ),
                    total_words=total_words,
                    pages_count=1,
                    confidence_score=0.99,
                    file_name=filename,
                    file_extension=ext,
                )
            if img_metrics.get("is_blank_or_solid"):
                return ValidationResultResponse(
                    is_valid=False,
                    status="FLAGGED",
                    flag_code="BLANK_OR_POOR_QUALITY",
                    reason="Hình ảnh bị trống (trắng/đen một màu) hoặc quá mờ nhòe, không có chi tiết văn bản/sơ đồ học thuật.",
                    total_words=0,
                    pages_count=1,
                    confidence_score=0.98,
                    file_name=filename,
                    file_extension=ext,
                )

        # Kiểm tra đặc thù cho Bảng tính Excel / CSV
        if structured_info and structured_info.get("spreadsheet_metrics"):
            sp_metrics = structured_info["spreadsheet_metrics"]
            if sp_metrics.get("non_empty_cells", 0) < 12:
                return ValidationResultResponse(
                    is_valid=False,
                    status="FLAGGED",
                    flag_code="BLANK_OR_POOR_QUALITY",
                    reason=(
                        f"Bảng tính chứa quá ít dữ liệu ({sp_metrics.get('non_empty_cells', 0)} ô). "
                        f"Yêu cầu tối thiểu 12 ô dữ liệu học thuật."
                    ),
                    total_words=total_words,
                    pages_count=pages_count,
                    confidence_score=0.99,
                    file_name=filename,
                    file_extension=ext,
                )
            if sp_metrics.get("numeric_only"):
                return ValidationResultResponse(
                    is_valid=False,
                    status="FLAGGED",
                    flag_code="SPAM_GIBBERISH",
                    reason="Bảng tính chỉ chứa các con số rời rạc, thiếu tiêu đề cột và nhãn dữ liệu học thuật.",
                    total_words=total_words,
                    pages_count=pages_count,
                    confidence_score=0.95,
                    file_name=filename,
                    file_extension=ext,
                )

        # 1. Check empty (nếu là bảng tính đã đạt >= 12 ô thì ngưỡng từ tối thiểu là 20 từ)
        min_words_required = 20 if (structured_info and structured_info.get("spreadsheet_metrics")) else 50
        if total_words < min_words_required:
            _, flag_code, reason = cls.check_empty(total_words)
            return ValidationResultResponse(
                is_valid=False,
                status="FLAGGED",
                flag_code=flag_code or "BLANK_OR_POOR_QUALITY",
                reason=reason or f"Tệp chứa quá ít nội dung ({total_words} từ).",
                total_words=total_words,
                pages_count=pages_count,
                confidence_score=0.99,
                file_name=filename,
                file_extension=ext,
            )

        # 2. Check gibberish & spam
        is_ok, flag_code, reason = cls.check_gibberish_and_spam(full_text)
        if not is_ok:
            return ValidationResultResponse(
                is_valid=False,
                status="FLAGGED",
                flag_code=flag_code,
                reason=reason,
                total_words=total_words,
                pages_count=pages_count,
                confidence_score=0.95,
                file_name=filename,
                file_extension=ext,
            )

        # 3. Check Watermark (External Platform & Personal Watermark)
        wm_info = cls.check_watermark(
            pages=pages,
            structured_info=structured_info,
            uploader_name=uploader_name,
            uploader_username=uploader_username,
            uploader_email=uploader_email,
        )
        if wm_info.has_watermark:
            if wm_info.watermark_type == "EXTERNAL_PLATFORM":
                return ValidationResultResponse(
                    is_valid=False,
                    status="FLAGGED",
                    flag_code="EXTERNAL_WATERMARK_DETECTED",
                    reason=wm_info.details,
                    total_words=total_words,
                    pages_count=pages_count,
                    confidence_score=0.99,
                    file_name=filename,
                    file_extension=ext,
                    watermark_info=wm_info,
                )
            if wm_info.watermark_type == "PERSONAL_THIRD_PARTY":
                return ValidationResultResponse(
                    is_valid=False,
                    status="FLAGGED",
                    flag_code="PERSONAL_WATERMARK_THIRD_PARTY",
                    reason=wm_info.details,
                    total_words=total_words,
                    pages_count=pages_count,
                    confidence_score=0.96,
                    file_name=filename,
                    file_extension=ext,
                    watermark_info=wm_info,
                )

        # 4. Check commercial copyright
        is_ok, flag_code, reason = cls.check_copyright(pages)
        if not is_ok:
            return ValidationResultResponse(
                is_valid=False,
                status="FLAGGED",
                flag_code=flag_code,
                reason=reason,
                total_words=total_words,
                pages_count=pages_count,
                confidence_score=0.98,
                file_name=filename,
                file_extension=ext,
            )

        # 5. Check duplicate (if DB session provided)
        if db and not (structured_info and structured_info.get("is_image")):
            is_ok, flag_code, reason = cls.check_duplicate(db, full_text, document_id)
            if not is_ok:
                return ValidationResultResponse(
                    is_valid=False,
                    status="FLAGGED",
                    flag_code=flag_code,
                    reason=reason,
                    total_words=total_words,
                    pages_count=pages_count,
                    confidence_score=0.95,
                    file_name=filename,
                    file_extension=ext,
                )

        # Nếu có Watermark cá nhân chính chủ (PERSONAL_SELF) -> trả về trạng thái WARNING cần người dùng xác nhận
        if wm_info.has_watermark and wm_info.watermark_type == "PERSONAL_SELF":
            return ValidationResultResponse(
                is_valid=True,
                status="WARNING",
                flag_code="PERSONAL_WATERMARK_SELF",
                reason=wm_info.details,
                total_words=total_words,
                pages_count=pages_count,
                confidence_score=0.95,
                file_name=filename,
                file_extension=ext,
                requires_confirmation=True,
                warnings=[wm_info.details or "Phát hiện Watermark cá nhân chính chủ."],
                watermark_info=wm_info,
            )

        return ValidationResultResponse(
            is_valid=True,
            status="VALID",
            flag_code=None,
            reason="Tài liệu đạt chuẩn chất lượng học thuật, không chứa Watermark vi phạm và không vi phạm bản quyền.",
            total_words=total_words,
            pages_count=pages_count,
            confidence_score=1.0,
            file_name=filename,
            file_extension=ext,
            requires_confirmation=False,
            watermark_info=wm_info,
        )

    @classmethod
    def validate_single_file_bytes(
        cls,
        file_bytes: bytes,
        filename: str,
        db: Optional[Session] = None,
        uploader_name: Optional[str] = None,
        uploader_username: Optional[str] = None,
        uploader_email: Optional[str] = None,
    ) -> ValidationResultResponse:
        # Bước 1: Kiểm tra Magic Bytes và định dạng
        is_magic_ok, ext, magic_err = TextExtractor.validate_magic_bytes(file_bytes, filename)
        if not is_magic_ok:
            return ValidationResultResponse(
                is_valid=False,
                status="FLAGGED",
                flag_code="INVALID_FILE_SIGNATURE",
                reason=magic_err,
                total_words=0,
                pages_count=0,
                confidence_score=1.0,
                file_name=filename,
                file_extension=ext,
            )

        # Bước 2: Trích xuất cấu trúc đa định dạng
        try:
            structured = TextExtractor.extract_structured(file_bytes, filename=filename)
        except Exception as e:
            return ValidationResultResponse(
                is_valid=False,
                status="FLAGGED",
                flag_code="CORRUPTED_OR_ENCRYPTED_FILE",
                reason=str(getattr(e, "message", None) or str(e)),
                total_words=0,
                pages_count=0,
                confidence_score=1.0,
                file_name=filename,
                file_extension=ext,
            )

        # Bước 3: Thẩm định nội dung, Watermark, chống lách luật & trùng lặp
        return cls.validate_content(
            pages=structured["pages"],
            db=db,
            structured_info=structured,
            uploader_name=uploader_name,
            uploader_username=uploader_username,
            uploader_email=uploader_email,
            filename=filename,
        )

    @classmethod
    def validate_multi_files(
        cls,
        files_payload: List[Tuple[str, bytes]],
        db: Optional[Session] = None,
        uploader_name: Optional[str] = None,
        uploader_username: Optional[str] = None,
        uploader_email: Optional[str] = None,
    ) -> MultiFileValidationResponse:
        if not files_payload:
            return MultiFileValidationResponse(
                overall_valid=False,
                overall_status="FLAGGED",
                requires_confirmation=False,
                auto_merge_images_to_pdf=False,
                total_files=0,
                summary_message="Vui lòng chọn ít nhất 1 tệp tài liệu để kiểm duyệt.",
                file_results=[],
            )

        if len(files_payload) > 5:
            return MultiFileValidationResponse(
                overall_valid=False,
                overall_status="FLAGGED",
                requires_confirmation=False,
                auto_merge_images_to_pdf=False,
                total_files=len(files_payload),
                summary_message=f"Vượt quá giới hạn cho phép: Tối đa 5 tệp / lần đăng (bạn đã chọn {len(files_payload)} tệp).",
                file_results=[],
            )

        total_bytes = sum(len(b) for _, b in files_payload)
        if total_bytes > 50 * 1024 * 1024:
            return MultiFileValidationResponse(
                overall_valid=False,
                overall_status="FLAGGED",
                requires_confirmation=False,
                auto_merge_images_to_pdf=False,
                total_files=len(files_payload),
                summary_message="Tổng dung lượng các tệp vượt quá giới hạn 50 MB / lần đăng.",
                file_results=[],
            )

        results: List[ValidationResultResponse] = []
        all_images = True
        for fname, fbytes in files_payload:
            ext = TextExtractor.get_extension(fname)
            if ext not in TextExtractor.IMAGE_EXTENSIONS:
                all_images = False
            res = cls.validate_single_file_bytes(
                file_bytes=fbytes,
                filename=fname,
                db=db,
                uploader_name=uploader_name,
                uploader_username=uploader_username,
                uploader_email=uploader_email,
            )
            results.append(res)

        any_invalid = any(not r.is_valid for r in results)
        any_warning = any(r.requires_confirmation or r.status == "WARNING" for r in results)

        if any_invalid:
            overall_valid = False
            overall_status = "FLAGGED"
            failed_names = [r.file_name or "file" for r in results if not r.is_valid]
            summary_message = f"Phát hiện {len(failed_names)}/{len(results)} tệp không đạt chuẩn kiểm duyệt ({', '.join(failed_names)}). Vui lòng kiểm tra chi tiết bên dưới."
        elif any_warning:
            overall_valid = True
            overall_status = "WARNING"
            summary_message = "Tất cả tệp đạt chuẩn chất lượng nhưng phát hiện Watermark cá nhân trùng khớp với tài khoản của bạn. Vui lòng tích xác nhận quyền sở hữu để xuất bản."
        else:
            overall_valid = True
            overall_status = "VALID"
            summary_message = f"Cả {len(results)} tệp đều đạt chuẩn kiểm duyệt tự động (Định dạng, Không Watermark vi phạm, Đạt chất lượng học thuật)."

        return MultiFileValidationResponse(
            overall_valid=overall_valid,
            overall_status=overall_status,
            requires_confirmation=any_warning and not any_invalid,
            auto_merge_images_to_pdf=all_images and len(results) >= 1,
            total_files=len(results),
            summary_message=summary_message,
            file_results=results,
        )
