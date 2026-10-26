import os
import sys
import socket
import pytest
from pathlib import Path
from urllib.parse import urlparse

# Thêm thư mục tests/e2e vào sys.path để các module import dễ dàng
CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.chrome.options import Options as ChromeOptions
from config import BASE_URL, ACCESS_TOKEN, CURRENT_USER_JSON, HEADLESS, SCREENSHOTS_DIR
from pages.base_page import BasePage

def is_server_listening(url: str, timeout=2.0) -> bool:
    """Kiểm tra nhanh xem Frontend server (localhost:5173) có đang mở port không"""
    try:
        parsed = urlparse(url)
        host = parsed.hostname or "localhost"
        port = parsed.port or (443 if parsed.scheme == "https" else 80)
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except (socket.timeout, ConnectionRefusedError, OSError):
        return False

def pytest_addoption(parser):
    parser.addoption(
        "--token",
        action="store",
        default=ACCESS_TOKEN,
        help="JWT Access Token để nạp vào trình duyệt"
    )
    parser.addoption(
        "--base-url",
        action="store",
        default=BASE_URL,
        help="Base URL của frontend web"
    )
    parser.addoption(
        "--headless-mode",
        action="store",
        default=str(HEADLESS).lower(),
        help="Chạy Chrome ở chế độ headless (true/false)"
    )

@pytest.fixture(scope="session")
def token(request):
    cli_token = request.config.getoption("--token")
    return cli_token or os.getenv("E2E_ACCESS_TOKEN", "")

@pytest.fixture(scope="session")
def target_base_url(request):
    url = request.config.getoption("--base-url") or BASE_URL
    print(f"\n[E2E Setup] Frontend URL mục tiêu: {url}")
    if not is_server_listening(url):
        print(f"\n⚠️  [CẢNH BÁO E2E] Không thể kết nối tới {url}!")
        print("    Vui lòng đảm bảo bạn ĐÃ CHẠY 'npm run dev' trong thư mục frontend.")
    return url

@pytest.fixture(scope="function")
def driver(request, target_base_url):
    headless_opt = request.config.getoption("--headless-mode").lower() in ("true", "1", "yes")

    print("\n[E2E] Đang khởi động trình duyệt Google Chrome...")
    options = ChromeOptions()
    if headless_opt:
        options.add_argument("--headless=new")
    options.add_argument("--window-size=1440,900")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-notifications")

    web_driver = None
    try:
        # Dùng trực tiếp Selenium Manager tích hợp sẵn trong Selenium 4 (nhanh tức thì, không bị lag mạng)
        web_driver = webdriver.Chrome(options=options)
    except Exception as e:
        print(f"[E2E Fallback] Sử dụng WebDriver Manager fallback do: {e}")
        try:
            from webdriver_manager.chrome import ChromeDriverManager
            service = ChromeService(ChromeDriverManager().install())
            web_driver = webdriver.Chrome(service=service, options=options)
        except Exception as err:
            pytest.fail(f"Không thể khởi động ChromeDriver: {err}")

    web_driver.implicitly_wait(2)
    print("[E2E] Trình duyệt Chrome đã sẵn sàng.")

    yield web_driver

    try:
        web_driver.quit()
    except Exception:
        pass

@pytest.fixture(scope="function")
def auth_driver(driver, token, target_base_url):
    """
    Fixture mở sẵn trình duyệt và nạp Token xác thực vào localStorage.
    """
    base_page = BasePage(driver)
    driver.get(target_base_url)

    if token:
        base_page.inject_auth_token(token, CURRENT_USER_JSON)
        print("[E2E Auth] Đã tiêm Access Token vào trình duyệt.")
    else:
        print("[E2E Auth] Chạy ở chế độ Guest (Chưa cung cấp Token).")

    return driver

@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Tự động chụp ảnh màn hình khi có test case bị FAIL"""
    outcome = yield
    report = outcome.get_result()

    if report.when == "call" and report.failed:
        driver = item.funcargs.get("driver") or item.funcargs.get("auth_driver")
        if driver:
            test_name = item.name
            screenshot_path = SCREENSHOTS_DIR / f"FAILURE_{test_name}.png"
            try:
                driver.save_screenshot(str(screenshot_path))
                print(f"\n[E2E Screenshot] Đã lưu ảnh lỗi tại: {screenshot_path}")
            except Exception:
                pass
