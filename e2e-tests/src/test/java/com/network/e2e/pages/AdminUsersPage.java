package com.network.e2e.pages;

import com.network.e2e.config.TestConfig;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.Keys;
import org.openqa.selenium.StaleElementReferenceException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.ArrayList;
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
    private final By userTableRows = By.xpath("//tbody/tr[.//button[starts-with(@aria-label, 'Phân quyền cho')]]");
    private final By emptyStateMessage = By.xpath("//tbody//*[contains(text(), 'Không tìm thấy người dùng nào phù hợp')]");

    // Role Modal Locators
    private final By roleModalDialog = By.cssSelector("div[role='dialog'][aria-labelledby='user-role-modal-title']");
    private final By selfAdminWarning = By.xpath("//div[@role='dialog']//*[contains(text(), 'Lưu ý quản trị viên')]");
    private final By userRoleOption = By.xpath("//div[@role='dialog']//button[.//div[contains(text(), 'USER')]]");
    private final By adminRoleOption = By.xpath("//div[@role='dialog']//button[.//div[contains(text(), 'ADMIN')]]");
    private final By saveRoleButton = By.xpath("//div[@role='dialog']//button[contains(text(), 'Lưu thay đổi')]");
    private final By cancelRoleButton = By.xpath("//div[@role='dialog']//button[contains(text(), 'Hủy bỏ')]");

    // Lock Modal Locators
    private final By lockModalDialog = By.cssSelector("div[role='dialog'][aria-labelledby='user-lock-modal-title']");
    private final By confirmLockButton = By.xpath("//div[@role='dialog']//button[contains(text(), 'Xác nhận khóa') or contains(text(), 'Xác nhận mở khóa') or contains(text(), 'Khóa tài khoản') or contains(text(), 'Mở khóa')]");
    private final By cancelLockButton = By.xpath("//div[@role='dialog']//button[contains(text(), 'Hủy bỏ')]");

    // Adjust Modal Locators
    private final By adjustModalDialog = By.cssSelector("div[role='dialog'][aria-labelledby='user-adjust-modal-title']");
    private final By adjustReputationInput = By.id("adjust-reputation");
    private final By adjustTokenInput = By.id("adjust-token-balance");
    private final By adjustReasonInput = By.id("adjust-reason");
    private final By confirmAdjustButton = By.xpath("//div[@role='dialog']//button[contains(text(), 'Xác nhận cập nhật')]");
    private final By cancelAdjustButton = By.xpath("//div[@role='dialog']//button[contains(text(), 'Hủy bỏ')]");

    public AdminUsersPage(WebDriver driver) {
        super(driver);
    }

    /**
     * Mở trực tiếp trang Quản lý người dùng và chờ dữ liệu bảng tải xong
     */
    public AdminUsersPage open() {
        driver.get(TestConfig.BASE_URL + "/admin/users");
        waitAndFind(searchInput);
        waitForTableSettled();
        return this;
    }

    /**
     * Chờ skeleton biến mất và bảng có dữ liệu hoặc hiển thị trạng thái trống
     */
    public void waitForTableSettled() {
        try {
            wait.until(ExpectedConditions.invisibilityOfElementLocated(By.cssSelector("tr.animate-pulse")));
        } catch (Exception ignored) {}
        try {
            new WebDriverWait(driver, Duration.ofSeconds(10))
                    .ignoring(StaleElementReferenceException.class)
                    .until(d -> !d.findElements(userTableRows).isEmpty() || !d.findElements(emptyStateMessage).isEmpty());
        } catch (Exception ignored) {}
    }

    /**
     * Khôi phục phiên đăng nhập Admin thật đã xác thực vào localStorage để tăng tốc E2E và tránh rate-limit
     */
    public void restoreAuthenticatedSession(String accessToken, String currentUserJson) {
        driver.get(TestConfig.BASE_URL + "/login");
        ((JavascriptExecutor) driver).executeScript(
            "localStorage.setItem('accessToken', arguments[0]);" +
            "if (arguments[1]) {" +
            "  localStorage.setItem('currentUser', arguments[1]);" +
            "  localStorage.setItem('user', arguments[1]);" +
            "  localStorage.setItem('userDto', arguments[1]);" +
            "  try {" +
            "    const parsed = JSON.parse(arguments[1]);" +
            "    if (parsed && parsed.id) localStorage.setItem('dedocu_user_id', parsed.id);" +
            "    if (parsed && parsed.role) localStorage.setItem('dedocu_user_role', parsed.role);" +
            "  } catch (e) {}" +
            "}",
            accessToken, currentUserJson
        );
    }

    public String readLocalStorageItem(String key) {
        Object val = ((JavascriptExecutor) driver).executeScript("return localStorage.getItem(arguments[0]);", key);
        return val != null ? val.toString() : null;
    }

    /**
     * Tiện ích tiêm phiên đăng nhập Admin vào localStorage cho các kịch bản test nhanh
     */
    public void injectAdminSession(String email, String fullName, String role) {
        driver.get(TestConfig.BASE_URL + "/login");
        ((JavascriptExecutor) driver).executeScript(
            "const userObj = JSON.stringify({" +
            "  id: 'u1'," +
            "  email: arguments[0]," +
            "  username: 'admin_test'," +
            "  fullName: arguments[1]," +
            "  role: arguments[2]" +
            "});" +
            "localStorage.setItem('accessToken', 'mock-admin-e2e-token');" +
            "localStorage.setItem('currentUser', userObj);" +
            "localStorage.setItem('user', userObj);" +
            "localStorage.setItem('userDto', userObj);" +
            "localStorage.setItem('dedocu_user_id', 'u1');" +
            "localStorage.setItem('dedocu_user_role', arguments[2]);",
            email, fullName, role
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
        if (email == null || email.isBlank()) return null;
        String lowerEmail = email.toLowerCase().trim();
        List<WebElement> rows = driver.findElements(userTableRows);
        for (WebElement row : rows) {
            try {
                if (row.getText().toLowerCase().contains(lowerEmail)) {
                    return row;
                }
            } catch (StaleElementReferenceException ignored) {}
        }
        return null;
    }

    public WebElement waitForRowByEmail(String email, int timeoutSeconds) {
        try {
            return new WebDriverWait(driver, Duration.ofSeconds(timeoutSeconds))
                    .ignoring(StaleElementReferenceException.class)
                    .until(d -> findRowByEmail(email));
        } catch (Exception e) {
            return null;
        }
    }

    public boolean isEmptyStateVisible() {
        try {
            List<WebElement> els = driver.findElements(emptyStateMessage);
            return !els.isEmpty() && els.get(0).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Lấy danh sách email của toàn bộ các dòng người dùng đang hiển thị trên bảng
     */
    public List<String> getVisibleUserEmails() {
        List<String> emails = new ArrayList<>();
        List<WebElement> rows = driver.findElements(userTableRows);
        for (WebElement row : rows) {
            try {
                List<WebElement> cells = row.findElements(By.tagName("td"));
                if (cells.size() >= 2) {
                    String[] lines = cells.get(1).getText().split("\\R");
                    for (String line : lines) {
                        String trimmed = line.trim();
                        if (trimmed.contains("@")) {
                            emails.add(trimmed);
                            break;
                        }
                    }
                }
            } catch (StaleElementReferenceException ignored) {}
        }
        return emails;
    }

    /**
     * Tìm một email người dùng phù hợp để thao tác test (không phải admin hiện tại, ưu tiên tránh tài khoản USER E2E dùng chung)
     */
    public String pickSafeTargetUserEmail(String currentAdminEmail, String avoidEmailIfPossible) {
        List<String> visible = getVisibleUserEmails();
        String fallback = null;
        for (String email : visible) {
            if (currentAdminEmail != null && email.equalsIgnoreCase(currentAdminEmail)) {
                continue;
            }
            String role = getUserRole(email);
            if ("ADMIN".equalsIgnoreCase(role)) {
                continue;
            }
            if (avoidEmailIfPossible != null && email.equalsIgnoreCase(avoidEmailIfPossible)) {
                if (fallback == null) fallback = email;
                continue;
            }
            return email;
        }
        return fallback;
    }

    /**
     * Kiểm tra dòng người dùng có hiển thị thẻ <img> chứa ảnh đại diện thật không
     */
    public boolean hasAvatarImage(String email) {
        WebElement row = findRowByEmail(email);
        if (row == null) return false;
        try {
            List<WebElement> imgs = row.findElements(By.tagName("img"));
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
            List<WebElement> initials = row.findElements(By.xpath(".//div[contains(@class, 'rounded-full')]"));
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
    public boolean isLockModalOpen() {
        try {
            return waitAndFind(lockModalDialog).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public void confirmLock() {
        click(confirmLockButton);
    }

    public void cancelLock() {
        click(cancelLockButton);
    }

    // Modal Điều chỉnh tương tác (Nhóm 4)
    public void clickAdjustButton(String email) {
        WebElement row = findRowByEmail(email);
        if (row == null) {
            throw new RuntimeException("Không tìm thấy dòng của user với email: " + email);
        }
        WebElement btn = row.findElement(By.cssSelector("button[aria-label^='Điều chỉnh điểm cho']"));
        btn.click();
        waitAndFind(adjustModalDialog);
    }

    public boolean isAdjustModalOpen() {
        try {
            return waitAndFind(adjustModalDialog).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public void setReputationPoints(int points) {
        WebElement input = waitAndFind(adjustReputationInput);
        input.sendKeys(org.openqa.selenium.Keys.chord(org.openqa.selenium.Keys.CONTROL, "a"), org.openqa.selenium.Keys.BACK_SPACE);
        input.sendKeys(String.valueOf(points));
    }

    public void setTokenBalance(int tokens) {
        WebElement input = waitAndFind(adjustTokenInput);
        input.sendKeys(org.openqa.selenium.Keys.chord(org.openqa.selenium.Keys.CONTROL, "a"), org.openqa.selenium.Keys.BACK_SPACE);
        input.sendKeys(String.valueOf(tokens));
    }

    public void confirmAdjust() {
        click(confirmAdjustButton);
    }

    public void cancelAdjust() {
        click(cancelAdjustButton);
    }

    // Bộ lọc & Tìm kiếm (Nhóm 3)
    public void search(String keyword) {
        WebElement input = waitAndFind(searchInput);
        input.sendKeys(Keys.chord(Keys.CONTROL, "a"), Keys.BACK_SPACE);
        if (keyword != null && !keyword.isEmpty()) {
            input.sendKeys(keyword);
        }
        pauseBrieflyForFilter();
    }

    public void clearSearch() {
        WebElement input = waitAndFind(searchInput);
        input.sendKeys(Keys.chord(Keys.CONTROL, "a"), Keys.BACK_SPACE);
        pauseBrieflyForFilter();
    }

    public void filterByRole(String role) {
        Select select = new Select(waitAndFind(roleSelect));
        select.selectByValue(role);
        pauseBrieflyForFilter();
    }

    public void filterByStatus(String status) {
        Select select = new Select(waitAndFind(statusSelect));
        select.selectByValue(status);
        pauseBrieflyForFilter();
    }

    public void filterBySchool(String school) {
        Select select = new Select(waitAndFind(schoolSelect));
        select.selectByValue(school);
        pauseBrieflyForFilter();
    }

    private void pauseBrieflyForFilter() {
        try {
            Thread.sleep(600);
        } catch (InterruptedException ignored) {
            Thread.currentThread().interrupt();
        }
        waitForTableSettled();
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
