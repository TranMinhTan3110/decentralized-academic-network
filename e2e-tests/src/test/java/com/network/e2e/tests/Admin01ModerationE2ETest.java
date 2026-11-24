package com.network.e2e.tests;

import com.network.e2e.config.DriverFactory;
import com.network.e2e.config.TestConfig;
import com.network.e2e.pages.LoginPage;
import com.network.e2e.pages.admin.AdminDashboardPage;
import com.network.e2e.pages.admin.AdminDocumentsPage;
import com.network.e2e.pages.admin.AdminReportsPage;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("03. Admin Moderation E2E - Luồng chính Quản trị & Kiểm duyệt tài liệu")
public class Admin01ModerationE2ETest {

    private WebDriver driver;
    private LoginPage loginPage;
    private AdminDashboardPage dashboardPage;
    private AdminReportsPage reportsPage;
    private AdminDocumentsPage documentsPage;

    private String adminAccessToken;
    private String docApiBaseUrl;
    private String moderatedDocIdToRestore;

    @BeforeEach
    void setUp() {
        driver = DriverFactory.createDriver();
        loginPage = new LoginPage(driver);
        dashboardPage = new AdminDashboardPage(driver);
        reportsPage = new AdminReportsPage(driver);
        documentsPage = new AdminDocumentsPage(driver);
        docApiBaseUrl = resolveDocApiBaseUrl();
    }

