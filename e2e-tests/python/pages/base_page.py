import time
from pathlib import Path
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, StaleElementReferenceException
from config import BASE_URL, DEFAULT_TIMEOUT, SCREENSHOTS_DIR

class BasePage:
    def __init__(self, driver: WebDriver):
        self.driver = driver
        self.base_url = BASE_URL.rstrip('/')
        self.wait = WebDriverWait(driver, DEFAULT_TIMEOUT)

    def navigate(self, path: str = ""):
        target = f"{self.base_url}{path}"
        self.driver.get(target)
        return self

    def inject_auth_token(self, token: str, user_json: str):
        """
        Nạp JWT Bearer token và thông tin currentUser vào localStorage của trình duyệt,
        sau đó tải lại trang để ứng dụng React nhận phiên đăng nhập.
        """
        # Trình duyệt cần phải ở đúng origin trước khi ghi vào localStorage
        if not self.driver.current_url.startswith(self.base_url):
            self.driver.get(self.base_url)

        script = """
        const [token, userJson] = arguments;
        if (token) {
            localStorage.setItem('accessToken', token);
        }
        if (userJson) {
            localStorage.setItem('currentUser', userJson);
        }
        """
        self.driver.execute_script(script, token, user_json)
        self.driver.refresh()
        time.sleep(0.5)

    def clear_auth_token(self):
        self.driver.execute_script("localStorage.removeItem('accessToken'); localStorage.removeItem('currentUser');")
        self.driver.refresh()

    def find_element(self, by, locator, timeout=DEFAULT_TIMEOUT) -> WebElement:
        return WebDriverWait(self.driver, timeout).until(
            EC.presence_of_element_located((by, locator))
        )

    def find_elements(self, by, locator, timeout=DEFAULT_TIMEOUT) -> list[WebElement]:
        try:
            return WebDriverWait(self.driver, timeout).until(
                EC.presence_of_all_elements_located((by, locator))
            )
        except TimeoutException:
            return []

    def wait_visible(self, by, locator, timeout=DEFAULT_TIMEOUT) -> WebElement:
        return WebDriverWait(self.driver, timeout).until(
            EC.visibility_of_element_located((by, locator))
        )

    def wait_clickable(self, by, locator, timeout=DEFAULT_TIMEOUT) -> WebElement:
        return WebDriverWait(self.driver, timeout).until(
            EC.element_to_be_clickable((by, locator))
        )

    def wait_invisible(self, by, locator, timeout=DEFAULT_TIMEOUT) -> bool:
        return WebDriverWait(self.driver, timeout).until(
            EC.invisibility_of_element_located((by, locator))
        )

    def click(self, by, locator, timeout=DEFAULT_TIMEOUT):
        el = self.wait_clickable(by, locator, timeout)
        self.scroll_into_view(el)
        el.click()

    def type_text(self, by, locator, text: str, clear_first: bool = True, timeout=DEFAULT_TIMEOUT):
        el = self.wait_visible(by, locator, timeout)
        if clear_first:
            el.clear()
        el.send_keys(text)

    def get_text(self, by, locator, timeout=DEFAULT_TIMEOUT) -> str:
        el = self.wait_visible(by, locator, timeout)
        return el.text.strip()

    def scroll_into_view(self, element: WebElement):
        self.driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", element)
        time.sleep(0.2)

    def take_screenshot(self, name: str) -> str:
        timestamp = int(time.time())
        filename = f"{name}_{timestamp}.png"
        filepath = SCREENSHOTS_DIR / filename
        self.driver.save_screenshot(str(filepath))
        return str(filepath)
