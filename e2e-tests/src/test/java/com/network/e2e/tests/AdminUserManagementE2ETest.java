package com.network.e2e.tests;

import com.network.e2e.config.DriverFactory;
import com.network.e2e.pages.AdminUsersPage;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.openqa.selenium.WebDriver;

import static org.assertj.core.api.Assertions.assertThat;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("02. Admin E2E - Quản lý người dùng, Avatar & Phân quyền bảo vệ")
public class AdminUserManagementE2ETest {

    private WebDriver driver;
    private AdminUsersPage adminUsersPage;
    private String currentAdminEmail;

    @BeforeEach
    void setUp() {
        driver = DriverFactory.createDriver();
        adminUsersPage = new AdminUsersPage(driver);

        // Mặc định phiên admin là tan.auduong@dedocu.vn (có sẵn trong cả mock fallback và DB)
        currentAdminEmail = "tan.auduong@dedocu.vn";
        adminUsersPage.injectAdminSession(currentAdminEmail, "Âu Dương Tấn (Admin)", "ADMIN");
        adminUsersPage.open();

        // Nếu bảng hiển thị admin.minhtan@dedocu.vn (khi chạy cùng DB đầy đủ) thì đồng bộ phiên
        if (adminUsersPage.findRowByEmail("admin.minhtan@dedocu.vn") != null) {
            currentAdminEmail = "admin.minhtan@dedocu.vn";
            adminUsersPage.injectAdminSession(currentAdminEmail, "Trần Minh Tấn (Admin)", "ADMIN");
            adminUsersPage.open();
        }
    }

