import uuid
from unittest.mock import MagicMock
from app.services.content_validator import ContentValidator

def test_check_empty_poor_quality():
    # Less than 50 words
    is_ok, code, reason = ContentValidator.check_empty(total_words=20)
    assert is_ok is False
    assert code == "BLANK_OR_POOR_QUALITY"

    # 50 words or more
    is_ok, code, reason = ContentValidator.check_empty(total_words=100)
    assert is_ok is True
    assert code is None

def test_check_gibberish_repetition():
    # Single word repeated > 40%
    repeated_text = ("spam " * 40) + "môn học bài giảng lý thuyết giải thuật máy tính"
    is_ok, code, reason = ContentValidator.check_gibberish_and_spam(repeated_text)
    assert is_ok is False
    assert code == "SPAM_GIBBERISH"

def test_check_gibberish_keyboard_spam():
    spam_text = "Nội dung học thuật asdfghjklasdfghjklasdfghjklasdfghjklasdfghjkl bài giảng đại học"
    is_ok, code, reason = ContentValidator.check_gibberish_and_spam(spam_text)
    assert is_ok is False
    assert code == "SPAM_GIBBERISH"

def test_check_valid_academic_text():
    valid_text = (
        "Cấu trúc dữ liệu và giải thuật là môn học nền tảng của ngành công nghệ thông tin. "
        "Sinh viên cần nắm vững các giải thuật sắp xếp như QuickSort, MergeSort và các cấu trúc cây."
    )
    is_ok, code, reason = ContentValidator.check_gibberish_and_spam(valid_text)
    assert is_ok is True

def test_check_copyright_isbn():
    pages = [
        {"page_number": 1, "text": "Giáo trình Giải tích 1. ISBN 978-604-0-12345-6. Tái bản lần thứ nhất."}
    ]
    is_ok, code, reason = ContentValidator.check_copyright(pages)
    assert is_ok is False
    assert code == "COPYRIGHT_DETECTED"
    assert "ISBN" in reason

def test_check_copyright_publisher():
    pages = [
        {"page_number": 1, "text": "Tài liệu học tập lưu hành nội bộ. Bản quyền thuộc về Nhà xuất bản Giáo dục."}
    ]
    is_ok, code, reason = ContentValidator.check_copyright(pages)
    assert is_ok is False
    assert code == "COPYRIGHT_DETECTED"
    assert "Nhà xuất bản Giáo dục" in reason

def test_full_validate_content_pipeline():
    # Valid document
    academic_pages = [
        {
            "page_number": 1,
            "text": "Chương 1: Tổng quan về hệ điều hành phân tán và mạng máy tính. " * 10
        }
    ]
    res = ContentValidator.validate_content(pages=academic_pages)
    assert res.is_valid is True
    assert res.status == "VALID"
