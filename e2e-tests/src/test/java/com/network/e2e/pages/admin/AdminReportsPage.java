package com.network.e2e.pages.admin;

import com.network.e2e.config.TestConfig;
import com.network.e2e.pages.BasePage;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class AdminReportsPage extends BasePage {

    private final By headingLocator = By.xpath("//*[self::h1 or self::h2 or @role='heading'][contains(.,'báo cáo') or contains(.,'Báo cáo')] | //div[contains(text(),'báo cáo vi phạm') or contains(text(),'Báo cáo vi phạm')]");
    private final By confirmButtonLocator = By.xpath("//button[contains(.,'Xác nhận vi phạm & Gỡ bỏ') or contains(.,'vi phạm')]");
    private final By modalConfirmSubmitLocator = By.xpath("//div[@role='dialog']//button[contains(.,'Gỡ bỏ') or contains(.,'gỡ bỏ') or contains(.,'Xác nhận')]");
    private final By confirmedBadgeLocator = By.xpath("//*[contains(.,'Đã xác nhận & gỡ bỏ') or contains(.,'Đã xác nhận')]");

    public AdminReportsPage(WebDriver driver) {
        super(driver);
    }

    public void open() {
        driver.get(TestConfig.BASE_URL + "/admin/reports");
    }

    public boolean isReportsLoaded() {
        try {
            return waitAndFind(headingLocator).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public void clickConfirmAndRemoveFirstReport() {
        click(confirmButtonLocator);
        click(modalConfirmSubmitLocator);
    }

    public boolean isReportConfirmedBadgeVisible() {
        try {
            return waitAndFind(confirmedBadgeLocator).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }
}
