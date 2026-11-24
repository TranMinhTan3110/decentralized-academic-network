package com.network.e2e.pages;

import com.network.e2e.config.TestConfig;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;

import java.util.List;

/**
 * Page Object đại diện cho trang Quản lý người dùng & phân quyền (/admin/users).
 */
public class AdminUsersPage extends BasePage {

    // Header & Toolbar Locators
    private final By pageHeading = By.xpath("//h1[contains(text(), 'Quản lý người dùng')] | //h2[contains(text(), 'Quản lý người dùng')]");
    private final By searchInput = By.cssSelector("input[aria-label='Tìm kiếm người dùng']");
    private final By schoolSelect = By.cssSelector("select[aria-label='Lọc theo trường']");
    private final By roleSelect = By.cssSelector("select[aria-label='Lọc theo vai trò']");
    private final By statusSelect = By.cssSelector("select[aria-label='Lọc theo trạng thái']");
    private final By refreshButton = By.cssSelector("button[aria-label='Tải lại danh sách']");

    // Table Locators
    private final By userTableRows = By.cssSelector("tbody tr");

    // Role Modal Locators
    private final By roleModalDialog = By.cssSelector("div[role='dialog'][aria-labelledby='user-role-modal-title']");
    private final By selfAdminWarning = By.xpath("//div[@role='dialog']//*[contains(text(), 'Lưu ý quản trị viên')]");
    private final By userRoleOption = By.xpath("//div[@role='dialog']//button[.//div[contains(text(), 'USER')]]");
    private final By adminRoleOption = By.xpath("//div[@role='dialog']//button[.//div[contains(text(), 'ADMIN')]]");
    private final By saveRoleButton = By.xpath("//div[@role='dialog']//button[contains(text(), 'Lưu thay đổi')]");
    private final By cancelRoleButton = By.xpath("//div[@role='dialog']//button[contains(text(), 'Hủy bỏ')]");

    // Lock Modal Locators
    private final By lockModalDialog = By.cssSelector("div[role='dialog'][aria-labelledby='user-lock-modal-title']");
    private final By confirmLockButton = By.xpath("//div[@role='dialog']//button[contains(text(), 'Khóa tài khoản') or contains(text(), 'Mở khóa')]");
    private final By cancelLockButton = By.xpath("//div[@role='dialog']//button[contains(text(), 'Hủy bỏ')]");

    public AdminUsersPage(WebDriver driver) {
        super(driver);
    }

    /**
     * Mở trực tiếp trang Quản lý người dùng
     */
    public AdminUsersPage open() {
        driver.get(TestConfig.BASE_URL + "/admin/users");
        waitAndFind(searchInput);
        return this;
    }

    /**
     * Tiện ích tiêm phiên đăng nhập Admin vào localStorage cho các kịch bản test nhanh
     */
    public void injectAdminSession(String email, String fullName, String role) {
        driver.get(TestConfig.BASE_URL + "/login");
        ((JavascriptExecutor) driver).executeScript(
            "localStorage.setItem('accessToken', 'mock-admin-e2e-token');" +
            "localStorage.setItem('currentUser', JSON.stringify({" +
            "  id: 'u1'," +
            "  email: arguments[0]," +
            "  username: 'admin_test'," +
            "  fullName: arguments[1]," +
            "  role: arguments[2]" +
            "}));", email, fullName, role
        );
    }

