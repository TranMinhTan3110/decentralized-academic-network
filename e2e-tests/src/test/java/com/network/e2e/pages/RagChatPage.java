package com.network.e2e.pages;

import com.network.e2e.config.TestConfig;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.StaleElementReferenceException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;

public class RagChatPage extends BasePage {

    private static final String CHAT_STORAGE_KEY = "dedocu_ai_chat_sessions_v4";

    // =========================================================================
    // LOCATORS: VIEW 1 - LANDING VIEW
    // =========================================================================
    private final By landingHeading = By.xpath("//h1[contains(normalize-space(), 'Trợ Lý Học Thuật AI - DeDocu')]");
    private final By landingDropzoneHeading = By.xpath("//h3[contains(normalize-space(), 'Kéo & Thả tài liệu học tập vào đây')]");
    private final By landingFileInput = By.cssSelector("input[type='file'][accept='.pdf,.doc,.docx,.txt']");
    private final By landingQuestionInput = By.cssSelector("input[placeholder*='Hỏi tôi bất kỳ điều gì']");
    private final By landingSubmitButton = By.cssSelector("button[aria-label='Gửi câu hỏi']");

    private final By historyCountBadge = By.xpath("//h2[.//span[normalize-space()='Lịch sử đoạn chat']]/ancestor::div[1]/following-sibling::span");
    private final By emptyHistoryHeading = By.xpath("//h3[normalize-space()='Chưa có đoạn chat nào']");

    // =========================================================================
    // LOCATORS: VIEW 2 - WORKSPACE VIEW
    // =========================================================================
    private final By backToAllChatsButton = By.xpath("//button[.//span[normalize-space()='Tất cả đoạn chat']]");
    private final By newChatButton = By.xpath("//button[.//span[normalize-space()='Đoạn chat mới']]");
    private final By resetChatButton = By.cssSelector("button[title='Xóa tin nhắn trong phiên này']");
    private final By workspaceTopTitle = By.xpath("//button[.//span[normalize-space()='Tất cả đoạn chat']]/following-sibling::div//h1");

    private final By sidebarSourcesCount = By.xpath("//aside//h2[.//span[normalize-space()='Tài liệu học tập']]/following-sibling::span");
    private final By sidebarEmptySourcesText = By.xpath("//aside//p[contains(normalize-space(), 'Chưa có tệp tài liệu nào đính kèm')]");
    private final By sidebarFileInput = By.cssSelector("aside input[type='file']");
    private final By sidebarDeleteSourceButtons = By.cssSelector("aside button[title='Xóa tệp nguồn này']");

    private final By emptyConversationHeading = By.xpath("//main//h3[normalize-space()='Bắt đầu hội thoại nghiên cứu']");
    private final By userMessageBubbles = By.cssSelector("main div.items-end > div.rounded-2xl > div.whitespace-pre-line");
    private final By assistantMessageBubbles = By.cssSelector("main div.items-start > div.rounded-2xl > div.whitespace-pre-line");
    private final By aiLoadingIndicator = By.xpath("//main//span[contains(normalize-space(), 'Trợ lý AI đang quét tài liệu')]");

    private final By citationToggleButtons = By.xpath("//main//button[.//span[contains(normalize-space(), 'Trích dẫn từ nguồn')]]");
    private final By citationPageBadges = By.xpath("//main//span[starts-with(normalize-space(), 'Trang ')]");

    private final By searchDocsModeButton = By.cssSelector("button[title='Bật/Tắt chế độ tìm kiếm tài liệu học thuật trong hệ thống']");
    private final By focusUploadModeButton = By.cssSelector("button[title='Bật/Tắt chế độ tập trung vào tệp tài liệu đã tải lên']");
    private final By modeStatusHint = By.xpath("//button[@title='Bật/Tắt chế độ tập trung vào tệp tài liệu đã tải lên']/parent::div/following-sibling::span");

    private final By workspaceChatTextarea = By.cssSelector("textarea[placeholder='Bạn muốn tìm hiểu thêm điều gì?']");
    private final By workspaceSendButton = By.cssSelector("button[title='Gửi câu hỏi']");

