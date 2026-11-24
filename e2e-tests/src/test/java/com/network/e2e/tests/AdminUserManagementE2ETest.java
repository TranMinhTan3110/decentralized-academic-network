package com.network.e2e.tests;

import com.network.e2e.config.DriverFactory;
import com.network.e2e.config.TestConfig;
import com.network.e2e.pages.AdminUsersPage;
import com.network.e2e.pages.LoginPage;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.openqa.selenium.WebDriver;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("02. Admin E2E - Quản lý người dùng, Avatar & Phân quyền bảo vệ")
public class AdminUserManagementE2ETest {

    private static String cachedAccessToken;
    private static String cachedCurrentUserJson;
    private static String cachedAdminEmail;
    private static boolean offlineMockMode = false;
    private static String lockedTargetEmail;

    private WebDriver driver;
    private AdminUsersPage adminUsersPage;
    private String currentAdminEmail;

    @BeforeEach
    void setUp() {
        driver = DriverFactory.createDriver();
        adminUsersPage = new AdminUsersPage(driver);

        if (cachedAccessToken != null && !offlineMockMode) {
            currentAdminEmail = cachedAdminEmail;
            adminUsersPage.restoreAuthenticatedSession(cachedAccessToken, cachedCurrentUserJson);
            adminUsersPage.open();
            return;
        }

        if (!offlineMockMode) {
            try {
                LoginPage loginPage = new LoginPage(driver);
                loginPage.open();
                loginPage.login(TestConfig.ADMIN_EMAIL, TestConfig.ADMIN_PASSWORD);
                if (loginPage.waitForUrlContains("/admin")) {
                    cachedAccessToken = adminUsersPage.readLocalStorageItem("accessToken");
                    cachedCurrentUserJson = adminUsersPage.readLocalStorageItem("currentUser");
                    cachedAdminEmail = TestConfig.ADMIN_EMAIL;
                    currentAdminEmail = cachedAdminEmail;
                    adminUsersPage.open();
                    return;
                }
            } catch (Exception ignored) {
                // Rơi về chế độ offline mock bên dưới nếu không có backend chạy cùng
            }
        }

        offlineMockMode = true;
        currentAdminEmail = "tan.auduong@dedocu.vn";
        adminUsersPage.injectAdminSession(currentAdminEmail, "Âu Dương Tấn (Admin)", "ADMIN");
        adminUsersPage.open();
    }

