package com.network.e2e.tests;

import com.network.e2e.config.DriverFactory;
import com.network.e2e.config.TestConfig;
import com.network.e2e.pages.AdminPage;
import com.network.e2e.pages.HomePage;
import com.network.e2e.pages.LoginPage;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.WebDriver;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("02. Admin RBAC & Portal E2E - Kịch bản Phân quyền, Điều hướng & Đăng xuất Admin")
public class Admin02RbacAndPortalE2ETest {

    private WebDriver driver;
    private LoginPage loginPage;
    private HomePage homePage;
    private AdminPage adminPage;

    @BeforeEach
    void setUp() {
        driver = DriverFactory.createDriver();
        loginPage = new LoginPage(driver);
        homePage = new HomePage(driver);
        adminPage = new AdminPage(driver);
    }

    @AfterEach
    void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    @DisplayName("Khách chưa đăng nhập truy cập /admin/users -> Tự động chuyển về /login kèm redirect")
    void shouldRedirectUnauthenticatedGuestFromAdminToLogin() {
        adminPage.open("/users");

        assertThat(adminPage.waitForUrlContains("/login"))
                .as("Khách chưa đăng nhập phải bị chuyển hướng về trang /login")
                .isTrue();

        assertThat(adminPage.getCurrentUrl())
                .contains("redirect=")
                .contains("admin");
    }

    @Test
    @DisplayName("Tài khoản USER thường không thấy menu Admin, vào /admin bị chặn 403 và có thể Đổi tài khoản")
    void shouldBlockRegularUserFromAdminWith403AndSupportSwitchAccount() {
        loginPage.open();
        loginPage.login(TestConfig.USER_EMAIL, TestConfig.USER_PASSWORD);

        assertThat(loginPage.waitForUrlContains("/explore"))
                .as("Tài khoản USER đăng nhập phải được chuyển về /explore")
                .isTrue();

        assertThat(homePage.isUserLoggedIn()).isTrue();
        assertThat(homePage.isAdminPortalLinkVisible())
                .as("Tài khoản USER không được thấy mục Trang quản trị Admin trên Sidebar")
                .isFalse();

        // Thử gõ thẳng đường dẫn /admin
        adminPage.open("");
        assertThat(adminPage.isForbidden403Visible())
                .as("Tài khoản USER truy cập /admin phải hiển thị màn hình 403")
                .isTrue();
        assertThat(adminPage.isAdminSidebarVisible()).isFalse();

        // Bấm "Về trang chủ"
        adminPage.clickBackToHomeFrom403();
        assertThat(homePage.isUserLoggedIn()).isTrue();

        // Vào lại /admin rồi bấm "Đổi tài khoản" -> xóa phiên & đẩy về /login
        adminPage.open("");
        assertThat(adminPage.isForbidden403Visible()).isTrue();
        adminPage.clickSwitchAccountFrom403();

        assertThat(adminPage.waitForUrlContains("/login"))
                .as("Bấm Đổi tài khoản trên màn hình 403 phải chuyển về /login")
                .isTrue();
    }

    @Test
    @DisplayName("Tài khoản ADMIN đăng nhập tự vào /admin và điều hướng đầy đủ các mục Quản trị")
    void shouldLoginAsAdminAndNavigateAllAdminSections() {
        loginPage.open();
        loginPage.login(TestConfig.ADMIN_EMAIL, TestConfig.ADMIN_PASSWORD);

        assertThat(adminPage.waitForUrlContains("/admin"))
                .as("Tài khoản ADMIN đăng nhập phải tự động điều hướng vào /admin")
                .isTrue();
        assertThat(adminPage.isAdminSidebarVisible()).isTrue();

        // Điều hướng lần lượt các trang quản trị chính
        adminPage.navigateToSection("/admin/documents");
        assertThat(adminPage.getCurrentUrl()).contains("/admin/documents");

        adminPage.navigateToSection("/admin/reports");
        assertThat(adminPage.getCurrentUrl()).contains("/admin/reports");

        adminPage.navigateToSection("/admin/users");
        assertThat(adminPage.getCurrentUrl()).contains("/admin/users");

        adminPage.navigateToSection("/admin/taxonomy");
        assertThat(adminPage.getCurrentUrl()).contains("/admin/taxonomy");

        adminPage.navigateToSection("/admin/ipfs");
        assertThat(adminPage.getCurrentUrl()).contains("/admin/ipfs");

        adminPage.navigateToSection("/admin/settings");
        assertThat(adminPage.getCurrentUrl()).contains("/admin/settings");
    }

    @Test
    @DisplayName("Tài khoản ADMIN chuyển 2 chiều Admin <-> Giao diện học tập và Đăng xuất sạch về /login")
    void shouldSwitchBetweenAdminAndLearningUiAndLogoutCleanly() {
        loginPage.open();
        loginPage.login(TestConfig.ADMIN_EMAIL, TestConfig.ADMIN_PASSWORD);

        assertThat(adminPage.waitForUrlContains("/admin")).isTrue();
        assertThat(adminPage.isAdminSidebarVisible()).isTrue();

        // Chuyển sang Giao diện học tập
        adminPage.switchToLearningUi();
        assertThat(homePage.isUserLoggedIn()).isTrue();
        assertThat(homePage.isAdminPortalLinkVisible())
                .as("ADMIN trên Giao diện học tập phải thấy nút Trang quản trị Admin trên Sidebar")
                .isTrue();

        // Bấm quay lại Trang quản trị Admin
        homePage.clickAdminPortalLink();
        assertThat(adminPage.waitForUrlContains("/admin")).isTrue();
        assertThat(adminPage.isAdminSidebarVisible()).isTrue();

        // Đăng xuất từ Admin Sidebar (xác nhận SweetAlert2) -> về thẳng /login
        adminPage.logoutFromAdmin();
        assertThat(adminPage.getCurrentUrl()).contains("/login");

        // Thử quay lại /admin sau khi đăng xuất -> bị chặn đẩy về /login
        adminPage.open("");
        assertThat(adminPage.waitForUrlContains("/login"))
                .as("Sau khi đăng xuất, truy cập lại /admin phải bị chuyển về /login")
                .isTrue();
    }
}
