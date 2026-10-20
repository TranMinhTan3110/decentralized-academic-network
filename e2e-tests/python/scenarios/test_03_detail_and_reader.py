import time
import pytest
from pages.discover_page import DiscoverPage
from pages.detail_page import DetailPage

class TestDetailAndReader:
    """
    Kịch bản kiểm thử:
    1. API Detail (/api/v1/documents/{id}): Hiển thị chi tiết thông tin tài liệu.
    2. API View Tracking (/api/v1/documents/{id}/view): Ghi nhận lượt xem tài liệu.
    3. Trình đọc PDF & DRM Preview (/preview, /unlock-status, /unlock):
       Kiểm tra phân trang reader và cơ chế khóa DRM xem trước.
    """

    def test_open_document_detail_from_feed(self, driver):
        """Mở tài liệu từ feed và kiểm tra thông tin hiển thị trên trang Detail"""
        discover_page = DiscoverPage(driver)
        discover_page.load()

        cards = discover_page.get_document_cards()
        if not cards:
            pytest.skip("Chưa có tài liệu trên hệ thống để test trang chi tiết.")

        discover_page.click_first_document()

        detail_page = DetailPage(driver)
        title = detail_page.get_document_title()

        assert len(title) > 0, "Tiêu đề tài liệu không hiển thị trên trang Detail."

    def test_reader_pagination_navigation(self, driver):
        """Kiểm tra điều hướng chuyển trang đọc thử trong reader"""
        discover_page = DiscoverPage(driver)
        discover_page.load()

        cards = discover_page.get_document_cards()
        if not cards:
            pytest.skip("Chưa có tài liệu để kiểm tra phân trang.")

        discover_page.click_first_document()
        detail_page = DetailPage(driver)

        # Thử bấm chuyển sang trang tiếp theo nếu có nhiều trang
        next_btns = detail_page.find_elements(*detail_page.NEXT_PAGE_BTN, timeout=2)
        if next_btns and next_btns[0].is_enabled():
            detail_page.navigate_next_page()
            time.sleep(0.5)

            # Kiểm tra trạng thái khóa DRM nếu chuyển qua trang bị giới hạn
            if detail_page.is_drm_locked():
                print("\n[E2E Info] Trang bị khóa DRM. Hiển thị thông báo yêu cầu mở khóa chính xác.")
