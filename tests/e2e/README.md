# Hướng Dẫn Chạy Bộ Kiểm Thử E2E Selenium (Tích hợp Document-Service & Frontend)

Bộ kiểm thử End-to-End (E2E) tự động hóa bằng **Python + Selenium + Pytest**, được thiết kế theo mô hình **Page Object Model (POM)** nhằm kiểm chứng sự tích hợp hoàn chỉnh giữa giao diện React Vite với các RESTful APIs của `document-service` (Port 8082).

---

## 1. Cấu Trúc Thư Mục Kiểm Thử

```
tests/e2e/
├── config.py                 # Cấu hình BASE_URL, API_URL, timeouts, thông tin người dùng
├── conftest.py               # Fixture Pytest: Quản lý WebDriver, nạp Token tự động, chụp ảnh khi fail
├── requirements.txt          # Thư viện: selenium, pytest, webdriver-manager, pytest-html
├── run_tests.bat             # Script chạy kiểm thử nhanh trên Windows
├── run_tests.sh              # Script chạy kiểm thử trên Linux / macOS / Git Bash
├── test_data/
│   └── sample_academic.pdf   # File mẫu PDF hợp lệ (có chữ ký %PDF-) phục vụ upload
├── pages/                    # Tầng Page Object Model (Đóng gói thao tác UI và Selectors)
│   ├── base_page.py          # Thao tác nền tảng (nạp token localStorage, click, wait, scroll)
│   ├── upload_page.py        # Thao tác trên trang /upload (Form, Taxonomy, IPFS publish)
│   ├── discover_page.py      # Thao tác trên trang /explore (Feed, Search toàn văn, Lọc)
│   ├── detail_page.py        # Thao tác trên trang /detail/:id (Like, Comment, Bookmark, Reader, DRM)
│   └── notifications_page.py # Thao tác với Popover thông báo trên Header
└── scenarios/                # Tầng Kịch bản kiểm thử (Test Cases)
    ├── test_01_upload_and_taxonomy.py    # Kiểm thử API Taxonomy & Tải tài liệu lên IPFS
    ├── test_02_feed_and_search.py        # Kiểm thử API Feed & Tìm kiếm toàn văn
    ├── test_03_detail_and_reader.py      # Kiểm thử API Detail, View tracking & Trình đọc PDF/DRM
    ├── test_04_social_interactions.py    # Kiểm thử API Thả tim (Like), Bình luận & Bookmark
    ├── test_05_notifications.py          # Kiểm thử API Thông báo người dùng (Unread count, Popover)
    └── test_06_full_lifecycle.py         # Kịch bản xuyên suốt: Upload -> Chi tiết -> Thả tim -> Bình luận -> Bookmark -> Tìm kiếm lại
```

---

## 2. Chuẩn Bị & Cài Đặt Thư Viện

Yêu cầu máy đã cài **Python 3.10+** và trình duyệt **Google Chrome**.

Mở terminal tại thư mục `tests/e2e/`:

```bash
# 1. Tạo môi trường ảo (khuyến nghị)
python -m venv venv

# Kích hoạt trên Windows:
venv\Scripts\activate
# Hoặc trên Linux/macOS:
source venv/bin/activate

# 2. Cài đặt các thư viện cần thiết
pip install -r requirements.txt
```

---

## 3. Cách Lấy và Nạp Token Xác Thực

Do các chức năng như **Upload tài liệu**, **Thả tim**, **Bình luận**, **Bookmark** yêu cầu đăng nhập, Selenium sẽ tự động tiêm JWT Token vào `localStorage` của trình duyệt.

### Bước 1: Lấy Token từ trình duyệt
1. Mở trình duyệt web của bạn và truy cập `http://localhost:5173`.
2. Đăng nhập vào tài khoản người dùng bình thường.
3. Nhấn **F12** $\rightarrow$ chuyển sang tab **Console**.
4. Chạy dòng lệnh sau:
   ```javascript
   copy(localStorage.getItem('accessToken'))
   ```
   *(Token đã được tự động copy vào bộ nhớ tạm của bạn)*.

### Bước 2: Nạp Token vào bộ kiểm thử (Chọn 1 trong 3 cách sau)

- **Cách 1 (Khuyến nghị): Thiết lập biến môi trường trong file `.env`**  
  Tạo file `.env` ngay trong thư mục `tests/e2e/` với nội dung:
  ```ini
  E2E_ACCESS_TOKEN=eyJhbGciOiJIUzI1NiIs...
  E2E_BASE_URL=http://localhost:5173
  E2E_API_URL=http://localhost:8082
  E2E_HEADLESS=false
  ```

- **Cách 2: Truyền trực tiếp qua tham số dòng lệnh khi chạy pytest**  
  ```bash
  pytest scenarios/ --token="eyJhbGciOiJIUzI1NiIs..."
  ```

- **Cách 3: Điền trực tiếp vào file `config.py`**  
  Mở file `tests/e2e/config.py` và gán chuỗi token vào biến `ACCESS_TOKEN`:
  ```python
  ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIs..."
  ```

---

## 4. Chạy Kiểm Thử

### Cách 1: Sử dụng file chạy nhanh (Windows)
Chỉ cần nhấp đúp vào file `run_tests.bat` hoặc chạy trong PowerShell / CMD:
```cmd
run_tests.bat
```

### Cách 2: Chạy toàn bộ test suite bằng lệnh `pytest`
```bash
pytest scenarios/ -v -s --html=report.html --self-contained-html
```

### Cách 3: Chạy từng kịch bản riêng lẻ

- **Chạy kịch bản Upload & Taxonomy API:**
  ```bash
  pytest scenarios/test_01_upload_and_taxonomy.py -v -s
  ```

- **Chạy kịch bản Khám phá & Tìm kiếm (Feed & Search API):**
  ```bash
  pytest scenarios/test_02_feed_and_search.py -v -s
  ```

- **Chạy kịch bản Xem chi tiết & Reader PDF/DRM:**
  ```bash
  pytest scenarios/test_03_detail_and_reader.py -v -s
  ```

- **Chạy kịch bản Tương tác xã hội (Like, Comment, Bookmark):**
  ```bash
  pytest scenarios/test_04_social_interactions.py -v -s
  ```

- **Chạy kịch bản Thông báo (Notifications):**
  ```bash
  pytest scenarios/test_05_notifications.py -v -s
  ```

- **Chạy kịch bản Vòng đời toàn diện (Full Lifecycle):**
  ```bash
  pytest scenarios/test_06_full_lifecycle.py -v -s
  ```

### Chạy ở chế độ chạy ngầm (Headless Mode):
Thêm cờ `--headless-mode=true` để chạy kiểm thử ngầm không hiện cửa sổ trình duyệt:
```bash
pytest scenarios/ --headless-mode=true
```

---

## 5. Báo Cáo Kiểm Thử & Chụp Ảnh Khi Lỗi

1. **Báo cáo trực quan HTML**: Sau mỗi lần chạy kiểm thử với cờ `--html=report.html`, file báo cáo `report.html` sẽ được tạo ra tại thư mục `tests/e2e/`. Bạn có thể mở file này trên bất kỳ trình duyệt nào để xem thời gian thực thi, log chi tiết và tỉ lệ pass/fail.
2. **Tự động chụp ảnh màn hình khi có lỗi**: Khi có bất kỳ assertion nào bị fail hoặc element bị timeout, fixture `pytest_runtest_makereport` trong `conftest.py` sẽ tự động chụp ảnh màn hình và lưu vào thư mục `tests/e2e/screenshots/FAILURE_<tên_test>.png`.
