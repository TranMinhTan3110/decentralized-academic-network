import io
import uuid
import zipfile
from unittest.mock import MagicMock
import openpyxl
import pymupdf

from app.services.content_validator import ContentValidator
from app.services.text_extractor import TextExtractor


def _create_sample_docx(paragraphs, watermark_text=None, creator="Au Duong Tan"):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        core_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
        <cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
                           xmlns:dc="http://purl.org/dc/elements/1.1/">
            <dc:creator>{creator}</dc:creator>
            <dc:title>Tai lieu hoc thuat</dc:title>
        </cp:coreProperties>"""
        zf.writestr("docProps/core.xml", core_xml)

        if watermark_text:
            header_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
            <w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                   xmlns:v="urn:schemas-microsoft-com:vml">
                <v:shape id="PowerPlusWaterMarkObject1">
                    <v:textpath string="{watermark_text}"/>
                </v:shape>
            </w:hdr>"""
            zf.writestr("word/header1.xml", header_xml)

        p_xml = "".join(f"<w:p><w:r><w:t>{p}</w:t></w:r></w:p>" for p in paragraphs)
        doc_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
            <w:body>{p_xml}</w:body>
        </w:document>"""
        zf.writestr("word/document.xml", doc_xml)
    return buf.getvalue()


def _create_sample_pptx(slides_text, master_watermark=None):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("ppt/presentation.xml", "<p:presentation xmlns:p='http://schemas.openxmlformats.org/presentationml/2006/main'/>")
        zf.writestr(
            "docProps/core.xml",
            "<cp:coreProperties xmlns:cp='http://schemas.openxmlformats.org/package/2006/metadata/core-properties' xmlns:dc='http://purl.org/dc/elements/1.1/'><dc:creator>SlideAuthor</dc:creator></cp:coreProperties>"
        )
        if master_watermark:
            zf.writestr(
                "ppt/slideMasters/slideMaster1.xml",
                f"<p:sldMaster xmlns:p='http://schemas.openxmlformats.org/presentationml/2006/main' xmlns:a='http://schemas.openxmlformats.org/drawingml/2006/main'><a:t>{master_watermark}</a:t></p:sldMaster>"
            )
        for idx, text in enumerate(slides_text, start=1):
            zf.writestr(
                f"ppt/slides/slide{idx}.xml",
                f"<p:sld xmlns:p='http://schemas.openxmlformats.org/presentationml/2006/main' xmlns:a='http://schemas.openxmlformats.org/drawingml/2006/main'><a:t>{text}</a:t></p:sld>"
            )
    return buf.getvalue()


def _create_sample_xlsx(rows, header_watermark=None):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "DuLieuKinhTe"
    if header_watermark:
        ws.oddHeader.center.text = header_watermark
    for r in rows:
        ws.append(r)
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


def _create_sample_png(detailed=True):
    doc = pymupdf.open()
    page = doc.new_page(width=600, height=400)
    if detailed:
        for i in range(10):
            page.insert_text((30, 40 + i * 30), f"So do giai thuat va cong thuc toan hoc dong {i}: y = ax^2 + bx + c", fontsize=14)
    pix = page.get_pixmap()
    png_bytes = pix.tobytes("png")
    doc.close()
    return png_bytes


def test_check_empty_poor_quality():
    is_ok, code, reason = ContentValidator.check_empty(total_words=20)
    assert is_ok is False
    assert code == "BLANK_OR_POOR_QUALITY"

    is_ok, code, reason = ContentValidator.check_empty(total_words=100)
    assert is_ok is True
    assert code is None


def test_check_gibberish_repetition():
    repeated_text = ("spam " * 40) + "môn học bài giảng lý thuyết giải thuật máy tính"
    is_ok, code, reason = ContentValidator.check_gibberish_and_spam(repeated_text)
    assert is_ok is False
    assert code == "SPAM_GIBBERISH"


def test_check_gibberish_keyboard_spam_and_lorem():
    spam_text = "Nội dung học thuật asdfghjklasdfghjklasdfghjklasdfghjklasdfghjkl bài giảng đại học"
    is_ok, code, _ = ContentValidator.check_gibberish_and_spam(spam_text)
    assert is_ok is False
    assert code == "SPAM_GIBBERISH"

    lorem_text = "Lorem ipsum dolor sit amet consectetur adipiscing elit " * 10
    is_ok2, code2, _ = ContentValidator.check_gibberish_and_spam(lorem_text)
    assert is_ok2 is False
    assert code2 == "SPAM_GIBBERISH"

    numbers_only = "12 34 56 78 90 11 22 33 44 55 " * 8
    is_ok3, code3, _ = ContentValidator.check_gibberish_and_spam(numbers_only)
    assert is_ok3 is False
    assert code3 == "SPAM_GIBBERISH"


def test_check_valid_academic_text():
    valid_text = (
        "Cấu trúc dữ liệu và giải thuật là môn học nền tảng của ngành công nghệ thông tin. "
        "Sinh viên cần nắm vững các giải thuật sắp xếp như QuickSort, MergeSort và các cấu trúc cây."
    )
    is_ok, code, reason = ContentValidator.check_gibberish_and_spam(valid_text)
    assert is_ok is True


def test_check_copyright_isbn_and_publisher():
    pages = [
        {"page_number": 1, "text": "Giáo trình Giải tích 1. ISBN 978-604-0-12345-6. Tái bản lần thứ nhất."}
    ]
    is_ok, code, reason = ContentValidator.check_copyright(pages)
    assert is_ok is False
    assert code == "COPYRIGHT_DETECTED"
    assert "ISBN" in reason

    pages2 = [
        {"page_number": 1, "text": "Tài liệu học tập lưu hành nội bộ. Bản quyền thuộc về Nhà xuất bản Giáo dục."}
    ]
    is_ok2, code2, reason2 = ContentValidator.check_copyright(pages2)
    assert is_ok2 is False
    assert code2 == "COPYRIGHT_DETECTED"
    assert "Nhà xuất bản Giáo dục" in reason2


def test_full_validate_content_pipeline():
    academic_pages = [
        {
            "page_number": 1,
            "text": "Chương 1: Tổng quan về hệ điều hành phân tán và mạng máy tính. " * 10
        }
    ]
    res = ContentValidator.validate_content(pages=academic_pages)
    assert res.is_valid is True
    assert res.status == "VALID"


def test_magic_bytes_validation_all_formats():
    ok, ext, err = TextExtractor.validate_magic_bytes(b"hello", "malware.exe")
    assert ok is False
    assert "không được hỗ trợ" in err

    ok, ext, err = TextExtractor.validate_magic_bytes(b"not a pdf content", "fake.pdf")
    assert ok is False
    assert "%PDF-" in err

    ok, ext, err = TextExtractor.validate_magic_bytes(b"not a zip", "fake.docx")
    assert ok is False

    ok, ext, err = TextExtractor.validate_magic_bytes(b"not a png", "fake.png")
    assert ok is False

    ok, ext, err = TextExtractor.validate_magic_bytes(b"not a jpg", "fake.jpg")
    assert ok is False

    ok, ext, err = TextExtractor.validate_magic_bytes(b"not a webp", "fake.webp")
    assert ok is False

    ok, ext, err = TextExtractor.validate_magic_bytes(b"%PDF-1.4 fake binary in txt", "fake.txt")
    assert ok is False


def test_multi_format_docx_and_watermarks():
    academic_sentence = (
        "Chương 1: Phân tích kinh tế vi mô nghiên cứu hành vi của người tiêu dùng và doanh nghiệp trên thị trường cạnh tranh hoàn hảo."
    )
    # 1. DOCX sạch
    docx_clean = _create_sample_docx([academic_sentence] * 5)
    res_clean = ContentValidator.validate_single_file_bytes(docx_clean, "bai_giang.docx", uploader_name="Âu Dương Tấn")
    assert res_clean.is_valid is True
    assert res_clean.status == "VALID"

    # 2. DOCX có Watermark nền tảng ngoài (Studocu) -> Chặn tuyệt đối
    docx_studocu = _create_sample_docx([academic_sentence] * 5, watermark_text="Downloaded by user on Studocu.com")
    res_ext = ContentValidator.validate_single_file_bytes(docx_studocu, "studocu.docx", uploader_name="Âu Dương Tấn")
    assert res_ext.is_valid is False
    assert res_ext.flag_code == "EXTERNAL_WATERMARK_DETECTED"

    # 3. DOCX có Watermark cá nhân của người khác -> Chặn tuyệt đối
    docx_other = _create_sample_docx([academic_sentence] * 5, watermark_text="Tài liệu của Nguyễn Văn B - 0912345678")
    res_other = ContentValidator.validate_single_file_bytes(docx_other, "other.docx", uploader_name="Âu Dương Tấn")
    assert res_other.is_valid is False
    assert res_other.flag_code == "PERSONAL_WATERMARK_THIRD_PARTY"

    # 4. DOCX có Watermark cá nhân trùng tên người đăng -> Cảnh báo xác nhận (WARNING)
    docx_self = _create_sample_docx([academic_sentence] * 5, watermark_text="Bản quyền cá nhân Âu Dương Tấn")
    res_self = ContentValidator.validate_single_file_bytes(
        docx_self, "self.docx", uploader_name="Âu Dương Tấn", uploader_username="auduongtan"
    )
    assert res_self.is_valid is True
    assert res_self.status == "WARNING"
    assert res_self.requires_confirmation is True
    assert res_self.flag_code == "PERSONAL_WATERMARK_SELF"


def test_multi_format_xlsx_pptx_csv_txt_and_images():
    # Excel hợp lệ
    rows = [
        ["Mã môn", "Tên học phần", "Số tín chỉ", "Mô tả nội dung học thuật"],
        ["IT001", "Nhập môn lập trình", 4, "Cấu trúc điều khiển, hàm, mảng và con trỏ trong C++"],
        ["IT002", "Lập trình hướng đối tượng", 4, "Tính đóng gói, kế thừa, đa hình và mẫu thiết kế"],
        ["IT003", "Cấu trúc dữ liệu và giải thuật", 4, "Danh sách liên kết, ngăn xếp, hàng đợi, cây nhị phân"],
        ["IT004", "Cơ sở dữ liệu quan hệ", 4, "Đại số quan hệ, ngôn ngữ truy vấn SQL và chuẩn hóa"],
    ]
    xlsx_bytes = _create_sample_xlsx(rows)
    res_xlsx = ContentValidator.validate_single_file_bytes(xlsx_bytes, "bang_diem.xlsx")
    assert res_xlsx.is_valid is True

    # PPTX hợp lệ
    slide_text = (
        "Bài giảng Kiến trúc máy tính và Hệ điều hành: Bộ nhớ đệm Cache, cơ chế phân trang bộ nhớ ảo "
        "và lập lịch tiến trình CPU đa luồng trong hệ thống phân tán hiện đại."
    )
    pptx_bytes = _create_sample_pptx([slide_text, slide_text])
    res_pptx = ContentValidator.validate_single_file_bytes(pptx_bytes, "slide_hoc_thuat.pptx")
    assert res_pptx.is_valid is True

    # CSV và TXT hợp lệ
    csv_bytes = (
        "MaMon,TenMon,MoTaChiTiet\n"
        + "IT101,Tri tue nhan tao,Thuat toan tim kiem A* va hoc may co giam sat tren tap du lieu lon\n" * 6
    ).encode("utf-8")
    res_csv = ContentValidator.validate_single_file_bytes(csv_bytes, "du_lieu.csv")
    assert res_csv.is_valid is True

    txt_bytes = (slide_text * 3).encode("utf-8")
    res_txt = ContentValidator.validate_single_file_bytes(txt_bytes, "ghi_chep.txt")
    assert res_txt.is_valid is True

    # Ảnh chi tiết hợp lệ vs Ảnh trắng rỗng
    png_valid = _create_sample_png(detailed=True)
    res_png = ContentValidator.validate_single_file_bytes(png_valid, "so_do.png")
    assert res_png.is_valid is True

    png_blank = _create_sample_png(detailed=False)
    res_png_blank = ContentValidator.validate_single_file_bytes(png_blank, "trang_tron.png")
    assert res_png_blank.is_valid is False
    assert res_png_blank.flag_code == "BLANK_OR_POOR_QUALITY"


def test_validate_multi_files_limits_and_hybrid_image_merge(client):
    png_valid = _create_sample_png(detailed=True)
    # 1. Chọn vượt quá 5 file -> chặn
    six_files = [(f"img_{i}.png", png_valid) for i in range(6)]
    res_over = ContentValidator.validate_multi_files(six_files)
    assert res_over.overall_valid is False
    assert "Tối đa 5 tệp" in res_over.summary_message

    # 2. Chọn 2 file ảnh hợp lệ -> auto_merge_images_to_pdf = True
    two_images = [("trang1.png", png_valid), ("trang2.png", png_valid)]
    res_imgs = ContentValidator.validate_multi_files(two_images, uploader_name="Âu Dương Tấn")
    assert res_imgs.overall_valid is True
    assert res_imgs.auto_merge_images_to_pdf is True

    # 3. Gọi qua API endpoint POST /api/v1/documents/validate-upload
    resp = client.post(
        "/api/v1/documents/validate-upload",
        data={"uploader_name": "Âu Dương Tấn", "uploader_username": "auduongtan"},
        files=[
            ("files", ("trang1.png", png_valid, "image/png")),
            ("files", ("trang2.png", png_valid, "image/png")),
        ],
    )
    assert resp.status_code == 200
    body = resp.json()["data"]
    assert body["overall_valid"] is True
    assert body["auto_merge_images_to_pdf"] is True
    assert body["total_files"] == 2


def test_pdf_structured_extraction_and_watermark_cases():
    doc = pymupdf.open()
    academic_line = (
        "Chương 1: Tổng quan về mạng máy tính, giao thức định tuyến OSPF, BGP và bảo mật mạng doanh nghiệp hiện đại. "
    )
    for page_i in range(3):
        p = doc.new_page(width=600, height=800)
        # Header lặp lại ở tất cả các trang
        p.insert_text((50, 30), "Biên soạn: Âu Dương Tấn - auduongtan@edu.vn", fontsize=10)
        # Nội dung chính
        for line_i in range(8):
            p.insert_text((50, 120 + line_i * 40), academic_line, fontsize=11)
        # Footer lặp lại
        p.insert_text((50, 760), f"Trang {page_i + 1}/3", fontsize=10)
    pdf_bytes = doc.tobytes()
    doc.close()

    # Kiểm duyệt khi người đăng là chính chủ Âu Dương Tấn -> WARNING (PERSONAL_WATERMARK_SELF)
    res_self = ContentValidator.validate_single_file_bytes(
        pdf_bytes, "mang_may_tinh.pdf", uploader_name="Âu Dương Tấn", uploader_email="auduongtan@edu.vn"
    )
    assert res_self.is_valid is True
    assert res_self.status == "WARNING"
    assert res_self.requires_confirmation is True

    # Kiểm duyệt khi người đăng là người khác -> FLAGGED (PERSONAL_WATERMARK_THIRD_PARTY)
    res_other = ContentValidator.validate_single_file_bytes(
        pdf_bytes, "mang_may_tinh.pdf", uploader_name="Trần Thị C", uploader_email="tranthic@edu.vn"
    )
    assert res_other.is_valid is False
    assert res_other.flag_code == "PERSONAL_WATERMARK_THIRD_PARTY"

    # Kiểm tra các nhánh lỗi bảng tính ít ô / chỉ toàn số và ảnh quá nhỏ
    small_doc = pymupdf.open()
    small_page = small_doc.new_page(width=100, height=100)
    small_png = small_page.get_pixmap().tobytes("png")
    small_doc.close()
    res_small = ContentValidator.validate_single_file_bytes(small_png, "tiny.png")
    assert res_small.is_valid is False
    assert res_small.flag_code == "IMAGE_TOO_SMALL"

    few_cells_xlsx = _create_sample_xlsx([["A", "B"]])
    res_few = ContentValidator.validate_single_file_bytes(few_cells_xlsx, "empty.xlsx")
    assert res_few.is_valid is False
    assert res_few.flag_code == "BLANK_OR_POOR_QUALITY"

    num_only_xlsx = _create_sample_xlsx([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16]])
    res_num = ContentValidator.validate_single_file_bytes(num_only_xlsx, "numbers.xlsx")
    assert res_num.is_valid is False
    assert res_num.flag_code == "SPAM_GIBBERISH"

    # Excel có watermark ở Header & PPTX có watermark ở SlideMaster
    xlsx_wm = _create_sample_xlsx(
        [
            ["Mã môn", "Tên môn", "Mô tả chi tiết học phần đại học"],
            ["CS101", "Khoa học máy tính", "Thuật toán và cấu trúc dữ liệu nâng cao trong thực tế"],
            ["CS102", "Hệ cơ sở dữ liệu", "Thiết kế lược đồ quan hệ và tối ưu hóa câu lệnh truy vấn"],
            ["CS103", "Mạng máy tính", "Kiến trúc phân tầng OSI và bộ giao thức truyền thông TCP/IP"],
            ["CS104", "Trí tuệ nhân tạo", "Mạng nơ-ron học sâu và xử lý ngôn ngữ tự nhiên tiếng Việt"],
        ],
        header_watermark="Downloaded by user on Studocu",
    )
    res_xlsx_wm = ContentValidator.validate_single_file_bytes(xlsx_wm, "wm.xlsx")
    assert res_xlsx_wm.is_valid is False
    assert res_xlsx_wm.flag_code == "EXTERNAL_WATERMARK_DETECTED"

    pptx_wm = _create_sample_pptx([academic_line * 4], master_watermark="CourseHero.com")
    res_pptx_wm = ContentValidator.validate_single_file_bytes(pptx_wm, "wm.pptx")
    assert res_pptx_wm.is_valid is False
    assert res_pptx_wm.flag_code == "EXTERNAL_WATERMARK_DETECTED"

    # Kiểm tra extract_from_bytes với file không phải PDF & danh sách rỗng
    extracted_pages = TextExtractor.extract_from_bytes(xlsx_wm, filename="wm.xlsx")
    assert len(extracted_pages) >= 1
    empty_multi = ContentValidator.validate_multi_files([])
    assert empty_multi.overall_valid is False

    # Kiểm tra validate_multi_files khi có 1 file lỗi và 1 file cảnh báo
    docx_self = _create_sample_docx([academic_line] * 5, watermark_text="Bản quyền cá nhân Âu Dương Tấn")
    warn_multi = ContentValidator.validate_multi_files(
        [("self.docx", docx_self)], uploader_name="Âu Dương Tấn"
    )
    assert warn_multi.overall_status == "WARNING"
    assert warn_multi.requires_confirmation is True

    flagged_multi = ContentValidator.validate_multi_files(
        [("wm.pptx", pptx_wm)], uploader_name="Âu Dương Tấn"
    )
    assert flagged_multi.overall_status == "FLAGGED"
    assert flagged_multi.overall_valid is False

    # Kiểm tra PDF có ảnh lặp lại qua 3 trang, xoay chữ, annotation và extract_from_bytes
    doc_img = pymupdf.open()
    sample_png = _create_sample_png(detailed=True)
    for idx in range(3):
        p = doc_img.new_page(width=600, height=800)
        p.insert_image(pymupdf.Rect(100, 100, 350, 250), stream=sample_png)
        p.insert_text((200, 400), "Rotated Watermark Au Duong Tan", rotate=90)
        p.add_freetext_annot(pymupdf.Rect(50, 50, 200, 80), "Stamp Au Duong Tan")
        for l_idx in range(6):
            p.insert_text((40, 300 + l_idx * 30), academic_line, fontsize=11)
    pdf_with_img = doc_img.tobytes()
    doc_img.close()

    res_pdf_img = ContentValidator.validate_single_file_bytes(
        pdf_with_img, "graphic.pdf", uploader_name="Au Duong Tan"
    )
    assert res_pdf_img.is_valid is True
    pages_pdf = TextExtractor.extract_from_bytes(pdf_with_img, "graphic.pdf")
    assert len(pages_pdf) == 3
    assert TextExtractor.extract_from_path("non_existent_path_12345.pdf") == []