    // =========================================================================
    // LOCATORS: CONFIRM MODAL & TOASTS
    // =========================================================================
    private final By confirmDialog = By.cssSelector("div[role='dialog'][aria-modal='true']");
    private final By confirmDeleteButton = By.xpath("//div[@role='dialog']//button[normalize-space()='Xác nhận xóa']");
    private final By cancelDeleteButton = By.xpath("//div[@role='dialog']//button[normalize-space()='Hủy bỏ']");
    private final By sonnerToasts = By.cssSelector("[data-sonner-toast]");

    private final WebDriverWait aiWait;

    public RagChatPage(WebDriver driver) {
        super(driver);
        this.aiWait = (WebDriverWait) new WebDriverWait(driver, Duration.ofSeconds(45))
                .ignoring(StaleElementReferenceException.class);
    }

    public RagChatPage open() {
        driver.get(TestConfig.BASE_URL + "/chat");
        waitAndFind(landingHeading);
        return this;
    }

    public RagChatPage openCleanSession() {
        driver.get(TestConfig.BASE_URL + "/chat");
        waitAndFind(landingHeading);
        ((JavascriptExecutor) driver).executeScript(
                "window.localStorage.removeItem(arguments[0]);", CHAT_STORAGE_KEY);
        driver.navigate().refresh();
        waitAndFind(landingHeading);
        return this;
    }

    // =========================================================================
    // ACTIONS & QUERIES: LANDING VIEW
    // =========================================================================

