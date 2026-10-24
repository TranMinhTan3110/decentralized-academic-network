import re
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from pages.base_page import BasePage

class DetailPage(BasePage):
    # Locators
    TITLE = (By.CSS_SELECTOR, ".detail-heading h1, h1")
    SCHOOL_INFO = (By.CSS_SELECTOR, ".detail-heading p")
    AUTHOR_NAME = (By.CSS_SELECTOR, "a[href*='/ho-so/']")

    # Social Interactions
    LIKE_BTN = (By.XPATH, "//button[contains(., 'Thích')]")
    VIEW_LIKERS_BTN = (By.CSS_SELECTOR, "button[data-testid='view-likers-btn']")
    LIKERS_MODAL = (By.CSS_SELECTOR, "div[data-testid='likers-modal']")
    BOOKMARK_BTN = (By.CSS_SELECTOR, "button[aria-label*='tài liệu']")
    COMMENT_BTN_SCROLL = (By.XPATH, "//button[contains(., 'Bình luận') and not(@type='submit')]")
    REPORT_BTN = (By.CSS_SELECTOR, "button[data-testid='report-document-btn']")

    # Comments Section
    COMMENT_INPUT = (By.CSS_SELECTOR, "textarea[placeholder*='Viết bình luận']")
    COMMENT_SUBMIT_BTN = (By.XPATH, "//button[contains(text(), 'Gửi bình luận')]")
    COMMENT_ITEMS = (By.XPATH, "//div[contains(@class, 'max-h-[240px]')]//div[contains(@class, 'flex gap-2.5')]")
    DELETE_COMMENT_BTN = (By.CSS_SELECTOR, "button[data-testid='delete-comment-btn']")

    # Author Actions
    EDIT_DOC_BTN = (By.CSS_SELECTOR, "button[data-testid='edit-document-btn']")
    DELETE_DOC_BTN = (By.CSS_SELECTOR, "button[data-testid='delete-document-btn']")
    EDIT_DOC_MODAL = (By.CSS_SELECTOR, "div[data-testid='edit-document-modal']")
    EDIT_TITLE_INPUT = (By.CSS_SELECTOR, "input[data-testid='edit-title-input']")
    EDIT_SUBMIT_BTN = (By.CSS_SELECTOR, "button[data-testid='edit-submit-btn']")

    # Report Modal
    REPORT_MODAL = (By.CSS_SELECTOR, "div[data-testid='report-modal']")
    REPORT_REASON_SELECT = (By.CSS_SELECTOR, "select[data-testid='report-reason-select']")
    REPORT_DESC_INPUT = (By.CSS_SELECTOR, "textarea[data-testid='report-description-input']")
    REPORT_SUBMIT_BTN = (By.CSS_SELECTOR, "button[data-testid='report-submit-btn']")

    # Document Reader & Pagination
    NEXT_PAGE_BTN = (By.XPATH, "//button[contains(., 'Tiếp')]")
    PREV_PAGE_BTN = (By.XPATH, "//button[contains(., 'Trước')]")
    PAGE_INDICATOR = (By.XPATH, "//span[contains(text(), 'Trang ') and contains(text(), '/')]")
    DRM_LOCK_OVERLAY = (By.XPATH, "//h3[contains(text(), 'Trang nội dung đã bị khóa')]")
    UNLOCK_CTA_BTN = (By.XPATH, "//button[contains(., 'Mở khóa với')]")

    # Unlock Modal
    MODAL_CONFIRM_UNLOCK_BTN = (By.XPATH, "//button[contains(., 'Xác nhận mở khóa')]")

    def load_by_id(self, doc_id: str):
        self.navigate(f"/detail/{doc_id}")
        self.wait_visible(*self.TITLE)
        return self

    def get_document_title(self) -> str:
        return self.get_text(*self.TITLE)

    def get_likes_count(self) -> int:
        btn_text = self.get_text(*self.LIKE_BTN)
        match = re.search(r'\(([\d.]+)([Kk]?)\)', btn_text)
        if match:
            num = float(match.group(1))
            if match.group(2).upper() == 'K':
                return int(num * 1000)
            return int(num)
        return 0

    def click_like(self):
        """Bấm thả tim hoặc bỏ tim (gọi POST /api/v1/documents/{id}/like)"""
        self.click(*self.LIKE_BTN)
        time.sleep(0.5)

    def is_bookmarked(self) -> bool:
        btn = self.find_element(*self.BOOKMARK_BTN)
        label = btn.get_attribute("aria-label") or ""
        return "Đã lưu" in label or "Đã lưu" in btn.text

    def click_bookmark(self):
        """Bấm lưu / bỏ lưu bookmark (gọi POST/DELETE /api/v1/documents/{id}/bookmark)"""
        self.click(*self.BOOKMARK_BTN)
        time.sleep(0.5)

    def add_comment(self, content: str):
        """Gửi bình luận mới vào tài liệu (gọi POST /api/v1/documents/{id}/comments)"""
        self.type_text(*self.COMMENT_INPUT, content)
        self.click(*self.COMMENT_SUBMIT_BTN)
        time.sleep(0.8) # Chờ phản hồi API và render bình luận mới

    def get_comments_count(self) -> int:
        items = self.find_elements(*self.COMMENT_ITEMS, timeout=3)
        return len(items)

    def navigate_next_page(self):
        """Chuyển sang trang tiếp theo trong reader preview"""
        self.click(*self.NEXT_PAGE_BTN)
        time.sleep(0.3)

    def is_drm_locked(self) -> bool:
        """Kiểm tra xem trang hiện tại có bị khóa DRM hay không"""
        overlays = self.find_elements(*self.DRM_LOCK_OVERLAY, timeout=2)
        return len(overlays) > 0

    def unlock_document(self):
        """Mở modal và xác nhận mở khóa tài liệu (gọi POST /api/v1/documents/{id}/unlock)"""
        self.click(*self.UNLOCK_CTA_BTN)
        self.wait_visible(*self.MODAL_CONFIRM_UNLOCK_BTN)
        self.click(*self.MODAL_CONFIRM_UNLOCK_BTN)
        time.sleep(1.0)

    def open_report_modal(self):
        """Mở modal báo cáo vi phạm"""
        self.click(*self.REPORT_BTN)
        self.wait_visible(*self.REPORT_MODAL)

    def submit_report(self, reason: str = "Nội dung sai lệch hoặc Spam", description: str = "Tài liệu spam"):
        """Gửi báo cáo vi phạm tài liệu (gọi POST /api/v1/documents/{id}/report)"""
        self.open_report_modal()
        select_elem = self.find_element(*self.REPORT_REASON_SELECT)
        from selenium.webdriver.support.ui import Select
        Select(select_elem).select_by_visible_text(reason)
        if description:
            self.type_text(*self.REPORT_DESC_INPUT, description)
        self.click(*self.REPORT_SUBMIT_BTN)
        time.sleep(1.0)

    def open_likers_modal(self):
        """Mở modal danh sách người đã thích (gọi GET /api/v1/documents/{id}/likes)"""
        self.click(*self.VIEW_LIKERS_BTN)
        self.wait_visible(*self.LIKERS_MODAL)

    def is_likers_modal_open(self) -> bool:
        elements = self.find_elements(*self.LIKERS_MODAL, timeout=2)
        return len(elements) > 0

    def delete_own_comment(self):
        """Xóa bình luận của chính mình (gọi DELETE /api/v1/documents/comments/{commentId})"""
        self.click(*self.DELETE_COMMENT_BTN)
        time.sleep(1.0)

    def has_delete_comment_button(self) -> bool:
        elements = self.find_elements(*self.DELETE_COMMENT_BTN, timeout=2)
        return len(elements) > 0

    def open_edit_modal(self):
        """Mở modal chỉnh sửa tài liệu của tác giả (gọi PUT /api/v1/documents/{id})"""
        self.click(*self.EDIT_DOC_BTN)
        self.wait_visible(*self.EDIT_DOC_MODAL)

    def submit_edit_document(self, new_title: str):
        """Chỉnh sửa và lưu thông tin tài liệu"""
        self.open_edit_modal()
        self.clear_and_type(*self.EDIT_TITLE_INPUT, new_title)
        self.click(*self.EDIT_SUBMIT_BTN)
        time.sleep(1.0)

    def clear_and_type(self, by: By, value: str, text: str):
        elem = self.find_element(by, value)
        elem.clear()
        elem.send_keys(text)

    def delete_document(self):
        """Xóa tài liệu (gọi DELETE /api/v1/documents/{id})"""
        self.click(*self.DELETE_DOC_BTN)
        time.sleep(0.5)
        # Chấp nhận window.confirm
        alert = self.driver.switch_to.alert
        alert.accept()
        time.sleep(1.0)
