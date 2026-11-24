package com.network.e2e.pages;

import com.network.e2e.config.TestConfig;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class AdminPage extends BasePage {

    private final By adminSidebar = By.cssSelector("aside[aria-label='Điều hướng quản trị']");
    private final By adminLogoutButton = By.cssSelector("aside[aria-label='Điều hướng quản trị'] button[aria-label='Đăng xuất']");
    private final By learningUiLink = By.cssSelector("aside[aria-label='Điều hướng quản trị'] a[href='/']");
    private final By swalConfirmButton = By.cssSelector("button.swal2-confirm");
    private final By forbiddenHeading = By.xpath("//h1[contains(normalize-space(.), 'Bạn không có quyền Quản trị viên')]");
    private final By backToHomeButton = By.xpath("//button[.//span[contains(normalize-space(.), 'Về trang chủ')]]");
    private final By switchAccountButton = By.xpath("//button[.//span[contains(normalize-space(.), 'Đổi tài khoản')]]");

    public AdminPage(WebDriver driver) {
        super(driver);
    }

    public AdminPage open(String subPath) {
        String normalized = (subPath == null || subPath.isBlank()) ? "" : (subPath.startsWith("/") ? subPath : "/" + subPath);
        driver.get(TestConfig.BASE_URL + "/admin" + normalized);
        return this;
    }

    public boolean isAdminSidebarVisible() {
        try {
            return waitAndFind(adminSidebar).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isForbidden403Visible() {
        try {
            return waitAndFind(forbiddenHeading).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public void clickBackToHomeFrom403() {
        click(backToHomeButton);
    }

    public void clickSwitchAccountFrom403() {
        click(switchAccountButton);
    }

    public void navigateToSection(String path) {
        By navLink = By.cssSelector("aside[aria-label='Điều hướng quản trị'] nav a[href='" + path + "']");
        click(navLink);
        waitForUrlContains(path);
    }

    public void switchToLearningUi() {
        click(learningUiLink);
        waitForUrlContains("/");
    }

    public void logoutFromAdmin() {
        click(adminLogoutButton);
        click(swalConfirmButton);
        waitForUrlContains("/login");
    }
}
