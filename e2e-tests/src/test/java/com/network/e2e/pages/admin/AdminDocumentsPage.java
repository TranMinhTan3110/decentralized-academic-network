package com.network.e2e.pages.admin;

import com.network.e2e.config.TestConfig;
import com.network.e2e.pages.BasePage;
import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;

public class AdminDocumentsPage extends BasePage {

    private final By headingLocator = By.xpath("//*[self::h1 or self::h2 or @role='heading'][contains(.,'Quản lý bài đăng') or contains(.,'quản lý bài đăng')]");
    private final By searchInputLocator = By.xpath("//input[contains(@placeholder,'Tìm') or contains(@placeholder,'tiêu đề')]");
    private final By loadingTextLocator = By.xpath("//*[contains(text(),'Đang tải dữ liệu...')]");

    public AdminDocumentsPage(WebDriver driver) {
        super(driver);
    }

    public void open() {
        driver.get(TestConfig.BASE_URL + "/admin/documents");
        waitForDocumentsSettled();
    }

    public void waitForDocumentsSettled() {
        waitAndFind(headingLocator);
        try {
            wait.until(ExpectedConditions.invisibilityOfElementLocated(loadingTextLocator));
        } catch (Exception ignored) {
        }
    }

    public boolean isDocumentsLoaded() {
        try {
            waitForDocumentsSettled();
            return waitAndFind(headingLocator).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public void filterByStatus(String tabName) {
        By tabLocator = By.xpath("//button[contains(.,'" + tabName + "')]");
        click(tabLocator);
    }

    public void searchDocument(String keyword) {
        WebElement el = waitAndFind(searchInputLocator);
        el.sendKeys(Keys.chord(Keys.CONTROL, "a"), Keys.BACK_SPACE);
        if (keyword != null && !keyword.isEmpty()) {
            el.sendKeys(keyword);
        }
        try {
            Thread.sleep(700);
        } catch (InterruptedException ignored) {
            Thread.currentThread().interrupt();
        }
        waitForDocumentsSettled();
    }

    public boolean isDocumentPresentInTable(String text) {
        try {
            String safeSnippet = sanitizeXpathText(text);
            By docLocator = By.xpath("//tbody//*[contains(.,'" + safeSnippet + "')]");
            return waitAndFind(docLocator).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    private String sanitizeXpathText(String raw) {
        if (raw == null) return "";
        String cleaned = raw.trim();
        int quoteIdx = cleaned.indexOf('\'');
        if (quoteIdx > 0) {
            cleaned = cleaned.substring(0, quoteIdx).trim();
        } else if (quoteIdx == 0 && cleaned.length() > 1) {
            cleaned = cleaned.substring(1).replace("'", "").trim();
        }
        if (cleaned.length() > 35) {
            cleaned = cleaned.substring(0, 35).trim();
        }
        return cleaned;
    }
}
