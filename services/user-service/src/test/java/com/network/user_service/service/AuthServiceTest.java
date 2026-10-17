package com.network.user_service.service;

import com.network.user_service.dto.request.ForgotPasswordRequest;
import com.network.user_service.dto.request.GoogleLoginRequest;
import com.network.user_service.dto.request.LoginRequest;
import com.network.user_service.dto.request.RegisterRequest;
import com.network.user_service.dto.request.ResetPasswordRequest;
import com.network.user_service.dto.request.VerifyOtpRequest;
import com.network.user_service.dto.response.AuthResponse;
import com.network.user_service.dto.response.GoogleTokenPayload;
import com.network.user_service.dto.response.UserResponse;
import com.network.user_service.entity.University;
import com.network.user_service.entity.User;
import com.network.user_service.entity.UserVerificationCode;
import com.network.user_service.exception.InvalidCredentialsException;
import com.network.user_service.repository.UniversityRepository;
import com.network.user_service.repository.UserRepository;
import com.network.user_service.repository.UserVerificationCodeRepository;
import com.network.user_service.security.GoogleTokenVerifier;
import com.network.user_service.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UniversityRepository universityRepository;

    @Mock
    private UserVerificationCodeRepository verificationCodeRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private GoogleTokenVerifier googleTokenVerifier;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private AuthServiceImpl authService;


    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;
    private VerifyOtpRequest verifyOtpRequest;
    private User mockUser;
    private University mockUniversity;
    private UUID universityId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        universityId = UUID.randomUUID();

        mockUniversity = University.builder()
                .id(universityId)
                .code("HUST")
                .name("Đại học Bách khoa Hà Nội")
                .build();

        registerRequest = RegisterRequest.builder()
                .email("student@dedocu.vn")
                .username("student01")
                .password("Password@123")
                .fullName("Nguyen Van A")
                .universityId(universityId)
                .major("Khoa học Máy tính")
                .build();

        loginRequest = LoginRequest.builder()
                .email("student@dedocu.vn")
                .password("Password@123")
                .build();

        verifyOtpRequest = VerifyOtpRequest.builder()
                .email("student@dedocu.vn")
                .code("123456")
                .build();

        mockUser = User.builder()
                .id(userId)
                .email("student@dedocu.vn")
                .username("student01")
                .passwordHash("hashed_password_xyz")
                .fullName("Nguyen Van A")
                .university(mockUniversity)
                .isVerified(true)
                .role("USER")
                .status("ACTIVE")
                .build();
    }

    @Test
    @DisplayName("Đăng ký thành công sinh mã OTP và lưu vào DB")
    void register_Success_WithUniversity() {
        when(userRepository.existsByEmail("student@dedocu.vn")).thenReturn(false);
        when(userRepository.existsByUsername("student01")).thenReturn(false);
        when(universityRepository.findById(universityId)).thenReturn(Optional.of(mockUniversity));
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_password_xyz");
        when(userRepository.save(any(User.class))).thenReturn(mockUser);

        UserResponse response = authService.register(registerRequest);

        assertNotNull(response);
        assertEquals("student@dedocu.vn", response.getEmail());
        verify(verificationCodeRepository, times(1)).save(any(UserVerificationCode.class));
    }

    @Test
    @DisplayName("Xác thực OTP thành công kích hoạt tài khoản isVerified=true")
    void verifyOtp_Success() {
        User unverifiedUser = User.builder()
                .id(userId)
                .email("student@dedocu.vn")
                .isVerified(false)
                .build();

        UserVerificationCode code = UserVerificationCode.builder()
                .code("123456")
                .type("ACCOUNT_ACTIVATION")
                .expiresAt(OffsetDateTime.now().plusMinutes(5))
                .isUsed(false)
                .user(unverifiedUser)
                .build();

        when(userRepository.findByEmail("student@dedocu.vn")).thenReturn(Optional.of(unverifiedUser));
        when(verificationCodeRepository.findTopByUserAndCodeAndTypeAndIsUsedFalseOrderByCreatedAtDesc(any(), eq("123456"), eq("ACCOUNT_ACTIVATION")))
                .thenReturn(Optional.of(code));
        when(userRepository.save(any(User.class))).thenReturn(mockUser);

        UserResponse response = authService.verifyOtp(verifyOtpRequest);

        assertNotNull(response);
        assertTrue(response.getIsVerified());
        assertTrue(code.getIsUsed());
    }

    @Test
    @DisplayName("Xác thực OTP thất bại khi mã OTP đã hết hạn")
    void verifyOtp_ExpiredCode_ThrowsException() {
        User unverifiedUser = User.builder().id(userId).email("student@dedocu.vn").isVerified(false).build();
        UserVerificationCode expiredCode = UserVerificationCode.builder()
                .code("123456")
                .expiresAt(OffsetDateTime.now().minusMinutes(1)) // Đã hết hạn
                .isUsed(false)
                .build();

        when(userRepository.findByEmail("student@dedocu.vn")).thenReturn(Optional.of(unverifiedUser));
        when(verificationCodeRepository.findTopByUserAndCodeAndTypeAndIsUsedFalseOrderByCreatedAtDesc(any(), eq("123456"), eq("ACCOUNT_ACTIVATION")))
                .thenReturn(Optional.of(expiredCode));

        assertThrows(InvalidCredentialsException.class, () -> authService.verifyOtp(verifyOtpRequest));
    }

    @Test
    @DisplayName("Đăng nhập thành công với Email và mật khẩu đúng")
    void login_Success_WithEmail() {
        when(userRepository.findByEmail("student@dedocu.vn")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("Password@123", "hashed_password_xyz")).thenReturn(true);
        when(jwtService.generateToken(mockUser)).thenReturn("mocked.jwt.token");
        when(jwtService.getExpirationInSeconds()).thenReturn(86400L);

        AuthResponse response = authService.login(loginRequest);

        assertNotNull(response);
        assertEquals("mocked.jwt.token", response.getAccessToken());
    }

    @Test
    @DisplayName("Đăng nhập thất bại khi tài khoản chưa kích hoạt OTP")
    void login_UnverifiedAccount_ThrowsException() {
        User unverifiedUser = User.builder()
                .email("student@dedocu.vn")
                .passwordHash("hashed_password_xyz")
                .isVerified(false) // Chưa kích hoạt
                .build();

        when(userRepository.findByEmail("student@dedocu.vn")).thenReturn(Optional.of(unverifiedUser));
        when(passwordEncoder.matches("Password@123", "hashed_password_xyz")).thenReturn(true);

        InvalidCredentialsException ex = assertThrows(InvalidCredentialsException.class, () -> authService.login(loginRequest));
        assertTrue(ex.getMessage().contains("chưa được xác minh email"));
    }

    @Test
    @DisplayName("Gửi OTP quên mật khẩu thành công")
    void forgotPassword_Success() {
        ForgotPasswordRequest request = ForgotPasswordRequest.builder()
                .email("student@dedocu.vn")
                .build();

        when(userRepository.findByEmail("student@dedocu.vn")).thenReturn(Optional.of(mockUser));

        assertDoesNotThrow(() -> authService.forgotPassword(request));
        verify(verificationCodeRepository, times(1)).save(any(UserVerificationCode.class));
    }

    @Test
    @DisplayName("Gửi OTP quên mật khẩu thất bại khi email không tồn tại")
    void forgotPassword_UserNotFound_ThrowsException() {
        ForgotPasswordRequest request = ForgotPasswordRequest.builder()
                .email("notfound@dedocu.vn")
                .build();

        when(userRepository.findByEmail("notfound@dedocu.vn")).thenReturn(Optional.empty());

        assertThrows(com.network.user_service.exception.ResourceNotFoundException.class,
                () -> authService.forgotPassword(request));
    }

    @Test
    @DisplayName("Đặt lại mật khẩu thành công với OTP đúng")
    void resetPassword_Success() {
        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .email("student@dedocu.vn")
                .otp("654321")
                .newPassword("NewPass@123")
                .build();

        UserVerificationCode validCode = UserVerificationCode.builder()
                .code("654321")
                .type("PASSWORD_RESET")
                .expiresAt(OffsetDateTime.now().plusMinutes(5))
                .isUsed(false)
                .build();

        when(userRepository.findByEmail("student@dedocu.vn")).thenReturn(Optional.of(mockUser));
        when(verificationCodeRepository.findTopByUserAndCodeAndTypeAndIsUsedFalseOrderByCreatedAtDesc(eq(mockUser), eq("654321"), eq("PASSWORD_RESET")))
                .thenReturn(Optional.of(validCode));
        when(passwordEncoder.encode("NewPass@123")).thenReturn("new_hashed_password");

        assertDoesNotThrow(() -> authService.resetPassword(request));
        assertTrue(validCode.getIsUsed());
        verify(userRepository, times(1)).save(mockUser);
    }

    @Test
    @DisplayName("Đặt lại mật khẩu thất bại khi OTP đã hết hạn")
    void resetPassword_ExpiredOtp_ThrowsException() {
        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .email("student@dedocu.vn")
                .otp("654321")
                .newPassword("NewPass@123")
                .build();

        UserVerificationCode expiredCode = UserVerificationCode.builder()
                .code("654321")
                .type("PASSWORD_RESET")
                .expiresAt(OffsetDateTime.now().minusMinutes(2))
                .isUsed(false)
                .build();

        when(userRepository.findByEmail("student@dedocu.vn")).thenReturn(Optional.of(mockUser));
        when(verificationCodeRepository.findTopByUserAndCodeAndTypeAndIsUsedFalseOrderByCreatedAtDesc(eq(mockUser), eq("654321"), eq("PASSWORD_RESET")))
                .thenReturn(Optional.of(expiredCode));

        assertThrows(InvalidCredentialsException.class, () -> authService.resetPassword(request));
    }

    @Test
    @DisplayName("Đặt lại mật khẩu thất bại khi người dùng không tồn tại")
    void resetPassword_UserNotFound_ThrowsException() {
        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .email("notfound@dedocu.vn")
                .otp("654321")
                .newPassword("NewPass@123")
                .build();

        when(userRepository.findByEmail("notfound@dedocu.vn")).thenReturn(Optional.empty());

        assertThrows(InvalidCredentialsException.class, () -> authService.resetPassword(request));
    }

    @Test
    @DisplayName("Đặt lại mật khẩu thất bại khi OTP không tồn tại")
    void resetPassword_OtpNotFound_ThrowsException() {
        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .email("student@dedocu.vn")
                .otp("wrong_code")
                .newPassword("NewPass@123")
                .build();

        when(userRepository.findByEmail("student@dedocu.vn")).thenReturn(Optional.of(mockUser));
        when(verificationCodeRepository.findTopByUserAndCodeAndTypeAndIsUsedFalseOrderByCreatedAtDesc(eq(mockUser), eq("wrong_code"), eq("PASSWORD_RESET")))
                .thenReturn(Optional.empty());

        assertThrows(InvalidCredentialsException.class, () -> authService.resetPassword(request));
    }

    @Test
    @DisplayName("Xác thực OTP thất bại khi người dùng không tồn tại")
    void verifyOtp_UserNotFound_ThrowsException() {
        VerifyOtpRequest request = VerifyOtpRequest.builder()
                .email("notfound@dedocu.vn")
                .code("123456")
                .build();

        when(userRepository.findByEmail("notfound@dedocu.vn")).thenReturn(Optional.empty());

        assertThrows(InvalidCredentialsException.class, () -> authService.verifyOtp(request));
    }

    @Test
    @DisplayName("Xác thực OTP thất bại khi mã OTP không tìm thấy")
    void verifyOtp_OtpNotFound_ThrowsException() {
        when(userRepository.findByEmail("student@dedocu.vn")).thenReturn(Optional.of(mockUser));
        when(verificationCodeRepository.findTopByUserAndCodeAndTypeAndIsUsedFalseOrderByCreatedAtDesc(eq(mockUser), eq("123456"), eq("ACCOUNT_ACTIVATION")))
                .thenReturn(Optional.empty());

        assertThrows(InvalidCredentialsException.class, () -> authService.verifyOtp(verifyOtpRequest));
    }

    @Test
    @DisplayName("Đăng nhập thất bại khi email không tồn tại")
    void login_UserNotFound_ThrowsException() {
        when(userRepository.findByEmail("student@dedocu.vn")).thenReturn(Optional.empty());

        assertThrows(InvalidCredentialsException.class, () -> authService.login(loginRequest));
    }

    @Test
    @DisplayName("Đăng ký thành công với họ tên 1 từ để kiểm tra avatarText")
    void register_SingleWordName_GeneratesAvatarText() {
        RegisterRequest request = RegisterRequest.builder()
                .email("single@dedocu.vn")
                .username("singleword")
                .password("Password@123")
                .fullName("Single")
                .build();

        when(userRepository.existsByEmail("single@dedocu.vn")).thenReturn(false);
        when(userRepository.existsByUsername("singleword")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_pass");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("SI", response.getAvatarText());
    }

    @Test
    @DisplayName("Đăng nhập Google thành công với người dùng mới (chưa có trong DB)")
    void loginWithGoogle_NewUser_Success() {
        GoogleLoginRequest request = GoogleLoginRequest.builder()
                .idToken("mocked-google-id-token")
                .build();

        GoogleTokenPayload payload = GoogleTokenPayload.builder()
                .email("google.new@dedocu.vn")
                .name("Google Scholar")
                .picture("https://google.com/avatar.jpg")
                .sub("google-sub-123")
                .build();

        when(googleTokenVerifier.verify("mocked-google-id-token")).thenReturn(payload);
        when(userRepository.findByEmail("google.new@dedocu.vn")).thenReturn(Optional.empty());
        when(userRepository.existsByUsername("google_new")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("random_hashed_pw");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });
        when(jwtService.generateToken(any(User.class))).thenReturn("jwt.google.token");
        when(jwtService.getExpirationInSeconds()).thenReturn(86400L);

        AuthResponse response = authService.loginWithGoogle(request);

        assertNotNull(response);
        assertEquals("jwt.google.token", response.getAccessToken());
        assertEquals("google.new@dedocu.vn", response.getUser().getEmail());
        assertTrue(response.getUser().getIsVerified());
        assertEquals("ACTIVE", response.getUser().getStatus());
    }

    @Test
    @DisplayName("Đăng nhập Google thành công với người dùng đã tồn tại trong DB")
    void loginWithGoogle_ExistingUser_Success() {
        GoogleLoginRequest request = GoogleLoginRequest.builder()
                .idToken("mocked-google-id-token")
                .build();

        GoogleTokenPayload payload = GoogleTokenPayload.builder()
                .email("student@dedocu.vn")
                .name("Existing User")
                .picture("https://google.com/avatar.jpg")
                .sub("google-sub-456")
                .build();

        when(googleTokenVerifier.verify("mocked-google-id-token")).thenReturn(payload);
        when(userRepository.findByEmail("student@dedocu.vn")).thenReturn(Optional.of(mockUser));
        when(jwtService.generateToken(mockUser)).thenReturn("jwt.google.existing");
        when(jwtService.getExpirationInSeconds()).thenReturn(86400L);

        AuthResponse response = authService.loginWithGoogle(request);

        assertNotNull(response);
        assertEquals("jwt.google.existing", response.getAccessToken());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Đăng nhập Google thất bại khi token không hợp lệ")
    void loginWithGoogle_InvalidToken_ThrowsException() {
        GoogleLoginRequest request = GoogleLoginRequest.builder()
                .idToken("invalid-google-token")
                .build();

        when(googleTokenVerifier.verify("invalid-google-token"))
                .thenThrow(new InvalidCredentialsException("Mã xác thực Google không hợp lệ hoặc đã hết hạn"));

        assertThrows(InvalidCredentialsException.class, () -> authService.loginWithGoogle(request));
    }
}


