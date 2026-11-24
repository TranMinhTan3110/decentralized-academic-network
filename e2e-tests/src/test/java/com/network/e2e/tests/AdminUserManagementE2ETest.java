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

        // Thiết lập phiên đăng nhập Quản trị viên
        currentAdminEmail = "admin.minhtan@dedocu.vn";
        adminUsersPage.injectAdminSession(currentAdminEmail, "Trần Minh Tấn (Admin)", "ADMIN");
        adminUsersPage.open();
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
            targetUserEmail = "tan.auduong@dedocu.vn";
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
}
