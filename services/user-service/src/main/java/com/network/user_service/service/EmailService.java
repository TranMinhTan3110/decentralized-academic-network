package com.network.user_service.service;

public interface EmailService {
    /**
     * Gửi mã OTP xác thực (kích hoạt tài khoản hoặc đặt lại mật khẩu) đến email người nhận
     *
     * @param toEmail Email người nhận
     * @param otpCode Mã OTP 6 số
     * @param type Loại OTP: "ACCOUNT_ACTIVATION" hoặc "PASSWORD_RESET"
     */
    void sendOtpEmail(String toEmail, String otpCode, String type);
}
