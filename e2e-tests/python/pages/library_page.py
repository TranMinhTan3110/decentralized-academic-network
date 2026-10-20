import time
from selenium.webdriver.common.by import By
from pages.base_page import BasePage

class LibraryPage(BasePage):
    PAGE_TITLE = (By.CSS_SELECTOR, ".library-page h1, h1")
    TAB_UPLOADS = (By.XPATH, "//button[contains(., 'Đã đăng')]")
    TAB_SAVED = (By.XPATH, "//button[contains(., 'Đã lưu')]")
    TAB_UNLOCKED = (By.XPATH, "//button[contains(., 'Đã mở khóa')]")
    TAB_HISTORY = (By.XPATH, "//button[contains(., 'Đã xem')]")
    DOCUMENT_CARDS = (By.CSS_SELECTOR, "article.feed-card")
    EMPTY_STATE = (By.XPATH, "//div[contains(., 'Bạn chưa') or contains(., 'Một chỗ trống')]")

    def load(self, tab: str = ""):
        endpoint = f"/library?tab={tab}" if tab else "/library"
        self.navigate(endpoint)
        self.wait_visible(*self.PAGE_TITLE)
        time.sleep(0.5)
        return self

    def switch_to_saved(self):
        self.click(*self.TAB_SAVED)
        time.sleep(0.8)

    def switch_to_unlocked(self):
        self.click(*self.TAB_UNLOCKED)
        time.sleep(0.8)

    def switch_to_uploads(self):
        self.click(*self.TAB_UPLOADS)
        time.sleep(0.8)

    def switch_to_history(self):
        self.click(*self.TAB_HISTORY)
        time.sleep(0.8)

    def get_document_cards(self):
        return self.find_elements(*self.DOCUMENT_CARDS, timeout=2)

    def is_empty_state_present(self) -> bool:
        elements = self.find_elements(*self.EMPTY_STATE, timeout=2)
        return len(elements) > 0
