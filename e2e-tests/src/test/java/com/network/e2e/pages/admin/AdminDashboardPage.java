package com.network.e2e.pages.admin;

import com.network.e2e.config.TestConfig;
import com.network.e2e.pages.BasePage;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;

public class AdminDashboardPage extends BasePage {

    private final By headingLocator = By.xpath("//*[self::h1 or self::h2 or @role='heading'][contains(.,'Tổng quan') or contains(.,'tổng quan')]");
    private final By reportsLinkLocator = By.xpath("//a[contains(@href,'/admin/reports')]");
    private final By documentsLinkLocator = By.xpath("//a[contains(@href,'/admin/documents')]");

    public AdminDashboardPage(WebDriver driver) {
        super(driver);
    }

    public void open() {
        driver.get(TestConfig.BASE_URL + "/login");
        try {
            ((JavascriptExecutor) driver).executeScript(
                    "window.localStorage.setItem('accessToken', 'mock-admin-token');" +
                    "window.localStorage.setItem('user', JSON.stringify({" +
                    "  id: '20000000-0000-0000-0000-000000000001'," +
                    "  role: 'ADMIN'," +
                    "  email: 'admin.phat@dedocu.vn'," +
                    "  fullName: 'Admin Phat'," +
                    "  username: 'admin.phat'" +
                    "}));"
            );
        } catch (Exception ignored) {
        }
        driver.get(TestConfig.BASE_URL + "/admin");
    }

    public boolean isDashboardLoaded() {
        try {
            return waitAndFind(headingLocator).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public void navigateToReports() {
        click(reportsLinkLocator);
    }

    public void navigateToDocuments() {
        click(documentsLinkLocator);
    }
}
