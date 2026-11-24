package com.network.e2e.tests;

import com.network.e2e.config.DriverFactory;
import com.network.e2e.pages.RagChatPage;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.openqa.selenium.WebDriver;

import java.net.URISyntaxException;
import java.net.URL;
import java.nio.file.Paths;
import java.util.Objects;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("02. AI Assistant E2E - Kịch bản Trợ lý Học thuật AI (RAG Chat)")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class Ai01RagChatE2ETest {

    private static final String SAMPLE_PDF_NAME = "sample_ai_study.pdf";

    private WebDriver driver;
    private RagChatPage ragChatPage;
    private String samplePdfAbsolutePath;

    @BeforeEach
    void setUp() throws URISyntaxException {
        URL resource = Objects.requireNonNull(
                getClass().getClassLoader().getResource(SAMPLE_PDF_NAME),
                "Không tìm thấy tệp mẫu " + SAMPLE_PDF_NAME + " trong src/test/resources"
        );
        samplePdfAbsolutePath = Paths.get(resource.toURI()).toAbsolutePath().toString();

        driver = DriverFactory.createDriver();
        ragChatPage = new RagChatPage(driver);
        ragChatPage.openCleanSession();
    }

    @AfterEach
    void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    @Order(1)
    @DisplayName("TC01: Hiển thị đúng giao diện Landing ban đầu & Chặn gửi khi chưa nhập câu hỏi hoặc tệp")
    void shouldDisplayLandingAndValidateEmptySubmission() {
        assertThat(ragChatPage.isOnLandingView())
                .as("Trang /chat phải mở ở chế độ Landing View")
                .isTrue();

        assertThat(ragChatPage.getLandingHeadingText())
                .contains("Trợ Lý Học Thuật AI - DeDocu");

        assertThat(ragChatPage.getHistoryCountBadgeText())
                .isEqualTo("0 đoạn chat");

        assertThat(ragChatPage.isEmptyHistoryVisible())
                .as("Khi chưa tạo phiên nào, phải hiển thị trạng thái trống ở Lịch sử đoạn chat")
                .isTrue();

        // Bấm gửi khi chưa nhập câu hỏi và chưa chọn file
        ragChatPage.clickLandingSubmit();

        assertThat(ragChatPage.waitForToastContaining("Vui lòng nhập câu hỏi hoặc chọn tệp tải lên"))
                .as("Phải hiển thị thông báo nhắc người dùng nhập câu hỏi hoặc tải tệp")
                .isTrue();

        assertThat(ragChatPage.isOnLandingView())
                .as("Trình duyệt vẫn phải giữ nguyên ở màn hình Landing")
                .isTrue();
    }

    @Test
    @Order(2)
    @DisplayName("TC02: Đặt câu hỏi học thuật từ Landing -> Chuyển sang Workspace & Nhận câu trả lời từ AI")
    void shouldAskAcademicQuestionAndReceiveAiResponse() {
        String question = "Giải thích ngắn gọn mô hình Agile và Scrum trong kỹ thuật phần mềm";

        ragChatPage.submitQuestionFromLanding(question);

        assertThat(ragChatPage.waitForWorkspaceView())
                .as("Sau khi gửi câu hỏi từ Landing, phải chuyển sang giao diện Workspace")
                .isTrue();

        assertThat(ragChatPage.getWorkspaceSessionTitle())
                .contains("Giải thích ngắn gọn mô hình Agile");

        assertThat(ragChatPage.getModeStatusHintText())
                .contains("Chế độ trò chuyện & giải thích ngắn gọn");

        assertThat(ragChatPage.getUserMessages())
                .as("Bong bóng tin nhắn của người dùng phải hiển thị đúng câu hỏi vừa gửi")
                .containsExactly(question);

        String aiReply = ragChatPage.waitForAssistantReply(1);
        assertThat(aiReply)
                .as("Trợ lý AI phải trả về nội dung phản hồi không rỗng")
                .isNotBlank()
                .hasSizeGreaterThan(20);
    }

    @Test
    @Order(3)
    @DisplayName("TC03: Đính kèm tệp PDF học tập ở Landing -> Tự động bật chế độ Tập trung tài liệu & Trả lời RAG")
    void shouldUploadPdfAndAnswerWithDocumentFocus() {
        ragChatPage.attachFileOnLanding(samplePdfAbsolutePath);

        assertThat(ragChatPage.isLandingFileChipVisible(SAMPLE_PDF_NAME))
                .as("Chip tên tệp PDF phải xuất hiện ngay sau khi chọn tệp ở Landing")
                .isTrue();

        String question = "Tóm tắt các vai trò và sự kiện chính của Scrum trong tài liệu này";
        ragChatPage.submitQuestionFromLanding(question);

        assertThat(ragChatPage.waitForWorkspaceView())
                .as("Sau khi nạp tệp PDF và gửi câu hỏi, phải chuyển sang Workspace")
                .isTrue();

        assertThat(ragChatPage.getSidebarSourcesCountText())
                .isEqualTo("1 tệp");

        assertThat(ragChatPage.isSourceListedInSidebar(SAMPLE_PDF_NAME))
                .as("Thanh bên trái phải liệt kê đúng tên tệp PDF đã tải lên")
                .isTrue();

        assertThat(ragChatPage.getModeStatusHintText())
                .as("Khi có tệp đính kèm, chế độ phải tự động chuyển sang Tập trung vào tài liệu")
                .contains("Tập trung phân tích tệp tài liệu tải lên");

        String aiReply = ragChatPage.waitForAssistantReply(1);
        assertThat(aiReply)
                .as("Trợ lý AI phải sinh câu trả lời dựa trên tài liệu tải lên")
                .isNotBlank();

        if (ragChatPage.hasCitationToggle()) {
            String pageBadge = ragChatPage.expandFirstCitationAndGetPageBadge();
            assertThat(pageBadge)
                    .as("Thẻ trích dẫn nguồn phải hiển thị số trang tài liệu")
                    .startsWith("Trang ");
        }
    }

    @Test
    @Order(4)
    @DisplayName("TC04: Chuyển đổi qua lại các chế độ Chat, Thêm/Xóa nguồn tài liệu & Hỏi nối tiếp trong Workspace")
    void shouldToggleModesManageWorkspaceSourcesAndSendFollowUp() {
        String firstQuestion = "Khái niệm Sprint trong Scrum là gì?";
        ragChatPage.submitQuestionFromLanding(firstQuestion);
        assertThat(ragChatPage.waitForWorkspaceView()).isTrue();
        ragChatPage.waitForAssistantReply(1);

        // 1. Kiểm tra chuyển đổi qua lại các chế độ chat
        ragChatPage.toggleSearchDocsMode();
        assertThat(ragChatPage.getModeStatusHintText())
                .contains("Tìm & gợi ý tài liệu học thuật");

        ragChatPage.toggleFocusUploadMode();
        assertThat(ragChatPage.getModeStatusHintText())
                .contains("Tập trung phân tích tệp tài liệu tải lên");

        ragChatPage.toggleFocusUploadMode();
        assertThat(ragChatPage.getModeStatusHintText())
                .contains("Chế độ trò chuyện & giải thích ngắn gọn");

        // 2. Thêm tệp nguồn trực tiếp từ cột trái của Workspace
        ragChatPage.attachFileInWorkspace(samplePdfAbsolutePath);
        assertThat(ragChatPage.isSourceListedInSidebar(SAMPLE_PDF_NAME))
                .as("Tệp đính kèm thêm trong Workspace phải hiển thị ở cột trái")
                .isTrue();
        assertThat(ragChatPage.getSidebarSourcesCountText()).isEqualTo("1 tệp");

        // 3. Gửi câu hỏi nối tiếp (Follow-up) trong ô textarea của Workspace
        String secondQuestion = "Product Owner có trách nhiệm gì trong nhóm Scrum?";
        ragChatPage.sendFollowUpQuestion(secondQuestion);

        String secondReply = ragChatPage.waitForAssistantReply(2);
        assertThat(ragChatPage.getUserMessages())
                .containsExactly(firstQuestion, secondQuestion);
        assertThat(secondReply).isNotBlank();

        // 4. Xóa tệp nguồn khỏi cột trái
        ragChatPage.deleteFirstSourceInSidebar();
        assertThat(ragChatPage.isSidebarSourcesEmpty())
                .as("Sau khi xóa tệp duy nhất, cột trái phải báo chưa có tệp đính kèm")
                .isTrue();
        assertThat(ragChatPage.getSidebarSourcesCountText()).isEqualTo("0 tệp");
    }

    @Test
    @Order(5)
    @DisplayName("TC05: Quản lý phiên chat: Làm mới tin nhắn trong phiên, Lưu lịch sử sau F5 & Xóa khỏi lịch sử")
    void shouldResetMessagesPersistAcrossReloadAndDeleteSessionFromHistory() {
        String sessionQuestion = "Ôn tập kiến thức kiểm thử phần mềm tự động";
        ragChatPage.submitQuestionFromLanding(sessionQuestion);
        assertThat(ragChatPage.waitForWorkspaceView()).isTrue();
        ragChatPage.waitForAssistantReply(1);

        // 1. Bấm Xóa chat trong Workspace -> Xác nhận ở ConfirmModal -> Làm sạch tin nhắn
        ragChatPage.clickResetChatButton();
        assertThat(ragChatPage.isConfirmModalVisible())
                .as("Hộp thoại xác nhận làm mới đoạn chat phải hiển thị")
                .isTrue();
        ragChatPage.confirmModalDelete();

        assertThat(ragChatPage.isEmptyConversationPlaceholderVisible())
                .as("Sau khi xóa tin nhắn trong phiên, khung chat phải về trạng thái trống ban đầu")
                .isTrue();

        // 2. Quay về Tất cả đoạn chat -> Kiểm tra lịch sử lưu bền vững sau khi Reload (F5)
        ragChatPage.clickBackToAllChats();
        assertThat(ragChatPage.getHistoryCountBadgeText()).isEqualTo("1 đoạn chat");
        assertThat(ragChatPage.isSessionInHistory(sessionQuestion)).isTrue();

        driver.navigate().refresh();
        assertThat(ragChatPage.isOnLandingView()).isTrue();
        assertThat(ragChatPage.getHistoryCountBadgeText())
                .as("Sau khi F5 tải lại trang, phiên chat vẫn phải được giữ nguyên trong lịch sử")
                .isEqualTo("1 đoạn chat");

        // 3. Mở lại phiên chat từ lịch sử rồi quay ra xóa hẳn phiên chat
        ragChatPage.openSessionFromHistory(sessionQuestion);
        assertThat(ragChatPage.getWorkspaceSessionTitle()).contains(sessionQuestion);

        ragChatPage.clickBackToAllChats();
        ragChatPage.clickDeleteSessionInHistory(sessionQuestion);
        assertThat(ragChatPage.isConfirmModalVisible())
                .as("Hộp thoại xác nhận xóa phiên chat khỏi lịch sử phải hiển thị")
                .isTrue();
        ragChatPage.confirmModalDelete();

        assertThat(ragChatPage.getHistoryCountBadgeText()).isEqualTo("0 đoạn chat");
        assertThat(ragChatPage.isEmptyHistoryVisible()).isTrue();
    }
}
