import time
import pytest
from pathlib import Path
from config import TEST_DATA_DIR
from pages.upload_page import UploadPage

class TestUploadAndTaxonomy:
    """
    Kịch bản kiểm thử:
    1. API Taxonomy (/api/v1/taxonomy/universities & /courses): Kiểm tra frontend tự động nạp danh mục trường và môn học.
    2. API Upload (/api/v1/documents/upload): Kiểm tra luồng upload file PDF và xuất bản lên IPFS.
    """

    def test_taxonomy_data_loaded_into_datalists(self, auth_driver):
        """Kiểm tra danh mục trường và môn học từ TaxonomyController được nạp vào form Upload"""
        upload_page = UploadPage(auth_driver)
        upload_page.load()

        time.sleep(1) # Chờ taxonomyService gọi API
        uni_count = upload_page.get_taxonomy_universities_count()
        course_count = upload_page.get_taxonomy_courses_count()

        assert uni_count > 0, "Datalist trường đại học trống, Taxonomy API chưa trả về dữ liệu."
        assert course_count > 0, "Datalist môn học trống, Taxonomy API chưa trả về dữ liệu."

    def test_upload_pdf_document_lifecycle(self, auth_driver):
        """
        Kiểm tra luồng tải lên tài liệu hoàn chỉnh:
        - Chọn file PDF hợp lệ
        - Điền tiêu đề, trường, môn học, bản quyền
        - Submit form bước 1 (Client signature check)
        - Xuất bản lên Mạng lưới IPFS bước 2
        - Xác nhận frontend chuyển hướng sang trang /detail/{id}
        """
        upload_page = UploadPage(auth_driver)
        upload_page.load()

        sample_pdf = TEST_DATA_DIR / "sample_academic.pdf"
        assert sample_pdf.exists(), f"Không tìm thấy file mẫu tại {sample_pdf}"

        # 1. Chọn file
        upload_page.select_file(sample_pdf)

        # 2. Điền metadata
        test_title = f"Tài liệu Ôn tập E2E {int(time.time())}"
        upload_page.fill_metadata(
            title=test_title,
            school="Đại học Quốc gia TP.HCM",
            subject="Cấu trúc Dữ liệu và Giải thuật",
            kind="Đề thi & Đáp án",
            year="2026",
            agree_rights=True
        )

        # 3. Submit kiểm tra chữ ký PDF
        upload_page.submit_and_verify()

        # 4. Xuất bản lên IPFS
        upload_page.publish_to_ipfs()

        # 5. Chờ chuyển hướng trang chi tiết
        current_url = upload_page.wait_for_detail_page_redirect(timeout=25)
        assert "/detail/" in current_url, f"Chuyển hướng thất bại. URL hiện tại: {current_url}"
