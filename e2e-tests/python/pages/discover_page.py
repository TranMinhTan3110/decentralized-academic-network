import time
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from pages.base_page import BasePage

class DiscoverPage(BasePage):
    PATH = "/explore"

    # Locators
    SEARCH_INPUT = (By.CSS_SELECTOR, "input[aria-label='Tìm theo tên tài liệu, môn học hoặc trường']")
    CLEAR_SEARCH_BTN = (By.CSS_SELECTOR, "button[aria-label='Xóa từ khóa']")
    DOCUMENT_CARDS = (By.CSS_SELECTOR, "a[href*='/detail/']")
    DOCUMENT_TITLES = (By.CSS_SELECTOR, "a[href*='/detail/'] h3, a[href*='/detail/'] .font-bold")
    LOADING_SPINNER = (By.CSS_SELECTOR, ".animate-spin")
    EMPTY_STATE = (By.XPATH, "//div[contains(., 'Không tìm thấy tài liệu') or contains(., 'Không có tài liệu')]")

    def load(self):
        self.navigate(self.PATH)
        self.wait_visible(*self.SEARCH_INPUT)
        return self

    def search_document(self, query: str):
        """Gửi từ khóa tìm kiếm (gọi GET /api/v1/documents/search?q=...)"""
        input_el = self.wait_visible(*self.SEARCH_INPUT)
        input_el.clear()
        input_el.send_keys(query)
        input_el.send_keys(Keys.ENTER)
        time.sleep(1.0) # Đợi debounce và fetch API hoàn tất

    def clear_search(self):
        clear_btns = self.find_elements(*self.CLEAR_SEARCH_BTN)
        if clear_btns:
            clear_btns[0].click()
            time.sleep(0.5)

    def get_document_cards(self) -> list:
        """Lấy danh sách các thẻ tài liệu đang hiển thị"""
        return self.find_elements(*self.DOCUMENT_CARDS)

    def get_first_document_title(self) -> str:
        titles = self.find_elements(*self.DOCUMENT_TITLES)
        if titles:
            return titles[0].text.strip()
        return ""

    def click_first_document(self):
        """Bấm vào tài liệu đầu tiên trong danh sách để mở trang Detail"""
        cards = self.find_elements(*self.DOCUMENT_CARDS)
        assert len(cards) > 0, "Không tìm thấy thẻ tài liệu nào để bấm vào."
        self.scroll_into_view(cards[0])
        cards[0].click()
        self.wait.until(EC.url_contains("/detail/"))
