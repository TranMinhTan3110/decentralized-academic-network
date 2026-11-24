package com.network.e2e.pages;

import com.network.e2e.config.TestConfig;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

public class HomePage extends BasePage {

    private final By logoutButton = By.cssSelector("button[aria-label='Đăng xuất']");
    private final By loginLink = By.cssSelector("header a[href='/login']");
    private final By userNameSpan = By.cssSelector("header button[aria-label='Đăng xuất'] span.truncate");
    private final By welcomeHeading = By.cssSelector("section.home-intro h1");
    private final By adminPortalLink = By.cssSelector("aside nav a[href='/admin']");
    private final By swalConfirmButton = By.cssSelector("button.swal2-confirm");

    public HomePage(WebDriver driver) {
        super(driver);
    }

    public HomePage open() {
        driver.get(TestConfig.BASE_URL + "/");
        return this;
    }

    public boolean isUserLoggedIn() {
        try {
            return waitAndFind(logoutButton).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isLoginLinkVisible() {
        try {
            return waitAndFind(loginLink).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public String getLoggedInUserName() {
        try {
            WebElement heading = waitAndFind(welcomeHeading);
            String headingText = heading.getText();
            if (headingText != null && !headingText.isBlank()) {
                return headingText;
            }
        } catch (Exception ignored) {}

        WebElement nameEl = waitAndFind(userNameSpan);
        String text = nameEl.getText();
        if (text == null || text.isBlank()) {
            text = nameEl.getAttribute("textContent");
        }
        return text != null ? text.trim() : "";
    }

    public boolean isAdminPortalLinkVisible() {
        try {
            return !driver.findElements(adminPortalLink).isEmpty() && driver.findElement(adminPortalLink).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public void clickAdminPortalLink() {
        click(adminPortalLink);
    }

    public void logout() {
        click(logoutButton);
        try {
            click(swalConfirmButton);
        } catch (Exception ignored) {
            // Fallback if confirmation dialog is not rendered
        }
        waitAndFind(loginLink);
    }
}