    public boolean isLoaded() {
        try {
            return waitAndFind(searchInput).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public int getUserRowCount() {
        try {
            List<WebElement> rows = driver.findElements(userTableRows);
            return rows.size();
        } catch (Exception e) {
            return 0;
        }
    }

    public WebElement findRowByEmail(String email) {
        String lowerEmail = email.toLowerCase().trim();
        List<WebElement> rows = driver.findElements(userTableRows);
        for (WebElement row : rows) {
            if (row.getText().toLowerCase().contains(lowerEmail)) {
                return row;
            }
        }
        return null;
    }

    /**
     * Kiểm tra dòng người dùng có hiển thị thẻ <img> chứa ảnh đại diện thật không
     */
    public boolean hasAvatarImage(String email) {
        WebElement row = findRowByEmail(email);
        if (row == null) return false;
        try {
            List<WebElement> imgs = row.findElements(By.cssSelector("img.rounded-full"));
            return !imgs.isEmpty() && imgs.get(0).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Kiểm tra dòng người dùng có hiển thị avatar chữ cái viết tắt (Initials) không
     */
    public boolean hasInitialsAvatar(String email) {
        WebElement row = findRowByEmail(email);
        if (row == null) return false;
        try {
            List<WebElement> initials = row.findElements(By.cssSelector("div.rounded-full.bg-\\[\\#dbe7fb\\]"));
            return !initials.isEmpty() && initials.get(0).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public String getUserRole(String email) {
        WebElement row = findRowByEmail(email);
        if (row == null) return "";
        try {
            List<WebElement> roleBadges = row.findElements(By.xpath(".//span[text()='ADMIN' or text()='USER']"));
            if (!roleBadges.isEmpty()) {
                return roleBadges.get(0).getText().trim();
            }
        } catch (Exception ignored) {}
        return "";
    }

    public String getUserStatus(String email) {
        WebElement row = findRowByEmail(email);
        if (row == null) return "";
        try {
            List<WebElement> statusBadges = row.findElements(By.xpath(".//span[text()='ACTIVE' or text()='BANNED' or text()='UNVERIFIED']"));
            if (!statusBadges.isEmpty()) {
                return statusBadges.get(0).getText().trim();
            }
        } catch (Exception ignored) {}
        return "";
    }

    /**
     * Bấm icon Chìa khóa để mở modal Phân quyền cho người dùng có email tương ứng
     */
    public void clickRoleButton(String email) {
        WebElement row = findRowByEmail(email);
        if (row == null) {
            throw new RuntimeException("Không tìm thấy dòng của user với email: " + email);
        }
        WebElement btn = row.findElement(By.cssSelector("button[aria-label^='Phân quyền cho']"));
        btn.click();
        waitAndFind(roleModalDialog);
    }

    /**
     * Kiểm tra xem trên dòng của người dùng có nút Khóa (màu đỏ) hay không
     */
    public boolean hasLockButton(String email) {
        WebElement row = findRowByEmail(email);
        if (row == null) return false;
        try {
            List<WebElement> lockBtns = row.findElements(By.cssSelector("button[aria-label^='Khóa tài khoản']"));
            return !lockBtns.isEmpty() && lockBtns.get(0).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public void clickLockButton(String email) {
        WebElement row = findRowByEmail(email);
        if (row == null) {
            throw new RuntimeException("Không tìm thấy dòng của user với email: " + email);
        }
        WebElement lockBtn = row.findElement(By.cssSelector("button[aria-label^='Khóa tài khoản']"));
        lockBtn.click();
        waitAndFind(lockModalDialog);
    }

    public void clickUnlockButton(String email) {
        WebElement row = findRowByEmail(email);
        if (row == null) {
            throw new RuntimeException("Không tìm thấy dòng của user với email: " + email);
        }
        WebElement unlockBtn = row.findElement(By.cssSelector("button[aria-label^='Mở khóa cho']"));
        unlockBtn.click();
        waitAndFind(lockModalDialog);
    }

    // Modal Phân quyền tương tác
    public boolean isRoleModalOpen() {
        try {
            return waitAndFind(roleModalDialog).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isSelfAdminWarningVisible() {
        try {
            return waitAndFind(selfAdminWarning).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isUserRoleOptionDisabled() {
        try {
            WebElement btn = waitAndFind(userRoleOption);
            String disabledAttr = btn.getAttribute("disabled");
            String classAttr = btn.getAttribute("class");
            return "true".equals(disabledAttr) || (classAttr != null && classAttr.contains("cursor-not-allowed"));
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isSaveRoleButtonDisabled() {
        try {
            WebElement btn = waitAndFind(saveRoleButton);
            String disabledAttr = btn.getAttribute("disabled");
            String classAttr = btn.getAttribute("class");
            return "true".equals(disabledAttr) || (classAttr != null && classAttr.contains("cursor-not-allowed"));
        } catch (Exception e) {
            return false;
        }
    }

    public void selectUserRole() {
        click(userRoleOption);
    }

    public void selectAdminRole() {
        click(adminRoleOption);
    }

    public void saveRoleChange() {
        click(saveRoleButton);
    }

    public void cancelRoleChange() {
        click(cancelRoleButton);
    }

    // Modal Khóa tương tác
    public void confirmLock() {
        click(confirmLockButton);
    }

    public void cancelLock() {
        click(cancelLockButton);
    }

    // Bộ lọc & Tìm kiếm
    public void search(String keyword) {
        type(searchInput, keyword);
    }

    public void filterByRole(String role) {
        Select select = new Select(waitAndFind(roleSelect));
        select.selectByValue(role);
    }

    public void filterByStatus(String status) {
        Select select = new Select(waitAndFind(statusSelect));
        select.selectByValue(status);
    }

    public void filterBySchool(String school) {
        Select select = new Select(waitAndFind(schoolSelect));
        select.selectByValue(school);
    }

    public void refresh() {
        click(refreshButton);
    }

    public boolean waitForToastContaining(String text) {
        try {
            By toastLocator = By.xpath("//*[contains(@data-sonner-toast, '') or contains(@class, 'sonner')][contains(., '" + text + "')] | //*[contains(text(), '" + text + "')]");
            return wait.until(ExpectedConditions.visibilityOfElementLocated(toastLocator)).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }
}
