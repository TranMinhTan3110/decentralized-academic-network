package com.network.user_service.it;

import com.network.user_service.dto.request.LoginRequest;
import com.network.user_service.dto.request.RegisterRequest;
import com.network.user_service.dto.request.VerifyOtpRequest;
import com.network.user_service.dto.response.ApiResponse;
import com.network.user_service.dto.response.AuthResponse;
import com.network.user_service.dto.response.UserResponse;
import com.network.user_service.entity.User;
import com.network.user_service.entity.UserVerificationCode;
import com.network.user_service.repository.UserRepository;
import com.network.user_service.repository.UserVerificationCodeRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class UserSecurityIT {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserVerificationCodeRepository verificationCodeRepository;

    private String getBaseUrl() {
        return "http://localhost:" + port;
    }

    @Test
    @DisplayName("IT-01: Truy cập /api/v1/users/me không có Token -> Server trả về 403 Forbidden")
    void getMe_WithoutToken_ShouldReturn403() {
        ResponseEntity<String> response = restTemplate.getForEntity(
                getBaseUrl() + "/api/v1/users/me",
                String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("IT-02: Truy cập /api/v1/users/me với Token giả mạo -> Server trả về 403 Forbidden")
    void getMe_WithInvalidToken_ShouldReturn403() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth("invalid.fake.jwt.token");
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<String> response = restTemplate.exchange(
                getBaseUrl() + "/api/v1/users/me",
                HttpMethod.GET,
                entity,
                String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("IT-03: Luồng thực tế đầy đủ: Đăng ký -> Verify OTP -> Login -> Gọi /api/v1/users/me thành công 200 OK")
    void fullAuthFlow_ShouldSucceed() {
        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);
        String testEmail = "it_scholar_" + uniqueSuffix + "@dedocu.vn";
        String testUsername = "it_user_" + uniqueSuffix;
        String testPassword = "Password@123";

        // 1. Đăng ký tài khoản
        RegisterRequest registerRequest = RegisterRequest.builder()
                .email(testEmail)
                .username(testUsername)
                .password(testPassword)
                .fullName("Integration Tester")
                .major("Khoa học Máy tính")
                .build();

        ResponseEntity<ApiResponse<UserResponse>> registerResponse = restTemplate.exchange(
                getBaseUrl() + "/api/v1/auth/register",
                HttpMethod.POST,
                new HttpEntity<>(registerRequest),
                new ParameterizedTypeReference<>() {}
        );

        assertThat(registerResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(registerResponse.getBody()).isNotNull();
        assertThat(registerResponse.getBody().isSuccess()).isTrue();

        // 2. Tìm mã OTP thật trong DB sinh ra cho user
        User user = userRepository.findByEmail(testEmail).orElseThrow();
        UserVerificationCode verificationCode = verificationCodeRepository
                .findTopByUserAndCodeAndTypeAndIsUsedFalseOrderByCreatedAtDesc(user, "", "ACCOUNT_ACTIVATION")
                .orElseGet(() -> verificationCodeRepository.findAll().stream()
                        .filter(c -> c.getUser().getId().equals(user.getId()) && !c.getIsUsed())
                        .findFirst().orElseThrow());

        String realOtp = verificationCode.getCode();

        // 3. Kích hoạt tài khoản bằng mã OTP thật
        VerifyOtpRequest verifyOtpRequest = VerifyOtpRequest.builder()
                .email(testEmail)
                .code(realOtp)
                .build();

        ResponseEntity<ApiResponse<UserResponse>> verifyResponse = restTemplate.exchange(
                getBaseUrl() + "/api/v1/auth/verify-otp",
                HttpMethod.POST,
                new HttpEntity<>(verifyOtpRequest),
                new ParameterizedTypeReference<>() {}
        );

        assertThat(verifyResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(verifyResponse.getBody()).isNotNull();
        assertThat(verifyResponse.getBody().getData().getIsVerified()).isTrue();

        // 4. Đăng nhập để nhận JWT Token thật
        LoginRequest loginRequest = LoginRequest.builder()
                .email(testEmail)
                .password(testPassword)
                .build();

        ResponseEntity<ApiResponse<AuthResponse>> loginResponse = restTemplate.exchange(
                getBaseUrl() + "/api/v1/auth/login",
                HttpMethod.POST,
                new HttpEntity<>(loginRequest),
                new ParameterizedTypeReference<>() {}
        );

        assertThat(loginResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(loginResponse.getBody()).isNotNull();
        String jwtToken = loginResponse.getBody().getData().getAccessToken();
        assertThat(jwtToken).isNotBlank();

        // 5. Cầm Token thật gọi API được bảo mật /api/v1/users/me
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(jwtToken);
        HttpEntity<Void> profileEntity = new HttpEntity<>(headers);

        ResponseEntity<ApiResponse<UserResponse>> profileResponse = restTemplate.exchange(
                getBaseUrl() + "/api/v1/users/me",
                HttpMethod.GET,
                profileEntity,
                new ParameterizedTypeReference<>() {}
        );

        assertThat(profileResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(profileResponse.getBody()).isNotNull();
        assertThat(profileResponse.getBody().isSuccess()).isTrue();
        assertThat(profileResponse.getBody().getData().getEmail()).isEqualTo(testEmail);
        assertThat(profileResponse.getBody().getData().getUsername()).isEqualTo(testUsername);
        assertThat(profileResponse.getBody().getData().getFullName()).isEqualTo("Integration Tester");
    }
}