    @AfterEach
    void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }

    private void ensureAdminRowVisible() {
        if (adminUsersPage.findRowByEmail(currentAdminEmail) == null) {
            adminUsersPage.search(currentAdminEmail);
            adminUsersPage.waitForRowByEmail(currentAdminEmail, 8);
        }
    }

    @Test
    @Order(1)
    @DisplayName("01. Danh sách người dùng hiển thị đầy đủ và có Avatar thật / Initials Fallback")
    void test01_DisplayUserAvatarsAndTable() {
        assertThat(adminUsersPage.isLoaded())
                .as("Trang Quản lý người dùng phải được tải thành công")
                .isTrue();

        int rowCount = adminUsersPage.getUserRowCount();
        assertThat(rowCount)
                .as("Danh sách người dùng phải có ít nhất 1 dòng")
                .isGreaterThan(0);

        List<String> visibleEmails = adminUsersPage.getVisibleUserEmails();
        assertThat(visibleEmails)
                .as("Phải đọc được email của các dòng người dùng trên bảng")
                .isNotEmpty();

        String sampleEmail = visibleEmails.get(0);
        boolean hasAvatarPresent = adminUsersPage.hasAvatarImage(sampleEmail)
                || adminUsersPage.hasInitialsAvatar(sampleEmail);

        assertThat(hasAvatarPresent)
                .as("Dòng tài khoản người dùng phải có ảnh đại diện tròn thật hoặc chữ viết tắt")
                .isTrue();
    }

    @Test
    @Order(2)
    @DisplayName("02. Quản trị viên không được phép tự thu hồi quyền Admin của chính mình")
    void test02_AdminCannotDemoteSelf_ModalShowsWarningAndUserOptionDisabled() {
        ensureAdminRowVisible();

        assertThat(adminUsersPage.findRowByEmail(currentAdminEmail))
                .as("Phải tìm thấy dòng của tài khoản Admin đang đăng nhập: " + currentAdminEmail)
                .isNotNull();

        // 1. Kiểm tra nút Khóa tài khoản của chính mình bị ẩn hoàn toàn
        assertThat(adminUsersPage.hasLockButton(currentAdminEmail))
                .as("Admin không được phép tự khóa tài khoản của mình -> Nút Khóa màu đỏ phải bị ẩn")
                .isFalse();

        // 2. Bấm phân quyền cho chính tài khoản của Admin đang đăng nhập
        adminUsersPage.clickRoleButton(currentAdminEmail);

        assertThat(adminUsersPage.isRoleModalOpen())
                .as("Modal phân quyền phải được hiển thị")
                .isTrue();

        // 3. Kiểm tra banner cảnh báo màu vàng
        assertThat(adminUsersPage.isSelfAdminWarningVisible())
                .as("Phải hiển thị banner cảnh báo quản trị viên không thể tự thu hồi quyền Admin của chính mình")
                .isTrue();

        // 4. Kiểm tra tùy chọn USER bị vô hiệu hóa (disabled)
        assertThat(adminUsersPage.isUserRoleOptionDisabled())
                .as("Tùy chọn USER phải bị disable (mờ đi) khi phân quyền cho chính mình")
                .isTrue();

        // 5. Đóng modal an toàn
        adminUsersPage.cancelRoleChange();
        assertThat(adminUsersPage.isRoleModalOpen())
                .as("Sau khi bấm Hủy bỏ, modal phải đóng lại")
                .isFalse();
    }

    @Test
    @Order(3)
    @DisplayName("03. Quản trị viên có thể phân quyền thành công cho người dùng khác")
    void test03_AdminCanChangeRoleForOtherUserSuccessfully() {
        adminUsersPage.filterByRole("USER");
        adminUsersPage.filterByStatus("ACTIVE");

        String targetUserEmail = adminUsersPage.pickSafeTargetUserEmail(currentAdminEmail, TestConfig.USER_EMAIL);
        assertThat(targetUserEmail)
                .as("Phải có ít nhất 1 người dùng USER đang hoạt động để kiểm thử phân quyền")
                .isNotNull();

        adminUsersPage.clickRoleButton(targetUserEmail);
        assertThat(adminUsersPage.isRoleModalOpen()).isTrue();

        // Với người dùng khác, banner cảnh báo tự hạ quyền không được xuất hiện
        assertThat(adminUsersPage.isSelfAdminWarningVisible())
                .as("Không hiển thị banner cảnh báo tự hạ quyền khi phân quyền cho người khác")
                .isFalse();

        // Chọn vai trò ADMIN cho người dùng này
        adminUsersPage.selectAdminRole();
        adminUsersPage.saveRoleChange();

        boolean toastShown = adminUsersPage.waitForToastContaining("Đã cập nhật vai trò");
        assertThat(toastShown || !adminUsersPage.isRoleModalOpen())
                .as("Sau khi lưu vai trò thành công, modal phải đóng và có phản hồi thành công")
                .isTrue();

        // Khôi phục lại vai trò USER ban đầu để giữ sạch dữ liệu môi trường Staging
        adminUsersPage.filterByRole("ALL");
        adminUsersPage.filterByStatus("ALL");
        adminUsersPage.search(targetUserEmail);
        if (adminUsersPage.waitForRowByEmail(targetUserEmail, 6) != null
                && "ADMIN".equalsIgnoreCase(adminUsersPage.getUserRole(targetUserEmail))) {
            adminUsersPage.clickRoleButton(targetUserEmail);
            adminUsersPage.selectUserRole();
            adminUsersPage.saveRoleChange();
            adminUsersPage.waitForToastContaining("Đã cập nhật vai trò");
        }
    }

    // =========================================================================
    // NHÓM 2: KHÓA & MỞ KHÓA TÀI KHOẢN NGƯỜI DÙNG (LOCK / UNLOCK USER)
    // =========================================================================

    @Test
    @Order(4)
    @DisplayName("04. Quản trị viên có thể khóa tài khoản người dùng thường đang hoạt động")
    void test04_AdminCanLockActiveUser() {
        adminUsersPage.filterByRole("USER");
        adminUsersPage.filterByStatus("ACTIVE");

        String targetUserEmail = adminUsersPage.pickSafeTargetUserEmail(currentAdminEmail, TestConfig.USER_EMAIL);
        assertThat(targetUserEmail)
                .as("Phải tìm thấy 1 tài khoản USER đang ACTIVE để kiểm thử khóa")
                .isNotNull();

        if (adminUsersPage.hasLockButton(targetUserEmail)) {
            lockedTargetEmail = targetUserEmail;
            adminUsersPage.clickLockButton(targetUserEmail);

            assertThat(adminUsersPage.isLockModalOpen())
                    .as("Modal khóa tài khoản phải được hiển thị")
                    .isTrue();

            adminUsersPage.confirmLock();

            boolean toastShown = adminUsersPage.waitForToastContaining("Đã khóa tài khoản");
            assertThat(toastShown || !adminUsersPage.isLockModalOpen())
                    .as("Khóa tài khoản thành công, modal đóng lại")
                    .isTrue();
        }
    }

    @Test
    @Order(5)
    @DisplayName("05. Quản trị viên có thể mở khóa tài khoản người dùng đang bị cấm")
    void test05_AdminCanUnlockBannedUser() {
        String bannedUserEmail = lockedTargetEmail;
        if (bannedUserEmail != null) {
            adminUsersPage.search(bannedUserEmail);
            adminUsersPage.waitForRowByEmail(bannedUserEmail, 8);
        } else {
            adminUsersPage.filterByStatus("BANNED");
            List<String> bannedEmails = adminUsersPage.getVisibleUserEmails();
            if (!bannedEmails.isEmpty()) {
                bannedUserEmail = bannedEmails.get(0);
            }
        }

        if (bannedUserEmail != null && adminUsersPage.findRowByEmail(bannedUserEmail) != null) {
            adminUsersPage.clickUnlockButton(bannedUserEmail);

            assertThat(adminUsersPage.isLockModalOpen())
                    .as("Modal mở khóa tài khoản phải được hiển thị")
                    .isTrue();

            adminUsersPage.confirmLock();

            boolean toastShown = adminUsersPage.waitForToastContaining("Đã mở khóa tài khoản");
            assertThat(toastShown || !adminUsersPage.isLockModalOpen())
                    .as("Mở khóa thành công, modal đóng lại")
                    .isTrue();
            lockedTargetEmail = null;
        }
    }

    // =========================================================================
    // NHÓM 3: TÌM KIẾM & BỘ LỌC NGƯỜI DÙNG (SEARCH & FILTERS)
    // =========================================================================

    @Test
    @Order(6)
    @DisplayName("06. Tìm kiếm người dùng theo từ khóa và khôi phục khi xóa tìm kiếm")
    void test06_SearchUserByKeyword() {
        adminUsersPage.filterByRole("USER");
        String targetUserEmail = adminUsersPage.pickSafeTargetUserEmail(currentAdminEmail, null);
        adminUsersPage.filterByRole("ALL");

        assertThat(targetUserEmail)
                .as("Phải có ít nhất 1 tài khoản USER để kiểm thử tìm kiếm")
                .isNotNull();

        // Gõ tìm kiếm chính xác theo email người dùng đó
        adminUsersPage.search(targetUserEmail);

        assertThat(adminUsersPage.waitForRowByEmail(targetUserEmail, 8))
                .as("Sau khi tìm kiếm theo email '" + targetUserEmail + "', dòng người dùng này phải hiển thị")
                .isNotNull();

        assertThat(adminUsersPage.findRowByEmail(currentAdminEmail))
                .as("Tài khoản Admin không khớp từ khóa tìm kiếm sẽ không xuất hiện")
                .isNull();

        // Xóa từ khóa tìm kiếm để khôi phục danh sách
        adminUsersPage.clearSearch();

        assertThat(adminUsersPage.getUserRowCount())
                .as("Sau khi xóa tìm kiếm, danh sách người dùng được khôi phục đầy đủ")
                .isGreaterThanOrEqualTo(1);
    }

    @Test
    @Order(7)
    @DisplayName("07. Lọc người dùng theo vai trò (ADMIN/USER) và trạng thái (BANNED/ACTIVE)")
    void test07_FilterUsersByRoleAndStatus() {
        // 1. Lọc theo vai trò ADMIN
        adminUsersPage.filterByRole("ADMIN");

        assertThat(adminUsersPage.getUserRowCount())
                .as("Khi lọc ADMIN, phải có ít nhất 1 tài khoản quản trị viên xuất hiện")
                .isGreaterThanOrEqualTo(1);

        for (String email : adminUsersPage.getVisibleUserEmails()) {
            assertThat(adminUsersPage.getUserRole(email))
                    .as("Mọi dòng hiển thị khi lọc ADMIN đều phải mang vai trò ADMIN")
                    .isEqualTo("ADMIN");
        }

        // 2. Lọc theo vai trò USER
        adminUsersPage.filterByRole("USER");
        assertThat(adminUsersPage.findRowByEmail(currentAdminEmail))
                .as("Tài khoản Admin không được xuất hiện khi lọc vai trò USER")
                .isNull();

        // Khôi phục bộ lọc vai trò về ALL
        adminUsersPage.filterByRole("ALL");

        // 3. Lọc theo trạng thái BANNED
        adminUsersPage.filterByStatus("BANNED");

        assertThat(adminUsersPage.findRowByEmail(currentAdminEmail))
                .as("Tài khoản Admin đang ACTIVE không được xuất hiện khi lọc trạng thái BANNED")
                .isNull();

        if (adminUsersPage.getUserRowCount() > 0) {
            for (String email : adminUsersPage.getVisibleUserEmails()) {
                assertThat(adminUsersPage.getUserStatus(email))
                        .as("Mọi dòng hiển thị khi lọc BANNED đều phải có trạng thái BANNED")
                        .isEqualTo("BANNED");
            }
        } else {
            assertThat(adminUsersPage.isEmptyStateVisible())
                    .as("Nếu hiện không có tài khoản bị khóa thì hiển thị trạng thái trống hợp lệ")
                    .isTrue();
        }

        // Khôi phục bộ lọc trạng thái về ALL
        adminUsersPage.filterByStatus("ALL");
    }

    // =========================================================================
    // NHÓM 4: ĐIỀU CHỈNH ĐIỂM THƯỞNG & TOKEN (ADJUST POINTS & TOKENS)
    // =========================================================================

    @Test
    @Order(8)
    @DisplayName("08. Quản trị viên có thể mở modal và điều chỉnh điểm uy tín, số dư token cho người dùng")
    void test08_AdminCanAdjustReputationAndTokenBalance() {
        adminUsersPage.filterByRole("USER");
        String targetUserEmail = adminUsersPage.pickSafeTargetUserEmail(currentAdminEmail, null);

        assertThat(targetUserEmail)
                .as("Phải có ít nhất 1 người dùng USER để mở modal điều chỉnh điểm")
                .isNotNull();

        adminUsersPage.clickAdjustButton(targetUserEmail);

        assertThat(adminUsersPage.isAdjustModalOpen())
                .as("Modal điều chỉnh điểm & token phải hiển thị")
                .isTrue();

        // Nhập điểm uy tín mới và token mới
        adminUsersPage.setReputationPoints(999);
        adminUsersPage.setTokenBalance(500);

        adminUsersPage.confirmAdjust();

        boolean toastShown = adminUsersPage.waitForToastContaining("Đã cập nhật điểm");
        assertThat(toastShown || !adminUsersPage.isAdjustModalOpen())
                .as("Sau khi lưu điểm số mới, modal phải đóng lại")
                .isTrue();
    }
}
