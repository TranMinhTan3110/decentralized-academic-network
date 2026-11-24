import time
from pathlib import Path
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select, WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from pages.base_page import BasePage

class UploadPage(BasePage):
    PATH = "/upload"

    # Locators
    FILE_INPUT = (By.CSS_SELECTOR, "input[type='file']")
    TITLE_INPUT = (By.CSS_SELECTOR, "input[placeholder*='Đề cương ôn tập']")
    SCHOOL_INPUT = (By.ID, "school-input")
    SCHOOL_OPTIONS = (By.CSS_SELECTOR, "#university-suggestions option")
    SUBJECT_INPUT = (By.ID, "subject-input")
    SUBJECT_OPTIONS = (By.CSS_SELECTOR, "#course-suggestions option")
    KIND_SELECT = (By.CSS_SELECTOR, "select[aria-label='Loại tài liệu']")
    YEAR_INPUT = (By.ID, "year-input")
    POINTS_SELECT = (By.ID, "unlock-points")
    BLUR_LOCK_CHECKBOX = (By.ID, "blur-lock")
    RIGHTS_CHECKBOX = (By.ID, "rights")
    SUBMIT_VERIFY_BTN = (By.CSS_SELECTOR, "button.submit-upload")

    # Step 2: Summary & Publish to IPFS
    UPLOAD_RESULT = (By.CSS_SELECTOR, ".upload-result")
    PUBLISH_IPFS_BTN = (By.XPATH, "//div[contains(@class, 'upload-result')]//button[contains(., 'Đăng tài liệu') or contains(., 'Đồng ý')]")
    LOCAL_PDF_BTN = (By.XPATH, "//a[contains(text(), 'Mở PDF cục bộ')]")
    EDIT_INFO_BTN = (By.XPATH, "//button[contains(text(), 'Chỉnh sửa thông tin')]")

    def load(self):
        self.navigate(self.PATH)
        self.find_element(*self.FILE_INPUT)
        self.wait_visible(*self.TITLE_INPUT)
        return self

    def get_taxonomy_universities_count(self, timeout=10) -> int:
        """Kiểm tra số lượng trường đại học được load vào datalist từ Taxonomy API"""
        end_time = time.time() + timeout
        while time.time() < end_time:
            options = self.find_elements(*self.SCHOOL_OPTIONS)
            if len(options) > 0:
                return len(options)
            time.sleep(0.5)
        return len(self.find_elements(*self.SCHOOL_OPTIONS))

    def get_taxonomy_courses_count(self, timeout=10) -> int:
        """Kiểm tra số lượng môn học được load vào datalist từ Taxonomy API"""
        end_time = time.time() + timeout
        while time.time() < end_time:
            options = self.find_elements(*self.SUBJECT_OPTIONS)
            if len(options) > 0:
                return len(options)
            time.sleep(0.5)
        return len(self.find_elements(*self.SUBJECT_OPTIONS))

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
        year_inputs = self.find_elements(*self.YEAR_INPUT)
        if year_inputs:
            self.type_text(*self.YEAR_INPUT, year)
        else:
            year_selects = self.find_elements(By.XPATH, "//select[option[contains(text(), 'Chọn năm học')]]")
            if year_selects:
                Select(year_selects[0]).select_by_visible_text(year)

        # Checkbox cam kết bản quyền (nếu có)
        rights_els = self.find_elements(*self.RIGHTS_CHECKBOX)
        if rights_els and agree_rights:
            if not rights_els[0].is_selected():
                rights_els[0].click()

    def submit_and_verify(self):
        """Bước 1: Submit form để client kiểm tra chữ ký %PDF- và chuyển sang bước duyệt"""
        submit_btn = self.wait_clickable(*self.SUBMIT_VERIFY_BTN)
        self.scroll_into_view(submit_btn)
        self.driver.execute_script("arguments[0].click();", submit_btn)
        self.wait_visible(*self.UPLOAD_RESULT, timeout=20)
        self.wait_visible(*self.PUBLISH_IPFS_BTN, timeout=20)

    def publish_to_ipfs(self):
        """Bước 2: Bấm nút xuất bản lên IPFS (gọi POST /api/v1/documents/upload)"""
        # Nếu có hộp thoại xác nhận Watermark cá nhân, tích vào checkbox
        wm_boxes = self.find_elements(By.XPATH, "//div[contains(@class, 'upload-result')]//input[@type='checkbox']")
        if wm_boxes and not wm_boxes[0].is_selected():
            self.driver.execute_script("arguments[0].click();", wm_boxes[0])
            time.sleep(0.3)
        publish_btn = self.wait_clickable(*self.PUBLISH_IPFS_BTN, timeout=15)
        self.scroll_into_view(publish_btn)
        self.driver.execute_script("arguments[0].click();", publish_btn)

    def wait_for_detail_page_redirect(self, timeout=30) -> str:
        """Đợi frontend xử lý upload và chuyển hướng tới /detail/{id}"""
        WebDriverWait(self.driver, timeout).until(EC.url_contains("/detail/"))
        return self.driver.current_url
