package com.network.user_service.service.impl;

import com.network.user_service.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String senderEmail;

    public EmailServiceImpl(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendOtpEmail(String toEmail, String otpCode, String type) {
        String title = "ACCOUNT_ACTIVATION".equalsIgnoreCase(type)
                ? "Kích hoạt tài khoản"
                : "Đặt lại mật khẩu";

        String subject = "[DAN] " + title + " - Mã xác thực: " + otpCode;

        // In ra console log để phục vụ test ngay trong terminal
        logConsoleOtp(toEmail, otpCode, title);

        // Nếu đã cấu hình tài khoản gửi Gmail SMTP thì tiến hành gửi mail thật
        if (mailSender != null && senderEmail != null && !senderEmail.isBlank()) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

                helper.setFrom(senderEmail, "DAN - Decentralized Academic Network");
                helper.setTo(toEmail);
                helper.setSubject(subject);

                String htmlContent = buildOtpEmailHtml(title, otpCode);
                helper.setText(htmlContent, true);

                mailSender.send(message);
                log.info(">> Đã gửi email OTP thật thành công tới: {}", toEmail);
            } catch (Exception e) {
                log.error(">> Không thể gửi email OTP thật tới {}: {}. Mã OTP vẫn hiển thị trong console log để test.",
                        toEmail, e.getMessage());
            }
        } else {
            log.info(">> [DEV MODE] Chưa cấu hình SPRING_MAIL_USERNAME nên sử dụng mã OTP từ terminal console log.");
        }
    }

    private void logConsoleOtp(String toEmail, String otpCode, String title) {
        System.out.println("=================================================================");
        System.out.println(">> [EMAIL SERVICE] " + title.toUpperCase());
        System.out.println(">> Gửi tới: " + toEmail);
        System.out.println(">> MÃ XÁC THỰC OTP (Hết hạn sau 10 phút): [ " + otpCode + " ]");
        System.out.println("=================================================================");
    }

    private String buildOtpEmailHtml(String title, String otpCode) {
        return """
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
                    .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
                    .header { background: linear-gradient(135deg, #2563eb, #315dff); padding: 32px 24px; text-align: center; color: white; }
                    .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
                    .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
                    .content { padding: 32px 24px; text-align: center; }
                    .otp-box { margin: 24px auto; background: #f0f7ff; border: 2px dashed #93c5fd; border-radius: 12px; padding: 18px 24px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1d4ed8; font-family: monospace; }
                    .note { font-size: 12px; color: #64748b; line-height: 1.6; }
                    .footer { background: #f8fafc; border-top: 1px solid #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="header">
                        <h1>DAN - Mạng Lưới Học Thuật</h1>
                        <p>Decentralized Academic Network</p>
                    </div>
                    <div class="content">
                        <h2 style="font-size: 18px; margin-top: 0; color: #0f172a;">Mã xác thực %s</h2>
                        <p style="font-size: 14px; color: #475569; line-height: 1.5;">Vui lòng sử dụng mã bên dưới để hoàn tất xác thực tài khoản của bạn:</p>
                        <div class="otp-box">%s</div>
                        <p class="note">Mã xác thực này có hiệu lực trong vòng <strong>10 phút</strong>.<br>Vì lý do bảo mật, vui lòng không cung cấp mã này cho người khác.</p>
                    </div>
                    <div class="footer">
                        Email này được gửi tự động từ hệ thống DAN. Vui lòng không trả lời thư này.
                    </div>
                </div>
            </body>
            </html>
            """.formatted(title, otpCode);
    }
}