    public boolean isOnLandingView() {
        try {
            return waitAndFind(landingHeading).isDisplayed()
                    && waitAndFind(landingDropzoneHeading).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public String getLandingHeadingText() {
        return waitAndFind(landingHeading).getText().trim();
    }

    public void attachFileOnLanding(String absoluteFilePath) {
        WebElement fileInput = wait.until(ExpectedConditions.presenceOfElementLocated(landingFileInput));
        fileInput.sendKeys(absoluteFilePath);
    }

    public boolean isLandingFileChipVisible(String fileName) {
        By chipLocator = By.xpath("//span[contains(@class,'truncate') and normalize-space()='" + fileName + "']");
        try {
            return waitAndFind(chipLocator).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public void enterLandingQuestion(String question) {
        type(landingQuestionInput, question);
    }

    public void clickLandingSubmit() {
        click(landingSubmitButton);
    }

    public void submitQuestionFromLanding(String question) {
        enterLandingQuestion(question);
        clickLandingSubmit();
    }

    public boolean waitForToastContaining(String expectedSubstring) {
        try {
            WebDriverWait toastWait = new WebDriverWait(driver, Duration.ofSeconds(8));
            return toastWait.until(d -> d.findElements(sonnerToasts).stream()
                    .anyMatch(el -> el.isDisplayed() && el.getText().contains(expectedSubstring)));
        } catch (Exception e) {
            return false;
        }
    }

    public String getHistoryCountBadgeText() {
        return waitAndFind(historyCountBadge).getText().trim();
    }

    public boolean isEmptyHistoryVisible() {
        try {
            return waitAndFind(emptyHistoryHeading).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isSessionInHistory(String titleSubstring) {
        By cardHeading = By.xpath("//h3[contains(normalize-space(), '" + titleSubstring + "')]");
        try {
            return waitAndFind(cardHeading).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public void openSessionFromHistory(String titleSubstring) {
        By cardLocator = By.xpath("//h3[contains(normalize-space(), '" + titleSubstring + "')]/ancestor::div[contains(@class, 'cursor-pointer')][1]");
        click(cardLocator);
        waitForWorkspaceView();
    }

    public void clickDeleteSessionInHistory(String titleSubstring) {
        By deleteBtn = By.xpath("//h3[contains(normalize-space(), '" + titleSubstring + "')]/ancestor::div[contains(@class, 'cursor-pointer')][1]//button[@aria-label='Xóa đoạn chat']");
        click(deleteBtn);
    }

    // =========================================================================
    // ACTIONS & QUERIES: WORKSPACE VIEW
    // =========================================================================

    public boolean waitForWorkspaceView() {
        try {
            WebDriverWait workspaceWait = new WebDriverWait(driver, Duration.ofSeconds(25));
            return workspaceWait.until(ExpectedConditions.visibilityOfElementLocated(backToAllChatsButton)).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public String getWorkspaceSessionTitle() {
        return waitAndFind(workspaceTopTitle).getText().trim();
    }

    public String getSidebarSourcesCountText() {
        return waitAndFind(sidebarSourcesCount).getText().trim();
    }

    public boolean isSourceListedInSidebar(String fileName) {
        By sourceItem = By.xpath("//aside//span[normalize-space()='" + fileName + "']");
        try {
            return waitAndFind(sourceItem).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isSidebarSourcesEmpty() {
        try {
            return waitAndFind(sidebarEmptySourcesText).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public void attachFileInWorkspace(String absoluteFilePath) {
        WebElement fileInput = wait.until(ExpectedConditions.presenceOfElementLocated(sidebarFileInput));
        fileInput.sendKeys(absoluteFilePath);
    }

    public void deleteFirstSourceInSidebar() {
        click(sidebarDeleteSourceButtons);
    }

    public List<String> getUserMessages() {
        return driver.findElements(userMessageBubbles).stream()
                .map(el -> el.getText().trim())
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    public List<String> getAssistantMessages() {
        return driver.findElements(assistantMessageBubbles).stream()
                .map(el -> el.getText().trim())
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    public String waitForAssistantReply(int expectedAssistantMessageCount) {
        aiWait.until(d -> {
            try {
                List<WebElement> loadingEls = d.findElements(aiLoadingIndicator);
                if (!loadingEls.isEmpty() && loadingEls.get(0).isDisplayed()) {
                    return false;
                }
                List<WebElement> replies = d.findElements(assistantMessageBubbles);
                if (replies.size() < expectedAssistantMessageCount) {
                    return false;
                }
                String latestText = replies.get(replies.size() - 1).getText();
                return latestText != null && !latestText.trim().isEmpty();
            } catch (StaleElementReferenceException e) {
                return false;
            }
        });
        List<String> messages = getAssistantMessages();
        return messages.get(messages.size() - 1);
    }

    public boolean hasCitationToggle() {
        return !driver.findElements(citationToggleButtons).isEmpty()
                && driver.findElements(citationToggleButtons).get(0).isDisplayed();
    }

    public String expandFirstCitationAndGetPageBadge() {
        click(citationToggleButtons);
        return waitAndFind(citationPageBadges).getText().trim();
    }

    public void toggleSearchDocsMode() {
        click(searchDocsModeButton);
    }

    public void toggleFocusUploadMode() {
        click(focusUploadModeButton);
    }

    public String getModeStatusHintText() {
        WebElement el = waitAndFind(modeStatusHint);
        String text = el.getText();
        if (text == null || text.isBlank()) {
            text = el.getAttribute("textContent");
        }
        return text != null ? text.trim() : "";
    }

    public void sendFollowUpQuestion(String question) {
        type(workspaceChatTextarea, question);
        click(workspaceSendButton);
    }

    public void clickResetChatButton() {
        click(resetChatButton);
    }

    public boolean isEmptyConversationPlaceholderVisible() {
        try {
            return waitAndFind(emptyConversationHeading).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public void clickBackToAllChats() {
        click(backToAllChatsButton);
        waitAndFind(landingHeading);
    }

    public void clickNewChatButton() {
        click(newChatButton);
        waitAndFind(landingHeading);
    }

    // =========================================================================
    // ACTIONS: CONFIRM MODAL
    // =========================================================================

    public boolean isConfirmModalVisible() {
        try {
            return waitAndFind(confirmDialog).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public void confirmModalDelete() {
        click(confirmDeleteButton);
        wait.until(ExpectedConditions.invisibilityOfElementLocated(confirmDialog));
    }

    public void cancelModalDelete() {
        click(cancelDeleteButton);
        wait.until(ExpectedConditions.invisibilityOfElementLocated(confirmDialog));
    }
}
