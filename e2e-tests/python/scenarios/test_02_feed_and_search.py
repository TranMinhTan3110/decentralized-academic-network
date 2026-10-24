import time
import pytest
from pages.discover_page import DiscoverPage

class TestFeedAndSearch:
    """
    Kịch bản kiểm thử:
    1. API Feed (/api/v1/documents): Tải feed danh sách tài liệu lên giao diện.
    2. API Search (/api/v1/documents/search): Tìm kiếm toàn văn theo từ khóa.
    """

    def test_feed_documents_displayed(self, driver):
        """Kiểm tra trang Khám phá gọi API Feed và hiển thị danh sách tài liệu"""
        discover_page = DiscoverPage(driver)
        discover_page.load()

        time.sleep(1.5) # Chờ API getFeed trả về kết quả
        cards = discover_page.get_document_cards()

        assert len(cards) > 0, "Không có tài liệu nào được hiển thị từ Feed API."

    def test_search_documents_by_keyword(self, driver):
        """Kiểm tra chức năng tìm kiếm gọi API /documents/search và cập nhật UI"""
        discover_page = DiscoverPage(driver)
        discover_page.load()

        # Lấy tiêu đề của tài liệu đầu tiên làm từ khóa tìm kiếm
        initial_title = discover_page.get_first_document_title()
        if not initial_title:
            pytest.skip("Chưa có tài liệu trên hệ thống để test tìm kiếm.")

        search_keyword = initial_title.split()[0] # Lấy từ đầu tiên
        discover_page.search_document(search_keyword)

        time.sleep(1.5)
        filtered_cards = discover_page.get_document_cards()
        assert len(filtered_cards) > 0, f"Tìm kiếm từ khóa '{search_keyword}' không trả về kết quả."

    def test_clear_search_restores_feed(self, driver):
        """Kiểm tra việc xóa từ khóa tìm kiếm sẽ khôi phục lại Feed mặc định"""
        discover_page = DiscoverPage(driver)
        discover_page.load()

        discover_page.search_document("TuKhoaKhongTonTai99999")
        time.sleep(1.0)

        # Xóa từ khóa
        discover_page.clear_search()
        time.sleep(1.5)

        cards = discover_page.get_document_cards()
        assert len(cards) > 0, "Feed không được khôi phục sau khi xóa từ khóa tìm kiếm."
