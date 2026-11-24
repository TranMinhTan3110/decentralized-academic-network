package com.network.e2e.pages.admin;

import com.network.e2e.config.TestConfig;
import com.network.e2e.pages.BasePage;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;

public class AdminReportsPage extends BasePage {

    private final By headingLocator = By.xpath("//*[self::h1 or self::h2 or @role='heading'][contains(.,'báo cáo') or contains(.,'Báo cáo')] | //div[contains(text(),'báo cáo vi phạm') or contains(text(),'Báo cáo vi phạm')]");
    private final By loadingBadgeLocator = By.xpath("//span[contains(@class,'animate-pulse') and contains(.,'Đang tải')]");
    private final By confirmButtonLocator = By.xpath("//button[.//span[contains(text(),'Xác nhận vi phạm & Gỡ bỏ')] or contains(.,'Xác nhận vi phạm & Gỡ bỏ')]");
    private final By modalConfirmSubmitLocator = By.xpath("//div[@role='dialog']//button[contains(.,'Xác nhận & Gỡ bỏ') or contains(.,'Gỡ bỏ')]");
    private final By confirmedBadgeLocator = By.xpath("//*[contains(.,'Đã xác nhận & gỡ bỏ')]");

    public AdminReportsPage(WebDriver driver) {
        super(driver);
    }

    public void open() {
        driver.get(TestConfig.BASE_URL + "/admin/reports");
        waitForReportsSettled();
    }

    public void waitForReportsSettled() {
        waitAndFind(headingLocator);
        try {
            wait.until(ExpectedConditions.invisibilityOfElementLocated(loadingBadgeLocator));
        } catch (Exception ignored) {
        }
    }

    public boolean isReportsLoaded() {
        try {
            waitForReportsSettled();
            return waitAndFind(headingLocator).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public void clickConfirmAndRemoveFirstReport() {
        waitForReportsSettled();
        click(confirmButtonLocator);
        click(modalConfirmSubmitLocator);
        pauseForBackendSync();
    }

    public void clickConfirmAndRemoveReportByTitle(String docTitle) {
        waitForReportsSettled();
        if (docTitle != null && !docTitle.isBlank() && !docTitle.contains("'")) {
            By specificBtn = By.xpath(
                    "//div[.//h2[contains(.,'" + docTitle + "')]]//button[contains(.,'Xác nhận vi phạm & Gỡ bỏ')]"
            );
            if (!driver.findElements(specificBtn).isEmpty()) {
                click(specificBtn);
                click(modalConfirmSubmitLocator);
                pauseForBackendSync();
                return;
            }
        }
        clickConfirmAndRemoveFirstReport();
    }

    public boolean isReportConfirmedBadgeVisible() {
        try {
            return waitAndFind(confirmedBadgeLocator).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    private void pauseForBackendSync() {
        try {
            Thread.sleep(1000);
        } catch (InterruptedException ignored) {
            Thread.currentThread().interrupt();
        }
    }
}
