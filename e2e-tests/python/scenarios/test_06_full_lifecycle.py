import time
import pytest
from config import TEST_DATA_DIR
from pages.upload_page import UploadPage
from pages.detail_page import DetailPage
from pages.discover_page import DiscoverPage

class TestFullDocumentLifecycle:
    """
    Kịch bản kiểm thử tích hợp xuyên suốt vòng đời tài liệu (End-to-End Master Lifecycle):
    [Upload Document] -> [View Detail & Reader] -> [Like] -> [Comment] -> [Bookmark] -> [Search & Discover]
    """

    def test_complete_document_workflow(self, auth_driver):
        sample_pdf = TEST_DATA_DIR / "sample_academic.pdf"
        assert sample_pdf.exists(), "File mẫu PDF không tồn tại."

        unique_id = int(time.time())
        doc_title = f"Đề cương Mạng Máy tính Chuyên sâu E2E {unique_id}"

        # ------------------------------------------------------------------
        # BƯỚC 1: Đăng tải tài liệu qua trang Upload
        # ------------------------------------------------------------------
        print("\n[Bước 1] Đăng tải tài liệu mới lên mạng lưới...")
        upload_page = UploadPage(auth_driver)
        upload_page.load()

        upload_page.select_file(sample_pdf)
        upload_page.fill_metadata(
            title=doc_title,
            school="Đại học Bách Khoa",
            subject="Mạng Máy tính",
            kind="Đề thi & Đáp án",
            year="2026",
            agree_rights=True
        )

        upload_page.submit_and_verify()
        upload_page.publish_to_ipfs()

        # Chờ chuyển hướng trang chi tiết
        detail_url = upload_page.wait_for_detail_page_redirect(timeout=25)
        print(f"[Bước 1 Thành công] Đã chuyển hướng tới: {detail_url}")
        assert "/detail/" in detail_url

        # ------------------------------------------------------------------
        # BƯỚC 2: Kiểm tra thông tin hiển thị trên trang Detail
        # ------------------------------------------------------------------
        print("\n[Bước 2] Kiểm tra thông tin tài liệu trên trang Detail...")
        detail_page = DetailPage(auth_driver)
        displayed_title = detail_page.get_document_title()
        assert doc_title in displayed_title or displayed_title in doc_title, \
            f"Tiêu đề không khớp. Kỳ vọng: {doc_title}, Thực tế: {displayed_title}"

        # ------------------------------------------------------------------
        # BƯỚC 3: Tương tác Thả tim (Like)
        # ------------------------------------------------------------------
        print("\n[Bước 3] Thả tim tài liệu...")
        initial_likes = detail_page.get_likes_count()
        detail_page.click_like()
        time.sleep(0.5)
        assert detail_page.get_likes_count() == initial_likes + 1, "Thả tim thất bại."

        # ------------------------------------------------------------------
        # BƯỚC 4: Gửi bình luận đánh giá tài liệu
        # ------------------------------------------------------------------
        print("\n[Bước 4] Gửi bình luận đánh giá...")
        comment_content = f"Tài liệu xuất bản thành công qua E2E Test! Mã: {unique_id}"
        detail_page.add_comment(comment_content)
        time.sleep(0.8)
        assert detail_page.get_comments_count() > 0, "Bình luận chưa hiển thị trên trang."

        # ------------------------------------------------------------------
        # BƯỚC 5: Lưu tài liệu vào Bookmark
        # ------------------------------------------------------------------
        print("\n[Bước 5] Lưu tài liệu vào bộ sưu tập Bookmark...")
        if not detail_page.is_bookmarked():
            detail_page.click_bookmark()
            time.sleep(0.5)
            assert detail_page.is_bookmarked(), "Lưu bookmark thất bại."

        # ------------------------------------------------------------------
        # BƯỚC 6: Tìm kiếm tài liệu vừa tạo trên trang Khám phá
        # ------------------------------------------------------------------
        print("\n[Bước 6] Tìm kiếm tài liệu vừa tạo trên trang Khám phá...")
        discover_page = DiscoverPage(auth_driver)
        discover_page.load()
        discover_page.search_document(f"Chuyên sâu E2E {unique_id}")
        time.sleep(1.5)

        cards = discover_page.get_document_cards()
        assert len(cards) > 0, f"Không tìm thấy tài liệu vừa tạo khi search với mã: {unique_id}"
        print(f"[Bước 6 Thành công] Tìm thấy tài liệu trên hệ thống tìm kiếm toàn văn!")
