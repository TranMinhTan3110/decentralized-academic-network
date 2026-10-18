package com.network.e2e.tests;

import com.network.e2e.config.DriverFactory;
import com.network.e2e.db.DatabaseHelper;
import com.network.e2e.pages.HomePage;
import com.network.e2e.pages.RegisterPage;
import com.network.e2e.pages.VerifyOtpPage;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.WebDriver;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("01. Auth E2E - Kịch bản Đăng ký & Kích hoạt OTP")
public class Auth01RegisterE2ETest {

    private WebDriver driver;
    private RegisterPage registerPage;
    private VerifyOtpPage verifyOtpPage;
    private HomePage homePage;

    @BeforeEach
    void setUp() {
        driver = DriverFactory.createDriver();
        registerPage = new RegisterPage(driver);
        verifyOtpPage = new VerifyOtpPage(driver);
        homePage = new HomePage(driver);
    }

    @AfterEach
    void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    @DisplayName("Đăng ký tài khoản mới -> Tự động nhận OTP từ DB -> Xác thực thành công -> Vào Trang chủ")
    void shouldRegisterAndActivateViaOtpSuccessfully() throws InterruptedException {
        long timestamp = System.currentTimeMillis();
        String fullName = "Nguyen Van E2E";
        String username = "e2e_user_" + (timestamp % 100000);
        String email = "e2e_tester_" + timestamp + "@gmail.com";
        String password = "Password123@";

        // 1. Mở trang Đăng ký và điền form
        registerPage.open();
        registerPage.register(fullName, username, email, password);

        // 2. Chờ chuyển hướng sang trang Verify OTP
        boolean onOtpPage = registerPage.waitForUrlContains("/verify-otp");
        assertThat(onOtpPage)
                .as("Sau khi đăng ký thành công, trình duyệt phải chuyển hướng đến trang /verify-otp")
                .isTrue();

        // 3. Lấy mã OTP 6 số từ PostgreSQL database
        String otpCode = null;
        for (int i = 0; i < 10; i++) {
            otpCode = DatabaseHelper.getLatestOtpForEmail(email);
            if (otpCode != null && otpCode.length() == 6) {
                break;
            }
            Thread.sleep(500);
        }

        assertThat(otpCode)
                .as("Mã OTP phải được Backend tạo và lưu vào PostgreSQL cho email " + email)
                .isNotNull()
                .hasSize(6);

        // 4. Nhập mã OTP vào giao diện và bấm Xác nhận
        verifyOtpPage.verify(otpCode);

        // 5. Chờ chuyển hướng về Trang chủ và xác thực trạng thái đăng nhập
        boolean onHomePage = verifyOtpPage.waitForUrlContains("/");
        assertThat(onHomePage).isTrue();

        // 6. Kiểm tra góc trên Header đã đăng nhập thành công
        assertThat(homePage.isUserLoggedIn())
                .as("Nút Đăng xuất và Avatar tài khoản phải hiển thị ở Header")
                .isTrue();

        assertThat(homePage.getLoggedInUserName())
                .as("Tên hiển thị trên Header phải đúng với họ tên đăng ký")
                .contains(fullName);

        // Dọn dẹp tài khoản test
        DatabaseHelper.deleteTestUserByEmail(email);
    }
}
