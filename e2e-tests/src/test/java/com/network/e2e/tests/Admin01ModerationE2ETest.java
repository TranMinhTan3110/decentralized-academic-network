package com.network.e2e.tests;

import com.network.e2e.config.DriverFactory;
import com.network.e2e.pages.LoginPage;
import com.network.e2e.pages.admin.AdminDashboardPage;
import com.network.e2e.pages.admin.AdminDocumentsPage;
import com.network.e2e.pages.admin.AdminReportsPage;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.WebDriver;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("03. Admin Moderation E2E - Luồng chính Quản trị & Kiểm duyệt tài liệu")
public class Admin01ModerationE2ETest {

    private static final String ADMIN_EMAIL = "admin.phat@dedocu.vn";
    private static final String ADMIN_PASSWORD = "Password@123";

    private WebDriver driver;
    private LoginPage loginPage;
    private AdminDashboardPage dashboardPage;
    private AdminReportsPage reportsPage;
    private AdminDocumentsPage documentsPage;

    @BeforeEach
    void setUp() {
        driver = DriverFactory.createDriver();
        loginPage = new LoginPage(driver);
        dashboardPage = new AdminDashboardPage(driver);
        reportsPage = new AdminReportsPage(driver);
        documentsPage = new AdminDocumentsPage(driver);
    }

    @AfterEach
    void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    @DisplayName("Luồng chính: Đăng nhập Admin (admin.phat@dedocu.vn) -> Dashboard -> Báo cáo vi phạm -> Quản lý bài đăng")
    void shouldExecuteAdminModerationMainFlow() {
        // 1. Đăng nhập với tài khoản Quản trị viên
        loginPage.open();
        loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);

        // Chờ chuyển hướng hoặc mở thẳng Dashboard
        boolean onAdmin = loginPage.waitForUrlContains("/admin");
        if (!onAdmin) {
            dashboardPage.open();
        }

        assertThat(dashboardPage.isDashboardLoaded())
                .as("Trang Tổng quan quản trị phải tải thành công sau khi đăng nhập tài khoản admin.phat@dedocu.vn")
                .isTrue();

        // 2. Chuyển sang Báo cáo vi phạm
        dashboardPage.navigateToReports();
        reportsPage.waitForUrlContains("/admin/reports");
        assertThat(reportsPage.isReportsLoaded())
                .as("Trang Báo cáo vi phạm phải hiển thị đúng tiêu đề")
                .isTrue();

        // 3. Thực hiện hành động kiểm duyệt: Xác nhận vi phạm & Gỡ bỏ tài liệu Kinh tế vi mô
        reportsPage.clickConfirmAndRemoveFirstReport();
        assertThat(reportsPage.isReportConfirmedBadgeVisible())
                .as("Sau khi xác nhận vi phạm, trạng thái phải cập nhật 'Đã xác nhận & gỡ bỏ'")
                .isTrue();

        // 4. Chuyển sang Quản lý bài đăng
        documentsPage.open();
        documentsPage.waitForUrlContains("/admin/documents");
        assertThat(documentsPage.isDocumentsLoaded())
                .as("Trang Quản lý bài đăng phải tải thành công")
                .isTrue();

        // 5. Thử nghiệm bộ lọc trạng thái và tìm kiếm
        // 5.1. Tab "Đang phát hành": Tìm tài liệu đang phát hành hợp lệ "Giải tích"
        documentsPage.filterByStatus("Đang phát hành");
        documentsPage.searchDocument("Giải tích");
        assertThat(documentsPage.isDocumentPresentInTable("Giải tích"))
                .as("Bảng tài liệu phải hiển thị tài liệu đang phát hành khớp từ khóa 'Giải tích'")
                .isTrue();

        // 5.2. Tab "Đã gỡ bỏ": Kiểm tra tài liệu "Kinh tế" vừa bị gỡ kỷ luật ở Bước 3
        documentsPage.filterByStatus("Đã gỡ bỏ");
        documentsPage.searchDocument("Kinh tế");
        assertThat(documentsPage.isDocumentPresentInTable("Kinh tế"))
                .as("Bảng tài liệu phải hiển thị tài liệu vừa bị gỡ bỏ trong tab Đã gỡ bỏ")
                .isTrue();
    }
}
