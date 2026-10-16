package com.network.user_service.controller;

import com.network.user_service.dto.request.ForgotPasswordRequest;
import com.network.user_service.dto.request.LoginRequest;
import com.network.user_service.dto.request.RegisterRequest;
import com.network.user_service.dto.request.ResetPasswordRequest;
import com.network.user_service.dto.request.VerifyOtpRequest;
import com.network.user_service.dto.response.ApiResponse;
import com.network.user_service.dto.response.AuthResponse;
import com.network.user_service.dto.response.UserResponse;
import com.network.user_service.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponse>> register(@Valid @RequestBody RegisterRequest request) {
        UserResponse response = authService.register(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Đăng ký tài khoản thành công. Vui lòng kiểm tra mã OTP để kích hoạt."));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<UserResponse>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        UserResponse response = authService.verifyOtp(request);
        return ResponseEntity
                .ok(ApiResponse.success(response, "Kích hoạt tài khoản thành công!"));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity
                .ok(ApiResponse.success(response, "Đăng nhập thành công"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity
                .ok(ApiResponse.success(null, "Mã OTP đặt lại mật khẩu đã được gửi đến email của bạn."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity
                .ok(ApiResponse.success(null, "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay bây giờ."));
    }
}

