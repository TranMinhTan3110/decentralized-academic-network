import time
from selenium.webdriver.common.by import By
from pages.base_page import BasePage

class NotificationsPage(BasePage):
    # Locators
    BELL_BTN = (By.CSS_SELECTOR, "button[aria-label='Thông báo']")
    UNREAD_BADGE = (By.CSS_SELECTOR, "button[aria-label='Thông báo'] span")
    POPOVER_CONTAINER = (By.XPATH, "//div[contains(., 'Thông báo') and contains(@class, 'absolute right-0')]")
    MARK_ALL_READ_BTN = (By.XPATH, "//button[contains(., 'Đọc tất cả')]")
    NOTIFICATION_ITEMS = (By.XPATH, "//div[contains(@class, 'divide-y')]//div[contains(@class, 'p-')]")

    def open_popover(self):
        """Mở popover thông báo (kích hoạt GET /api/v1/notifications/me)"""
        self.click(*self.BELL_BTN)
        self.wait_visible(*self.POPOVER_CONTAINER)
        time.sleep(0.5)

    def get_unread_count(self) -> int:
        badges = self.find_elements(*self.UNREAD_BADGE, timeout=2)
        if badges:
            text = badges[0].text.strip().replace("+", "")
            return int(text) if text.isdigit() else 0
        return 0

    def mark_all_as_read(self):
        """Đánh dấu tất cả thông báo đã đọc (gọi PUT /api/v1/notifications/read-all)"""
        btns = self.find_elements(*self.MARK_ALL_READ_BTN, timeout=2)
        if btns:
            btns[0].click()
            time.sleep(0.5)

    def get_notification_items(self) -> list:
        return self.find_elements(*self.NOTIFICATION_ITEMS, timeout=2)
