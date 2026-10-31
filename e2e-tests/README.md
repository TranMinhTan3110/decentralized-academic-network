# End-to-End (E2E) Selenium Tests

Bộ kiểm thử tự động toàn trình (End-to-End Testing) cho hệ thống **Decentralized Academic Network**.

## Cấu trúc tổng thể
Thư mục `e2e-tests/` tập trung toàn bộ các kịch bản kiểm thử E2E tự động hóa của hệ thống, bao gồm 2 bộ test chuyên biệt:

```
e2e-tests/
├── pom.xml, mvnw.cmd, .mvn/                 # Maven Wrapper và dependencies cho bộ Java
├── src/test/java/com/network/e2e/           # BỘ TEST 1: Java Selenium (User Service & Auth)
│   ├── config/                              # Cấu hình môi trường & DriverFactory
│   ├── db/                                  # DatabaseHelper (Tương tác PostgreSQL lấy OTP)
│   ├── pages/                               # Page Object Model (Register, VerifyOtp, Login, Home)
│   └── tests/                               # Test Cases: Auth01RegisterE2ETest, Auth01LoginE2ETest
│
└── python/                                  # BỘ TEST 2: Python Selenium (Document Service & UI)
    ├── config.py, conftest.py, reqs.txt     # Cấu hình môi trường, WebDriver fixtures, report
    ├── run_tests.bat, run_tests.sh          # Script chạy nhanh kiểm thử Python
    ├── test_data/                           # Dữ liệu kiểm thử mẫu (sample_academic.pdf)
    ├── pages/                               # POM: UploadPage, DetailPage, LibraryPage, DiscoverPage...
    └── scenarios/                           # 7 kịch bản: Taxonomy, Upload, Reader, Social, Library...
```

---

## 1. Bộ kiểm thử Auth (Java + Selenium + JUnit 5)

Kiểm thử toàn trình luồng Đăng ký tài khoản, tự động truy vấn OTP từ PostgreSQL, kích hoạt tài khoản, Đăng nhập và Đăng xuất.

### Chạy kiểm thử:
```powershell
cd e2e-tests

# Chạy toàn bộ test Auth (Headless)
.\mvnw.cmd test

# Chạy và xem trực tiếp trình duyệt
.\mvnw.cmd test -Dheadless=false

# Chạy riêng kịch bản Đăng ký & OTP
.\mvnw.cmd test -Dtest=Auth01RegisterE2ETest

# Chạy riêng kịch bản Đăng nhập
.\mvnw.cmd test -Dtest=Auth01LoginE2ETest
```

---

## 2. Bộ kiểm thử Document Service (Python + Selenium + Pytest)

Kiểm thử toàn trình tích hợp giữa React Frontend và `document-service` (Port 8082): Upload IPFS, duyệt cây phân loại môn học, xem chi tiết, DRM Reader, thả tim, bình luận, báo cáo vi phạm, danh sách likers, mở khóa tài liệu và thư viện cá nhân.

Chi tiết xem tại [`python/README.md`](file:///c:/Users/QUY/Documents/GitHub/decentralized-academic-network/e2e-tests/python/README.md).

### Chạy kiểm thử:
```powershell
cd e2e-tests\python

# Kích hoạt venv (nếu có)
venv\Scripts\activate

# Cài đặt thư viện phụ thuộc
pip install -r requirements.txt

# Chạy toàn bộ 7 kịch bản kèm báo cáo HTML
pytest scenarios/ -v -s --html=report.html --self-contained-html

# Hoặc nhấp đúp chạy nhanh trên Windows
.\run_tests.bat
```

