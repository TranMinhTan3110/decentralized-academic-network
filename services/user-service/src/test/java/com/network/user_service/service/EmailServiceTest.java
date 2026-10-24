package com.network.user_service.service;

import com.network.user_service.service.impl.EmailServiceImpl;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    private EmailServiceImpl emailService;

    @BeforeEach
    void setUp() {
        emailService = new EmailServiceImpl(mailSender);
    }

    @Test
    @DisplayName("Chạy ở dev mode khi mailSender là null")
    void sendOtpEmail_WhenMailSenderNull_ShouldLogConsoleOnly() {
        EmailServiceImpl devEmailService = new EmailServiceImpl(null);

        assertThatCode(() -> devEmailService.sendOtpEmail("student@dedocu.vn", "123456", "ACCOUNT_ACTIVATION"))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Chạy ở dev mode khi senderEmail trống")
    void sendOtpEmail_WhenSenderEmailBlank_ShouldLogConsoleOnly() {
        ReflectionTestUtils.setField(emailService, "senderEmail", "");

        assertThatCode(() -> emailService.sendOtpEmail("student@dedocu.vn", "123456", "RESET_PASSWORD"))
                .doesNotThrowAnyException();

        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("Gửi email thành công qua JavaMailSender khi đã cấu hình senderEmail")
    void sendOtpEmail_WhenConfigured_ShouldCreateAndSendMimeMessage() {
        ReflectionTestUtils.setField(emailService, "senderEmail", "noreply@dan.edu.vn");
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        assertThatCode(() -> emailService.sendOtpEmail("student@dedocu.vn", "654321", "ACCOUNT_ACTIVATION"))
                .doesNotThrowAnyException();

        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("Bắt lỗi an toàn và ghi log khi JavaMailSender ném ngoại lệ")
    void sendOtpEmail_WhenMailSenderThrowsException_ShouldCatchGracefully() {
        ReflectionTestUtils.setField(emailService, "senderEmail", "noreply@dan.edu.vn");
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new RuntimeException("SMTP Server Unreachable")).when(mailSender).send(any(MimeMessage.class));

        assertThatCode(() -> emailService.sendOtpEmail("student@dedocu.vn", "999888", "RESET_PASSWORD"))
                .doesNotThrowAnyException();

        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }
}