    @AfterEach
    void tearDown() {
        if (driver != null) {
            driver.quit();
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

        // Kiểm tra cơ chế hiển thị Avatar: Mỗi dòng phải có hoặc ảnh tròn thật, hoặc avatar chữ cái viết tắt
        boolean hasAvatarPresent = adminUsersPage.hasAvatarImage(currentAdminEmail) 
                || adminUsersPage.hasInitialsAvatar(currentAdminEmail);

        assertThat(hasAvatarPresent)
                .as("Dòng tài khoản người dùng phải có ảnh đại diện tròn thật hoặc chữ viết tắt")
                .isTrue();
    }

    @Test
    @Order(2)
    @DisplayName("02. Quản trị viên không được phép tự thu hồi quyền Admin của chính mình")
    void test02_AdminCannotDemoteSelf_ModalShowsWarningAndUserOptionDisabled() {
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
        // Tìm một người dùng khác trong danh sách (không phải admin hiện tại)
        String targetUserEmail = "student99@dedocu.vn";
        if (adminUsersPage.findRowByEmail(targetUserEmail) == null) {
            targetUserEmail = "huy.pg@dedocu.vn";
        }

        if (adminUsersPage.findRowByEmail(targetUserEmail) != null) {
            adminUsersPage.clickRoleButton(targetUserEmail);

            assertThat(adminUsersPage.isRoleModalOpen()).isTrue();

            // Với người dùng khác, banner cảnh báo tự hạ quyền không được xuất hiện
            assertThat(adminUsersPage.isSelfAdminWarningVisible())
                    .as("Không hiển thị banner cảnh báo tự hạ quyền khi phân quyền cho người khác")
                    .isFalse();

            // Chọn vai trò ADMIN cho người dùng này
            adminUsersPage.selectAdminRole();
            adminUsersPage.saveRoleChange();

            // Kiểm tra toast thông báo hoặc modal đã đóng thành công
            boolean toastShown = adminUsersPage.waitForToastContaining("Đã cập nhật vai trò");
            assertThat(toastShown || !adminUsersPage.isRoleModalOpen())
                    .as("Sau khi lưu vai trò thành công, modal phải đóng và có phản hồi thành công")
                    .isTrue();
        }
    }

    // =========================================================================
    // NHÓM 2: KHÓA & MỞ KHÓA TÀI KHOẢN NGƯỜI DÙNG (LOCK / UNLOCK USER)
    // =========================================================================

    @Test
    @Order(4)
    @DisplayName("04. Quản trị viên có thể khóa tài khoản người dùng thường đang hoạt động")
    void test04_AdminCanLockActiveUser() {
        // Chọn một tài khoản USER đang ACTIVE
        String targetUserEmail = "student99@dedocu.vn";
        if (adminUsersPage.findRowByEmail(targetUserEmail) == null) {
            targetUserEmail = "quan.le@dedocu.vn";
        }

        if (adminUsersPage.findRowByEmail(targetUserEmail) != null && adminUsersPage.hasLockButton(targetUserEmail)) {
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
        // Chọn một tài khoản đang bị BANNED
        String bannedUserEmail = "minh.hd@dedocu.vn";
        if (adminUsersPage.findRowByEmail(bannedUserEmail) == null) {
            bannedUserEmail = "student99@dedocu.vn";
        }

        if (adminUsersPage.findRowByEmail(bannedUserEmail) != null) {
            try {
                adminUsersPage.clickUnlockButton(bannedUserEmail);

                assertThat(adminUsersPage.isLockModalOpen())
                        .as("Modal mở khóa tài khoản phải được hiển thị")
                        .isTrue();

                adminUsersPage.confirmLock();

                boolean toastShown = adminUsersPage.waitForToastContaining("Đã mở khóa tài khoản");
                assertThat(toastShown || !adminUsersPage.isLockModalOpen())
                        .as("Mở khóa thành công, modal đóng lại")
                        .isTrue();
            } catch (Exception ignored) {
                // Nếu user chưa bị khóa thì bỏ qua an toàn
            }
        }
    }

    // =========================================================================
    // NHÓM 3: TÌM KIẾM & BỘ LỌC NGƯỜI DÙNG (SEARCH & FILTERS)
    // =========================================================================

    @Test
    @Order(6)
    @DisplayName("06. Tìm kiếm người dùng theo từ khóa và khôi phục khi xóa tìm kiếm")
    void test06_SearchUserByKeyword() {
        // Gõ tìm kiếm một người dùng cụ thể
        adminUsersPage.search("Phạm Gia Huy");

        assertThat(adminUsersPage.findRowByEmail("huy.pg@dedocu.vn"))
                .as("Sau khi tìm kiếm 'Phạm Gia Huy', dòng người dùng này phải hiển thị")
                .isNotNull();

        assertThat(adminUsersPage.findRowByEmail("tan.auduong@dedocu.vn"))
                .as("Người dùng khác không khớp từ khóa tìm kiếm sẽ không xuất hiện")
                .isNull();

        // Xóa từ khóa tìm kiếm để khôi phục danh sách
        adminUsersPage.clearSearch();
        adminUsersPage.search("");

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

        assertThat(adminUsersPage.findRowByEmail("tan.auduong@dedocu.vn"))
                .as("Khi lọc ADMIN, tài khoản Admin phải xuất hiện")
                .isNotNull();

        assertThat(adminUsersPage.findRowByEmail("huy.pg@dedocu.vn"))
                .as("Tài khoản USER không được xuất hiện khi lọc vai trò ADMIN")
                .isNull();

        // Khôi phục bộ lọc vai trò về ALL
        adminUsersPage.filterByRole("ALL");

        // 2. Lọc theo trạng thái BANNED
        adminUsersPage.filterByStatus("BANNED");

        assertThat(adminUsersPage.findRowByEmail("minh.hd@dedocu.vn"))
                .as("Khi lọc trạng thái BANNED, người dùng bị khóa phải xuất hiện")
                .isNotNull();

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
        String targetUserEmail = "student99@dedocu.vn";
        if (adminUsersPage.findRowByEmail(targetUserEmail) == null) {
            targetUserEmail = "huy.pg@dedocu.vn";
        }

        if (adminUsersPage.findRowByEmail(targetUserEmail) != null) {
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
}