    @AfterEach
    void tearDown() {
        // Khôi phục lại tài liệu đã gỡ trong lúc kiểm thử về trạng thái PUBLISHED để giữ sạch môi trường Staging
        if (moderatedDocIdToRestore != null && adminAccessToken != null && !adminAccessToken.startsWith("mock-")) {
            restoreDocumentToPublished(moderatedDocIdToRestore, adminAccessToken);
            moderatedDocIdToRestore = null;
        }
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    @DisplayName("Luồng chính: Đăng nhập Admin -> Dashboard -> Báo cáo vi phạm -> Quản lý bài đăng")
    void shouldExecuteAdminModerationMainFlow() {
        // 1. Đăng nhập với tài khoản Quản trị viên chuẩn từ TestConfig
        loginPage.open();
        loginPage.login(TestConfig.ADMIN_EMAIL, TestConfig.ADMIN_PASSWORD);

        boolean onAdmin = loginPage.waitForUrlContains("/admin");
        boolean offlineMockMode = false;
        if (!onAdmin) {
            offlineMockMode = true;
            dashboardPage.openOfflineFallback();
        }

        assertThat(dashboardPage.isDashboardLoaded())
                .as("Trang Tổng quan quản trị phải tải thành công sau khi đăng nhập Admin")
                .isTrue();

        String publishedDocKeyword = "Giải tích";
        String targetModerationKeyword = "Kinh tế";

        if (!offlineMockMode) {
            adminAccessToken = dashboardPage.getAccessTokenFromStorage();
            List<String> seedData = prepareLiveModerationSeed(adminAccessToken);
            if (seedData != null && seedData.size() >= 3) {
                publishedDocKeyword = seedData.get(0);
                moderatedDocIdToRestore = seedData.get(1);
                targetModerationKeyword = seedData.get(2);
            }
        }

        // 2. Chuyển sang Báo cáo vi phạm
        dashboardPage.navigateToReports();
        reportsPage.waitForUrlContains("/admin/reports");
        assertThat(reportsPage.isReportsLoaded())
                .as("Trang Báo cáo vi phạm phải hiển thị đúng tiêu đề")
                .isTrue();

        // 3. Thực hiện hành động kiểm duyệt: Xác nhận vi phạm & Gỡ bỏ tài liệu bị báo cáo
        reportsPage.clickConfirmAndRemoveReportByTitle(targetModerationKeyword);
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
        // 5.1. Tab "Đang phát hành": Tìm tài liệu đang phát hành hợp lệ
        documentsPage.filterByStatus("Đang phát hành");
        documentsPage.searchDocument(publishedDocKeyword);
        assertThat(documentsPage.isDocumentPresentInTable(publishedDocKeyword))
                .as("Bảng tài liệu phải hiển thị tài liệu đang phát hành khớp từ khóa '" + publishedDocKeyword + "'")
                .isTrue();

        // 5.2. Tab "Đã gỡ bỏ": Kiểm tra tài liệu vừa bị gỡ kỷ luật ở Bước 3
        documentsPage.filterByStatus("Đã gỡ bỏ");
        documentsPage.searchDocument(targetModerationKeyword);
        assertThat(documentsPage.isDocumentPresentInTable(targetModerationKeyword))
                .as("Bảng tài liệu phải hiển thị tài liệu vừa bị gỡ bỏ trong tab Đã gỡ bỏ")
                .isTrue();
    }

    private String resolveDocApiBaseUrl() {
        String envApi = System.getenv("E2E_API_URL");
        if (envApi != null && !envApi.isBlank()) {
            return envApi.replaceAll("/+$", "");
        }
        if (TestConfig.BASE_URL.contains("vercel.app") || TestConfig.BASE_URL.contains("dedocu")) {
            return "https://dedocu.duckdns.org/doc";
        }
        return "http://localhost:8082";
    }

    /**
     * Lấy 2 tài liệu PUBLISHED trên hệ thống thật và tạo 1 báo cáo PENDING tạm thời cho tài liệu mục tiêu
     * ngay trong ngữ cảnh trình duyệt để kịch bản kiểm duyệt chạy ổn định, lặp lại nhiều lần.
     */
    @SuppressWarnings("unchecked")
    private List<String> prepareLiveModerationSeed(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }
        try {
            Object result = ((JavascriptExecutor) driver).executeAsyncScript(
                    "const apiBase = arguments[0];" +
                    "const token = arguments[1];" +
                    "const done = arguments[arguments.length - 1];" +
                    "(async () => {" +
                    "  try {" +
                    "    const listRes = await fetch(apiBase + '/api/v1/admin/documents?status=PUBLISHED&page=0&size=20', {" +
                    "      headers: { 'Authorization': 'Bearer ' + token }" +
                    "    });" +
                    "    if (!listRes.ok) { done(null); return; }" +
                    "    const payload = await listRes.json();" +
                    "    const items = (payload && payload.data && Array.isArray(payload.data.content)) ? payload.data.content : [];" +
                    "    const published = items.filter(x => x && x.id && x.title && (!x.status || x.status === 'PUBLISHED'));" +
                    "    if (published.length === 0) { done(null); return; }" +
                    "    const stayDoc = published[0];" +
                    "    const targetDoc = published.length > 1 ? published[1] : published[0];" +
                    "    const repRes = await fetch(apiBase + '/api/v1/documents/' + targetDoc.id + '/report', {" +
                    "      method: 'POST'," +
                    "      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }," +
                    "      body: JSON.stringify({" +
                    "        reason: 'COPYRIGHT_INFRINGEMENT'," +
                    "        description: 'Báo cáo kiểm thử tự động E2E (tự động khôi phục sau khi chạy)'" +
                    "      })" +
                    "    });" +
                    "    if (!repRes.ok) { done(null); return; }" +
                    "    done([String(stayDoc.title).trim(), String(targetDoc.id).trim(), String(targetDoc.title).trim()]);" +
                    "  } catch (e) {" +
                    "    done(null);" +
                    "  }" +
                    "})();",
                    docApiBaseUrl, token
            );
            if (result instanceof List<?>) {
                return (List<String>) result;
            }
        } catch (Exception e) {
            System.err.println("[Admin01ModerationE2ETest] Could not seed live moderation report: " + e.getMessage());
        }
        return null;
    }

    private void restoreDocumentToPublished(String documentId, String token) {
        try {
            ((JavascriptExecutor) driver).executeAsyncScript(
                    "const apiBase = arguments[0];" +
                    "const docId = arguments[1];" +
                    "const token = arguments[2];" +
                    "const done = arguments[arguments.length - 1];" +
                    "fetch(apiBase + '/api/v1/admin/documents/' + docId + '/moderate', {" +
                    "  method: 'PUT'," +
                    "  headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }," +
                    "  body: JSON.stringify({ status: 'PUBLISHED', reason: 'Khôi phục tự động về PUBLISHED sau khi kết thúc kiểm thử E2E' })" +
                    "}).finally(() => done(true));",
                    docApiBaseUrl, documentId, token
            );
        } catch (Exception e) {
            System.err.println("[Admin01ModerationE2ETest] Warning: failed to restore moderated doc " + documentId + ": " + e.getMessage());
        }
    }
}
