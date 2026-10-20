import time
import pytest
from pages.discover_page import DiscoverPage
from pages.detail_page import DetailPage

class TestSocialInteractions:
    """
    Kịch bản kiểm thử các tương tác xã hội (Social APIs):
    1. API Like (/api/v1/documents/{id}/like): Thả tim và bỏ tim với Optimistic UI.
    2. API Bookmark (/api/v1/documents/{id}/bookmark): Lưu và bỏ lưu tài liệu vào bộ sưu tập.
    3. API Comments (/api/v1/documents/{id}/comments): Đăng bình luận mới và hiển thị danh sách.
    """

    def test_toggle_like_document(self, auth_driver):
        """Kiểm tra chức năng thả tim cập nhật số lượng like tức thì trên giao diện"""
        discover_page = DiscoverPage(auth_driver)
        discover_page.load()

        cards = discover_page.get_document_cards()
        if not cards:
            pytest.skip("Chưa có tài liệu để kiểm tra thả tim.")

        discover_page.click_first_document()
        detail_page = DetailPage(auth_driver)

        initial_likes = detail_page.get_likes_count()

        # Bấm Thích
        detail_page.click_like()
        time.sleep(0.5)
        new_likes = detail_page.get_likes_count()

        assert new_likes == initial_likes + 1, f"Số like không tăng sau khi bấm thích (Ban đầu: {initial_likes}, Hiện tại: {new_likes})"

        # Bấm Bỏ thích
        detail_page.click_like()
        time.sleep(0.5)
        final_likes = detail_page.get_likes_count()

        assert final_likes == initial_likes, f"Số like không giảm về ban đầu sau khi bỏ thích (Ban đầu: {initial_likes}, Hiện tại: {final_likes})"

    def test_toggle_bookmark_document(self, auth_driver):
        """Kiểm tra chức năng lưu/bỏ lưu tài liệu vào thư viện cá nhân"""
        discover_page = DiscoverPage(auth_driver)
        discover_page.load()

        cards = discover_page.get_document_cards()
        if not cards:
            pytest.skip("Chưa có tài liệu để kiểm tra bookmark.")

        discover_page.click_first_document()
        detail_page = DetailPage(auth_driver)

        initial_state = detail_page.is_bookmarked()

        # Bấm đổi trạng thái bookmark
        detail_page.click_bookmark()
        time.sleep(0.5)
        assert detail_page.is_bookmarked() != initial_state, "Trạng thái nút bookmark không thay đổi sau khi bấm."

        # Bấm lại để trả về trạng thái cũ
        detail_page.click_bookmark()
        time.sleep(0.5)
        assert detail_page.is_bookmarked() == initial_state, "Trạng thái bookmark không hoàn nguyên."

    def test_add_comment_to_document(self, auth_driver):
        """Kiểm tra chức năng gửi bình luận mới vào tài liệu"""
        discover_page = DiscoverPage(auth_driver)
        discover_page.load()

        cards = discover_page.get_document_cards()
        if not cards:
            pytest.skip("Chưa có tài liệu để kiểm tra bình luận.")

        discover_page.click_first_document()
        detail_page = DetailPage(auth_driver)

        initial_comments_count = detail_page.get_comments_count()
        comment_text = f"Tài liệu rất hữu ích và chi tiết! (E2E Test {int(time.time())})"

        detail_page.add_comment(comment_text)

        new_comments_count = detail_page.get_comments_count()
        assert new_comments_count >= initial_comments_count + 1, "Số lượng bình luận không tăng sau khi gửi bình luận mới."
