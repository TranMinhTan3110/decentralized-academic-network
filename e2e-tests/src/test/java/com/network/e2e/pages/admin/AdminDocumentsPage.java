package com.network.e2e.pages.admin;

import com.network.e2e.config.TestConfig;
import com.network.e2e.pages.BasePage;
import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

public class AdminDocumentsPage extends BasePage {

    private final By headingLocator = By.xpath("//*[self::h1 or self::h2 or @role='heading'][contains(.,'Quản lý bài đăng') or contains(.,'quản lý bài đăng')]");
    private final By searchInputLocator = By.xpath("//input[contains(@placeholder,'Tìm') or contains(@placeholder,'tiêu đề')]");

    public AdminDocumentsPage(WebDriver driver) {
        super(driver);
    }

    public void open() {
        driver.get(TestConfig.BASE_URL + "/admin/documents");
    }

    public boolean isDocumentsLoaded() {
        try {
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
        el.sendKeys(keyword);
    }

    public boolean isDocumentPresentInTable(String text) {
        try {
            By docLocator = By.xpath("//*[contains(.,'" + text + "')]");
            return waitAndFind(docLocator).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }
}
