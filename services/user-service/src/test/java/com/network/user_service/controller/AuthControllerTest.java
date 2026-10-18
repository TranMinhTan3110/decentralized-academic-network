package com.network.user_service.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.network.user_service.dto.request.LoginRequest;
import com.network.user_service.dto.request.RegisterRequest;
import com.network.user_service.dto.response.AuthResponse;
import com.network.user_service.dto.response.UserResponse;
import com.network.user_service.exception.DuplicateResourceException;
import com.network.user_service.exception.GlobalExceptionHandler;
import com.network.user_service.exception.InvalidCredentialsException;
import com.network.user_service.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(authController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("API POST /api/v1/auth/register trả về 201 Created khi hợp lệ")
    void register_ShouldReturn201_WhenValid() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("student@dedocu.vn")
                .username("student01")
                .password("Password@123")
                .fullName("Nguyen Van A")
                .build();

        UserResponse mockResponse = UserResponse.builder()
                .id(UUID.randomUUID())
                .email("student@dedocu.vn")
                .username("student01")
                .fullName("Nguyen Van A")
                .role("USER")
                .build();

        when(authService.register(any(RegisterRequest.class))).thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("student@dedocu.vn"))
                .andExpect(jsonPath("$.data.username").value("student01"));
    }

    @Test
    @DisplayName("API POST /api/v1/auth/register trả về 400 Bad Request khi thiếu mật khẩu")
    void register_ShouldReturn400_WhenValidationFails() throws Exception {
        RegisterRequest invalidRequest = RegisterRequest.builder()
                .email("student@dedocu.vn")
                .username("student01")
                .password("") // Trống -> @NotBlank vi phạm
                .fullName("Nguyen Van A")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("API POST /api/v1/auth/register trả về 409 Conflict khi email bị trùng")
    void register_ShouldReturn409_WhenEmailDuplicate() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("student@dedocu.vn")
                .username("student01")
                .password("Password@123")
                .fullName("Nguyen Van A")
                .build();

        when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new DuplicateResourceException("Email đã được sử dụng trong hệ thống"));

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Email đã được sử dụng trong hệ thống"));
    }

    @Test
    @DisplayName("API POST /api/v1/auth/login trả về 200 OK khi đăng nhập thành công")
    void login_ShouldReturn200_WhenValid() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("student01@dedocu.vn")
                .password("Password@123")
                .build();

        AuthResponse mockResponse = AuthResponse.builder()
                .accessToken("mocked.jwt.token")
                .tokenType("Bearer")
                .expiresIn(86400L)
                .build();

        when(authService.login(any(LoginRequest.class))).thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").value("mocked.jwt.token"));
    }

    @Test
    @DisplayName("API POST /api/v1/auth/login trả về 401 Unauthorized khi sai mật khẩu")
    void login_ShouldReturn401_WhenInvalidCredentials() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("student01@dedocu.vn")
                .password("WrongPassword")
                .build();

        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new InvalidCredentialsException("Email hoặc mật khẩu không chính xác"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Email hoặc mật khẩu không chính xác"));
    }

    @Test
    @DisplayName("API POST /api/v1/auth/forgot-password trả về 200 OK khi email hợp lệ")
    void forgotPassword_ShouldReturn200_WhenValid() throws Exception {
        com.network.user_service.dto.request.ForgotPasswordRequest request =
                com.network.user_service.dto.request.ForgotPasswordRequest.builder()
                        .email("student01@dedocu.vn")
                        .build();

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Mã OTP đặt lại mật khẩu đã được gửi đến email của bạn."));
    }

    @Test
    @DisplayName("API POST /api/v1/auth/forgot-password trả về 400 Bad Request khi email trống")
    void forgotPassword_ShouldReturn400_WhenEmailBlank() throws Exception {
        com.network.user_service.dto.request.ForgotPasswordRequest request =
                com.network.user_service.dto.request.ForgotPasswordRequest.builder()
                        .email("")
                        .build();

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("API POST /api/v1/auth/reset-password trả về 200 OK khi hợp lệ")
    void resetPassword_ShouldReturn200_WhenValid() throws Exception {
        com.network.user_service.dto.request.ResetPasswordRequest request =
                com.network.user_service.dto.request.ResetPasswordRequest.builder()
                        .email("student01@dedocu.vn")
                        .otp("654321")
                        .newPassword("NewPass@123")
                        .build();

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay bây giờ."));
    }

    @Test
    @DisplayName("API POST /api/v1/auth/verify-otp trả về 200 OK khi OTP hợp lệ")
    void verifyOtp_ShouldReturn200_WhenValid() throws Exception {
        com.network.user_service.dto.request.VerifyOtpRequest request =
                com.network.user_service.dto.request.VerifyOtpRequest.builder()
                        .email("student01@dedocu.vn")
                        .code("123456")
                        .build();

        AuthResponse mockResponse = AuthResponse.builder()
                .accessToken("mocked.jwt.token")
                .tokenType("Bearer")
                .isVerified(true)
                .user(UserResponse.builder()
                        .id(java.util.UUID.randomUUID())
                        .email("student01@dedocu.vn")
                        .isVerified(true)
                        .build())
                .build();

        when(authService.verifyOtp(any(com.network.user_service.dto.request.VerifyOtpRequest.class)))
                .thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/auth/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isVerified").value(true))
                .andExpect(jsonPath("$.data.accessToken").value("mocked.jwt.token"));
    }

    @Test
    @DisplayName("API POST /api/v1/auth/google trả về 200 OK khi idToken hợp lệ")
    void loginWithGoogle_ShouldReturn200_WhenValid() throws Exception {
        com.network.user_service.dto.request.GoogleLoginRequest request =
                com.network.user_service.dto.request.GoogleLoginRequest.builder()
                        .idToken("valid-google-id-token")
                        .build();

        AuthResponse mockResponse = AuthResponse.builder()
                .accessToken("mocked.google.jwt")
                .tokenType("Bearer")
                .expiresIn(86400L)
                .build();

        when(authService.loginWithGoogle(any(com.network.user_service.dto.request.GoogleLoginRequest.class)))
                .thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").value("mocked.google.jwt"));
    }

    @Test
    @DisplayName("API POST /api/v1/auth/google trả về 400 Bad Request khi idToken trống")
    void loginWithGoogle_ShouldReturn400_WhenBlankToken() throws Exception {
        com.network.user_service.dto.request.GoogleLoginRequest request =
                com.network.user_service.dto.request.GoogleLoginRequest.builder()
                        .idToken("")
                        .build();

        mockMvc.perform(post("/api/v1/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }
}


