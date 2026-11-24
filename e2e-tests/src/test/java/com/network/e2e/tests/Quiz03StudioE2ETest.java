package com.network.e2e.tests;

import com.network.e2e.config.DriverFactory;
import com.network.e2e.config.TestConfig;
import com.network.e2e.pages.LoginPage;
import com.network.e2e.pages.QuizPage;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.WebDriver;

import java.io.File;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("03. AI Quiz Studio E2E - Kịch bản Tạo đề, Làm bài & Chấm điểm Trắc nghiệm")
public class Quiz03StudioE2ETest {

    private WebDriver driver;
    private LoginPage loginPage;
    private QuizPage quizPage;

    private File resolveSamplePdf() {
        File pdf = new File("python/test_data/sample_academic.pdf");
        if (pdf.exists()) {
            return pdf;
        }
        return new File("e2e-tests/python/test_data/sample_academic.pdf");
    }

    @BeforeEach
    void setUp() {
        driver = DriverFactory.createDriver();
        loginPage = new LoginPage(driver);
        quizPage = new QuizPage(driver);
    }

    @AfterEach
    void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    @DisplayName("Kiểm tra ràng buộc bắt buộc chọn tài liệu nguồn trên trang /quiz")
    void shouldEnforceMandatorySourceSelectionBeforeGeneratingQuiz() {
        quizPage.open();

        assertThat(quizPage.isLandingVisible()).isTrue();
        assertThat(quizPage.isGenerateButtonEnabled())
                .as("Nút Tạo Đề Thi phải bị vô hiệu hóa khi chưa chọn tài liệu nguồn")
                .isFalse();

        // Tải lên 1 tệp PDF mẫu -> Nút tạo đề phải được mở khóa
        File samplePdf = resolveSamplePdf();
        assertThat(samplePdf.exists())
                .as("Tệp PDF mẫu phải tồn tại để chạy E2E Quiz: " + samplePdf.getAbsolutePath())
                .isTrue();

        quizPage.uploadFile(samplePdf);
        assertThat(quizPage.isSelectedSourceBadgeVisible()).isTrue();
        assertThat(quizPage.isGenerateButtonEnabled())
                .as("Sau khi chọn tài liệu nguồn, nút Tạo Đề Thi phải được kích hoạt")
                .isTrue();

        // Gỡ tài liệu nguồn -> Nút tạo đề bị khóa lại
        quizPage.clearSelectedSource();
        assertThat(quizPage.isGenerateButtonEnabled())
                .as("Sau khi bấm Gỡ tệp, nút Tạo Đề Thi phải bị khóa lại")
                .isFalse();
    }

    @Test
    @DisplayName("Luồng hoàn chỉnh: Đăng nhập -> Chọn tài liệu thư viện -> Tạo đề 5 câu -> Làm bài -> Nộp bài & xem Bảng điểm")
    void shouldGeneratePracticeSubmitAndScoreQuizEndToEnd() {
        loginPage.open();
        loginPage.login(TestConfig.USER_EMAIL, TestConfig.USER_PASSWORD);
        assertThat(loginPage.waitForUrlContains("/explore")).isTrue();

        quizPage.open();
        quizPage.selectFirstLibraryDocument();
        quizPage.selectQuestionCount(5);
        quizPage.selectDifficulty("Cơ bản");

        // Chờ AI / hệ thống biên soạn đề thi (tối đa 60 giây)
        quizPage.clickGenerateAndWaitForReady(60);

        // Chuyển sang giao diện làm bài
        quizPage.startPracticeFromReadyModal();

        int answeredCount = quizPage.answerFirstOptionForAllQuestions();
        assertThat(answeredCount)
                .as("Phải có ít nhất 1 câu hỏi trắc nghiệm được sinh ra và chọn đáp án")
                .isGreaterThan(0);

        // Nộp bài và kiểm tra Bảng điểm
        quizPage.submitQuiz();
        assertThat(quizPage.isScoreSummaryVisible())
                .as("Sau khi nộp bài phải hiển thị Bảng Điểm AI Chính Thức")
                .isTrue();

        // Thoát ra màn hình chính Quiz Studio
        quizPage.exitToLanding();
        assertThat(quizPage.isLandingVisible()).isTrue();
    }
}
