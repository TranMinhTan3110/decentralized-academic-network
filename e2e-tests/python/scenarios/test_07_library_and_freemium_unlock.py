import time
import uuid
import pytest
from pages.discover_page import DiscoverPage
from pages.detail_page import DetailPage
from pages.library_page import LibraryPage

class TestLibraryAndFreemiumUnlock:
    """
    Kịch bản kiểm thử các API và tính năng bổ sung của Document Service:
    1. Báo cáo vi phạm tài liệu (POST /api/v1/documents/{id}/report).
    2. Xóa bình luận của chính mình (DELETE /api/v1/documents/comments/{commentId}).
    3. Xem danh sách người thích tài liệu (GET /api/v1/documents/{id}/likes).
    4. Thư viện cá nhân: Kiểm tra đồng bộ tab Đã lưu và Đã mở khóa
       (GET /api/v1/documents/bookmarks/me & GET /api/v1/documents/unlocked/me).
    """

    def test_report_document_violation(self, auth_driver):
        """Kiểm tra chức năng báo cáo vi phạm tài liệu học thuật"""
        discover_page = DiscoverPage(auth_driver)
        discover_page.load()

        cards = discover_page.get_document_cards()
        if not cards:
            pytest.skip("Chưa có tài liệu để kiểm tra báo cáo.")

        discover_page.click_first_document()
        detail_page = DetailPage(auth_driver)

        # Mở modal báo cáo và gửi báo cáo vi phạm
        detail_page.submit_report(
            reason="Nội dung sai lệch hoặc Spam",
            description="Tài liệu chứa thông tin không chính xác hoặc trùng lặp."
        )

        time.sleep(1.0)
        # Xác nhận modal đã đóng thành công sau khi gửi
        report_modals = detail_page.find_elements(*detail_page.REPORT_MODAL, timeout=2)
        assert len(report_modals) == 0, "Modal báo cáo vi phạm không đóng sau khi gửi thành công."

    def test_add_and_delete_own_comment(self, auth_driver):
        """Kiểm tra người dùng có thể xóa bình luận do chính mình đăng tải"""
        discover_page = DiscoverPage(auth_driver)
        discover_page.load()

        cards = discover_page.get_document_cards()
        if not cards:
            pytest.skip("Chưa có tài liệu để kiểm tra bình luận.")

        discover_page.click_first_document()
        detail_page = DetailPage(auth_driver)

        initial_count = detail_page.get_comments_count()
        unique_comment = f"Bình luận kiểm thử xóa tự động - {uuid.uuid4().hex[:6]}"

        # Đăng bình luận mới
        detail_page.add_comment(unique_comment)
        time.sleep(1.0)

        new_count = detail_page.get_comments_count()
        assert new_count >= initial_count + 1, "Bình luận mới không xuất hiện trong danh sách."
        assert detail_page.has_delete_comment_button(), "Không tìm thấy nút xóa bình luận của chính mình."

        # Xóa bình luận vừa tạo
        detail_page.delete_own_comment()
        time.sleep(1.0)

        final_count = detail_page.get_comments_count()
        assert final_count <= new_count - 1, "Bình luận chưa được xóa khỏi giao diện sau khi gọi API delete."

    def test_view_users_who_liked(self, auth_driver):
        """Kiểm tra modal hiển thị danh sách người dùng đã thả tim tài liệu"""
        discover_page = DiscoverPage(auth_driver)
        discover_page.load()

        cards = discover_page.get_document_cards()
        if not cards:
            pytest.skip("Chưa có tài liệu để kiểm tra.")

        discover_page.click_first_document()
        detail_page = DetailPage(auth_driver)

        # Mở modal người thích
        detail_page.open_likers_modal()
        time.sleep(0.8)

        assert detail_page.is_likers_modal_open(), "Modal danh sách người thích không hiển thị."

    def test_library_personal_tabs(self, auth_driver):
        """Kiểm tra điều hướng các tab Thư viện cá nhân (Đã đăng, Đã lưu, Đã mở khóa)"""
        library_page = LibraryPage(auth_driver)
        library_page.load()

        # Kiểm tra tiêu đề trang
        assert "Tài liệu đã đăng" in library_page.get_text(*library_page.PAGE_TITLE)

        # Chuyển sang tab Đã lưu (saved)
        library_page.switch_to_saved()
        assert "Đã lưu" in library_page.get_text(*library_page.PAGE_TITLE)

        # Chuyển sang tab Đã mở khóa (unlocked)
        library_page.switch_to_unlocked()
        assert "Đã mở khóa" in library_page.get_text(*library_page.PAGE_TITLE)

        # Chuyển lại tab Đã đăng (uploads)
        library_page.switch_to_uploads()
        assert "Tài liệu đã đăng" in library_page.get_text(*library_page.PAGE_TITLE)
