import time
from pathlib import Path
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from selenium.webdriver.support import expected_conditions as EC
from pages.base_page import BasePage

class UploadPage(BasePage):
    PATH = "/upload"

    # Locators
    FILE_INPUT = (By.CSS_SELECTOR, "input[type='file']")
    TITLE_INPUT = (By.CSS_SELECTOR, "input[placeholder*='Đề cương ôn tập']")
    SCHOOL_INPUT = (By.CSS_SELECTOR, "input[list='schools-list']")
    SCHOOL_OPTIONS = (By.CSS_SELECTOR, "#schools-list option")
    SUBJECT_INPUT = (By.CSS_SELECTOR, "input[list='subjects-list']")
    SUBJECT_OPTIONS = (By.CSS_SELECTOR, "#subjects-list option")
    KIND_SELECT = (By.XPATH, "//select[option[contains(text(), 'Chọn loại tài liệu')]]")
    YEAR_SELECT = (By.XPATH, "//select[option[contains(text(), 'Chọn năm học')]]")
    POINTS_SELECT = (By.XPATH, "//select[option[contains(text(), 'điểm')]]")
    BLUR_LOCK_CHECKBOX = (By.ID, "blur-lock")
    RIGHTS_CHECKBOX = (By.ID, "rights")
    SUBMIT_VERIFY_BTN = (By.CSS_SELECTOR, "button.submit-upload")

    # Step 2: Summary & Publish to IPFS
    PUBLISH_IPFS_BTN = (By.XPATH, "//button[contains(., 'Xuất bản lên Mạng lưới') or contains(., 'IPFS')]")
    LOCAL_PDF_BTN = (By.XPATH, "//a[contains(text(), 'Mở PDF cục bộ')]")
    EDIT_INFO_BTN = (By.XPATH, "//button[contains(text(), 'Chỉnh sửa thông tin')]")

    def load(self):
        self.navigate(self.PATH)
        self.find_element(*self.FILE_INPUT)
        self.wait_visible(*self.TITLE_INPUT)
        return self

    def get_taxonomy_universities_count(self) -> int:
        """Kiểm tra số lượng trường đại học được load vào datalist từ Taxonomy API"""
        options = self.find_elements(*self.SCHOOL_OPTIONS)
        return len(options)

    def get_taxonomy_courses_count(self) -> int:
        """Kiểm tra số lượng môn học được load vào datalist từ Taxonomy API"""
        options = self.find_elements(*self.SUBJECT_OPTIONS)
        return len(options)

    def select_file(self, file_path: Path):
        file_input = self.find_element(*self.FILE_INPUT)
        file_input.send_keys(str(file_path.resolve()))
        time.sleep(0.5)

    def fill_metadata(
        self,
        title: str,
        school: str,
        subject: str,
        kind: str = "Đề thi & Đáp án",
        year: str = "2026",
        agree_rights: bool = True
    ):
        self.type_text(*self.TITLE_INPUT, title)
        self.type_text(*self.SCHOOL_INPUT, school)
        self.type_text(*self.SUBJECT_INPUT, subject)

        # Chọn loại tài liệu
        kind_el = self.find_element(*self.KIND_SELECT)
        try:
            Select(kind_el).select_by_visible_text(kind)
        except Exception:
            matched = False
            for opt in Select(kind_el).options:
                if "Đề thi" in opt.text or kind in opt.text:
                    Select(kind_el).select_by_visible_text(opt.text)
                    matched = True
                    break
            if not matched and len(Select(kind_el).options) > 1:
                Select(kind_el).select_by_index(1)

        # Chọn năm học
        year_el = self.find_element(*self.YEAR_SELECT)
        Select(year_el).select_by_visible_text(year)

        # Checkbox cam kết bản quyền
        if agree_rights:
            rights_el = self.find_element(*self.RIGHTS_CHECKBOX)
            if not rights_el.is_selected():
                self.click(*self.RIGHTS_CHECKBOX)

    def submit_and_verify(self):
        """Bước 1: Submit form để client kiểm tra chữ ký %PDF- và chuyển sang bước duyệt"""
        self.click(*self.SUBMIT_VERIFY_BTN)
        self.wait_visible(*self.PUBLISH_IPFS_BTN, timeout=10)

    def publish_to_ipfs(self):
        """Bước 2: Bấm nút xuất bản lên IPFS (gọi POST /api/v1/documents/upload)"""
        self.click(*self.PUBLISH_IPFS_BTN)

    def wait_for_detail_page_redirect(self, timeout=20) -> str:
        """Đợi frontend xử lý upload và chuyển hướng tới /detail/{id}"""
        self.wait.until(EC.url_contains("/detail/"))
        return self.driver.current_url
