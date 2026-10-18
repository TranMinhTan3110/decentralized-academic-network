package com.network.e2e.tests;

import com.network.e2e.config.DriverFactory;
import com.network.e2e.db.DatabaseHelper;
import com.network.e2e.pages.HomePage;
import com.network.e2e.pages.LoginPage;
import com.network.e2e.pages.RegisterPage;
import com.network.e2e.pages.VerifyOtpPage;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.WebDriver;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("01. Auth E2E - Kịch bản Đăng nhập & Đăng xuất")
public class Auth01LoginE2ETest {

    private WebDriver driver;
    private LoginPage loginPage;
    private HomePage homePage;

    private String testEmail;
    private String testPassword;
    private String testFullName;

    @BeforeEach
    void setUp() throws InterruptedException {
        driver = DriverFactory.createDriver();
        loginPage = new LoginPage(driver);
        homePage = new HomePage(driver);

        // Chuẩn bị một tài khoản đã kích hoạt sẵn cho bài test Đăng nhập
        long timestamp = System.currentTimeMillis();
        testFullName = "Tran Van Login";
        String username = "login_user_" + (timestamp % 100000);
        testEmail = "login_tester_" + timestamp + "@gmail.com";
        testPassword = "Password123@";

        RegisterPage registerPage = new RegisterPage(driver);
        registerPage.open();
        registerPage.register(testFullName, username, testEmail, testPassword);
        registerPage.waitForUrlContains("/verify-otp");

        String otp = null;
        for (int i = 0; i < 10; i++) {
            otp = DatabaseHelper.getLatestOtpForEmail(testEmail);
            if (otp != null && otp.length() == 6) break;
            Thread.sleep(500);
        }

        if (otp != null) {
            VerifyOtpPage verifyOtpPage = new VerifyOtpPage(driver);
            verifyOtpPage.verify(otp);
            verifyOtpPage.waitForUrlContains("/");
        }

        // Đăng xuất để chuẩn bị cho các ca kiểm thử đăng nhập
        if (homePage.isUserLoggedIn()) {
            homePage.logout();
        }
    }

    @AfterEach
    void tearDown() {
        if (testEmail != null) {
            DatabaseHelper.deleteTestUserByEmail(testEmail);
        }
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    @DisplayName("Đăng nhập thành công với thông tin chính xác -> Hiển thị thông tin ở Header -> Đăng xuất thành công")
    void shouldLoginAndLogoutSuccessfully() {
        loginPage.open();
        loginPage.login(testEmail, testPassword);

        // Chờ chuyển về Trang chủ
        boolean onHomePage = loginPage.waitForUrlContains("/");
        assertThat(onHomePage).isTrue();

        // Kiểm tra phiên đăng nhập trên Header
        assertThat(homePage.isUserLoggedIn())
                .as("Sau khi đăng nhập thành công, Header phải hiển thị avatar và nút đăng xuất")
                .isTrue();

        assertThat(homePage.getLoggedInUserName())
                .contains(testFullName);

        // Thao tác Đăng xuất
        homePage.logout();
        assertThat(homePage.isLoginLinkVisible())
                .as("Sau khi bấm Đăng xuất, Header phải xuất hiện lại nút Đăng nhập")
                .isTrue();
    }

    @Test
    @DisplayName("Đăng nhập thất bại khi nhập sai mật khẩu -> Vẫn ở trang login")
    void shouldFailLoginWithIncorrectPassword() {
        loginPage.open();
        loginPage.login(testEmail, "WrongPassword999@");

        // Không được phép chuyển về trang chủ
        assertThat(homePage.isUserLoggedIn())
                .as("Không được phép đăng nhập khi mật khẩu sai")
                .isFalse();

        assertThat(driver.getCurrentUrl())
                .as("Trình duyệt vẫn phải ở trang login")
                .contains("/login");
    }
}
