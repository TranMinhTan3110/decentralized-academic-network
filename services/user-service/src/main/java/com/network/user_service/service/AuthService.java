package com.network.user_service.service;

import com.network.user_service.dto.request.ForgotPasswordRequest;
import com.network.user_service.dto.request.GoogleLoginRequest;
import com.network.user_service.dto.request.LoginRequest;
import com.network.user_service.dto.request.RegisterRequest;
import com.network.user_service.dto.request.ResetPasswordRequest;
import com.network.user_service.dto.request.VerifyOtpRequest;
import com.network.user_service.dto.response.AuthResponse;
import com.network.user_service.dto.response.UserResponse;

public interface AuthService {

    UserResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    UserResponse verifyOtp(VerifyOtpRequest request);

    void forgotPassword(ForgotPasswordRequest request);

    void resetPassword(ResetPasswordRequest request);

    AuthResponse loginWithGoogle(GoogleLoginRequest request);
}


