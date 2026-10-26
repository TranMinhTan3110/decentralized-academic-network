import time
import pytest
from pages.discover_page import DiscoverPage
from pages.notifications_page import NotificationsPage

class TestNotifications:
    """
    Kịch bản kiểm thử API Thông báo (Notification APIs):
    1. GET /api/v1/notifications/unread-count: Tải số lượng thông báo chưa đọc lên biểu tượng chuông.
    2. GET /api/v1/notifications/me: Mở danh sách thông báo người dùng.
    3. PUT /api/v1/notifications/read-all: Đánh dấu tất cả thông báo là đã đọc.
    """

    def test_open_notification_popover(self, auth_driver):
        """Kiểm tra mở popover thông báo từ thanh điều hướng Header"""
        discover_page = DiscoverPage(auth_driver)
        discover_page.load()

        notifications_page = NotificationsPage(auth_driver)
        notifications_page.open_popover()

        # Kiểm tra popover container hiển thị
        assert notifications_page.find_element(*notifications_page.POPOVER_CONTAINER).is_displayed(), \
            "Popover thông báo không hiển thị sau khi bấm vào biểu tượng chuông."

    def test_mark_all_notifications_as_read(self, auth_driver):
        """Kiểm tra chức năng đánh dấu tất cả thông báo là đã đọc"""
        discover_page = DiscoverPage(auth_driver)
        discover_page.load()

        notifications_page = NotificationsPage(auth_driver)
        notifications_page.open_popover()

        # Nếu có nút 'Đọc tất cả', bấm thử và kiểm tra badge unread chuyển về 0
        mark_all_btns = notifications_page.find_elements(*notifications_page.MARK_ALL_READ_BTN, timeout=2)
        if mark_all_btns:
            notifications_page.mark_all_as_read()
            time.sleep(1.0)
            unread_count = notifications_page.get_unread_count()
            assert unread_count == 0, f"Số thông báo chưa đọc chưa về 0 sau khi bấm Đọc tất cả. Còn lại: {unread_count}"
