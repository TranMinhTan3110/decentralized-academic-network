# End-to-End (E2E) Selenium Tests

Bộ kiểm thử tự động toàn trình (End-to-End Testing) cho hệ thống **Decentralized Academic Network**.

## Công nghệ sử dụng
- **Ngôn ngữ:** Java 21
- **Công cụ kiểm thử:** Selenium WebDriver 4.25 + WebDriverManager
- **Test Runner:** JUnit 5 (Jupiter) + AssertJ
- **Mô hình thiết kế:** Page Object Model (POM)
- **Cơ sở dữ liệu:** PostgreSQL JDBC (tự động truy vấn OTP để kích hoạt tài khoản trong kịch bản test)

## Cấu trúc thư mục
```
e2e-tests/
├── pom.xml                                  # File cấu hình Maven và dependencies
├── mvnw / mvnw.cmd / .mvn/                  # Maven Wrapper (chạy ngay không cần cài Maven)
└── src/test/java/com/network/e2e/
    ├── config/
    │   ├── TestConfig.java                  # Cấu hình biến môi trường (Base URL, headless, DB)
    │   └── DriverFactory.java               # Khởi tạo và cấu hình ChromeDriver
    ├── db/
    │   └── DatabaseHelper.java              # Tương tác PostgreSQL lấy OTP kích hoạt tự động
    ├── pages/                               # Page Object Model
    │   ├── BasePage.java                    # Base Page với WebDriverWait và JavaScript click fallback
    │   ├── RegisterPage.java                # Tương tác form Đăng ký tài khoản
    │   ├── VerifyOtpPage.java               # Tương tác 6 ô nhập mã OTP và xác nhận
    │   ├── LoginPage.java                   # Tương tác form Đăng nhập
    │   └── HomePage.java                    # Kiểm tra Header, avatar, tên người dùng, logout
    └── tests/
        ├── Auth01RegisterE2ETest.java       # Kịch bản: Đăng ký -> Nhận OTP từ DB -> Verify -> Vào Trang chủ
        └── Auth01LoginE2ETest.java          # Kịch bản: Đăng nhập thành công, đăng xuất, sai mật khẩu
```

## Hướng dẫn chạy Test

### Điều kiện tiên quyết
1. Docker PostgreSQL đang chạy (Port 5432).
2. Backend `user-service` đang chạy (Port 8081).
3. Frontend đang chạy (Port 5173).

### Chạy toàn bộ bộ test E2E (Mặc định chạy Headless)
```powershell
cd e2e-tests
.\mvnw.cmd test
```

### Chạy và xem trực tiếp trình duyệt Chrome thao tác trên màn hình
```powershell
cd e2e-tests
.\mvnw.cmd test -Dheadless=false
```

### Chạy riêng từng kịch bản
```powershell
# Chạy riêng kịch bản Đăng ký & OTP
.\mvnw.cmd test -Dtest=Auth01RegisterE2ETest

# Chạy riêng kịch bản Đăng nhập & Đăng xuất
.\mvnw.cmd test -Dtest=Auth01LoginE2ETest
```
