package com.network.e2e.pages;

import com.network.e2e.config.TestConfig;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.io.File;
import java.time.Duration;
import java.util.List;

public class QuizPage extends BasePage {

    private final By pageHeading = By.xpath("//h1[contains(normalize-space(.), 'Tạo Đề Thi Trắc Nghiệm')]");
    private final By fileInput = By.cssSelector("input[type='file']");
    private final By librarySelect = By.cssSelector("select");
    private final By generateButton = By.xpath("//button[.//span[contains(normalize-space(.), 'Tạo Đề Thi Trắc Nghiệm Ngay') or contains(normalize-space(.), 'Đang tạo đề thi')]]");
    private final By clearSourceButton = By.xpath("//button[.//span[contains(normalize-space(.), 'Gỡ tệp')]]");
    private final By selectedSourceBadge = By.xpath("//*[contains(normalize-space(.), 'Đã gắn tài liệu nguồn')]");

    private final By readyModalHeading = By.xpath("//h2[contains(normalize-space(.), 'Bộ Đề Thi AI Sẵn Sàng')]");
    private final By startPracticeButton = By.xpath("//button[contains(normalize-space(.), '1. Làm bài thi ngay trên Web')]");

    private final By questionCards = By.xpath("//div[contains(@class, 'rounded-3xl') and .//h2[contains(normalize-space(.), 'Câu ')]]");
    private final By submitQuizButton = By.xpath("//button[contains(normalize-space(.), 'Nộp bài kiểm tra ngay')]");
    private final By scoreBadge = By.xpath("//*[contains(normalize-space(.), 'Bảng Điểm AI Chính Thức')]");
    private final By exitToLandingButton = By.xpath("//button[.//span[contains(normalize-space(.), 'Thoát ra chọn đề khác')]]");
    private final By historyHeading = By.xpath("//h2[contains(normalize-space(.), 'Lịch Sử Ôn Luyện Trắc Nghiệm')]");

    public QuizPage(WebDriver driver) {
        super(driver);
    }

    public QuizPage open() {
        driver.get(TestConfig.BASE_URL + "/quiz");
        waitAndFind(pageHeading);
        return this;
    }

    public boolean isLandingVisible() {
        try {
            return waitAndFind(pageHeading).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isGenerateButtonEnabled() {
        return waitAndFind(generateButton).isEnabled();
    }

    public boolean isSelectedSourceBadgeVisible() {
        try {
            return waitAndFind(selectedSourceBadge).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public void selectFirstLibraryDocument() {
        WebElement selectEl = waitAndFind(librarySelect);
        wait.until(d -> new Select(d.findElement(librarySelect)).getOptions().size() > 1);
        new Select(selectEl).selectByIndex(1);
    }

    public void uploadFile(File file) {
        WebElement input = wait.until(ExpectedConditions.presenceOfElementLocated(fileInput));
        input.sendKeys(file.getAbsolutePath());
        waitAndFind(selectedSourceBadge);
    }

    public void clearSelectedSource() {
        click(clearSourceButton);
    }

    public void selectQuestionCount(int count) {
        By countBtn = By.xpath("//button[normalize-space(.)='" + count + " câu']");
        click(countBtn);
    }

    public void selectDifficulty(String label) {
        By diffBtn = By.xpath("//button[normalize-space(.)='" + label + "']");
        click(diffBtn);
    }

    public void clickGenerateAndWaitForReady(int timeoutSeconds) {
        click(generateButton);
        WebDriverWait longWait = new WebDriverWait(driver, Duration.ofSeconds(timeoutSeconds));
        longWait.until(ExpectedConditions.visibilityOfElementLocated(readyModalHeading));
    }

    public void startPracticeFromReadyModal() {
        click(startPracticeButton);
        waitAndFind(submitQuizButton);
    }

    public int answerFirstOptionForAllQuestions() {
        List<WebElement> cards = driver.findElements(questionCards);
        int answered = 0;
        for (WebElement card : cards) {
            List<WebElement> options = card.findElements(By.cssSelector("button[type='button']"));
            if (!options.isEmpty()) {
                WebElement firstOpt = options.get(0);
                try {
                    firstOpt.click();
                } catch (Exception e) {
                    ((org.openqa.selenium.JavascriptExecutor) driver).executeScript("arguments[0].click();", firstOpt);
                }
                answered++;
            }
        }
        return answered;
    }

    public void submitQuiz() {
        click(submitQuizButton);
        WebDriverWait submitWait = new WebDriverWait(driver, Duration.ofSeconds(20));
        submitWait.until(ExpectedConditions.visibilityOfElementLocated(scoreBadge));
    }

    public boolean isScoreSummaryVisible() {
        try {
            return waitAndFind(scoreBadge).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public void exitToLanding() {
        click(exitToLandingButton);
        waitAndFind(historyHeading);
    }
}
