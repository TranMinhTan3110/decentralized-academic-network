package com.network.user_service.service;

import com.network.user_service.dto.request.LoginRequest;
import com.network.user_service.dto.request.RegisterRequest;
import com.network.user_service.dto.response.AuthResponse;
import com.network.user_service.dto.response.UserResponse;
import com.network.user_service.entity.University;
import com.network.user_service.entity.User;
import com.network.user_service.exception.DuplicateResourceException;
import com.network.user_service.exception.InvalidCredentialsException;
import com.network.user_service.repository.UniversityRepository;
import com.network.user_service.repository.UserRepository;
import com.network.user_service.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

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
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthServiceImpl authService;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;
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
                .usernameOrEmail("student01")
                .password("Password@123")
                .build();

        mockUser = User.builder()
                .id(userId)
                .email("student@dedocu.vn")
                .username("student01")
                .passwordHash("hashed_password_xyz")
                .fullName("Nguyen Van A")
                .university(mockUniversity)
                .role("USER")
                .status("ACTIVE")
                .build();
    }

    @Test
    @DisplayName("TC_AUTH_001: Đăng ký thành công khi dữ liệu hợp lệ (có universityId)")
    void register_Success_WithUniversity() {
        when(userRepository.existsByEmail("student@dedocu.vn")).thenReturn(false);
        when(userRepository.existsByUsername("student01")).thenReturn(false);
        when(universityRepository.findById(universityId)).thenReturn(Optional.of(mockUniversity));
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_password_xyz");
        when(userRepository.save(any(User.class))).thenReturn(mockUser);

        UserResponse response = authService.register(registerRequest);

        assertNotNull(response);
        assertEquals("student@dedocu.vn", response.getEmail());
        assertEquals("student01", response.getUsername());
        assertEquals("Nguyen Van A", response.getFullName());
        assertEquals("USER", response.getRole());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("Đăng ký thành công khi không chọn trường đại học (universityId null)")
    void register_Success_WithoutUniversity() {
        registerRequest.setUniversityId(null);

        User userWithoutUni = User.builder()
                .id(userId)
                .email("student@dedocu.vn")
                .username("student01")
                .passwordHash("hashed_password_xyz")
                .fullName("Nguyen Van A")
                .role("USER")
                .build();

        when(userRepository.existsByEmail("student@dedocu.vn")).thenReturn(false);
        when(userRepository.existsByUsername("student01")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_password_xyz");
        when(userRepository.save(any(User.class))).thenReturn(userWithoutUni);

        UserResponse response = authService.register(registerRequest);

        assertNotNull(response);
        assertNull(response.getUniversityId());
        verify(universityRepository, never()).findById(any());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("TC_AUTH_002: Đăng ký thất bại khi email đã tồn tại trong hệ thống")
    void register_DuplicateEmail_ThrowsDuplicateResourceException() {
        when(userRepository.existsByEmail("student@dedocu.vn")).thenReturn(true);

        DuplicateResourceException exception = assertThrows(
                DuplicateResourceException.class,
                () -> authService.register(registerRequest)
        );

        assertEquals("Email đã được sử dụng trong hệ thống", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("TC_AUTH_003: Đăng ký thất bại khi username đã tồn tại trong hệ thống")
    void register_DuplicateUsername_ThrowsDuplicateResourceException() {
        when(userRepository.existsByEmail("student@dedocu.vn")).thenReturn(false);
        when(userRepository.existsByUsername("student01")).thenReturn(true);

        DuplicateResourceException exception = assertThrows(
                DuplicateResourceException.class,
                () -> authService.register(registerRequest)
        );

        assertEquals("Username đã tồn tại trong hệ thống", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("TC_AUTH_005 & TC_AUTH_006: Đăng nhập thành công với thông tin hợp lệ")
    void login_Success_WithValidCredentials() {
        when(userRepository.findByUsernameOrEmail("student01", "student01")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("Password@123", "hashed_password_xyz")).thenReturn(true);
        when(jwtService.generateToken(mockUser)).thenReturn("mocked.jwt.token");
        when(jwtService.getExpirationInSeconds()).thenReturn(86400L);

        AuthResponse response = authService.login(loginRequest);

        assertNotNull(response);
        assertEquals("mocked.jwt.token", response.getAccessToken());
        assertEquals("Bearer", response.getTokenType());
        assertEquals(86400L, response.getExpiresIn());
        assertNotNull(response.getUser());
        assertEquals("student01", response.getUser().getUsername());
    }

    @Test
    @DisplayName("Đăng nhập thất bại khi tài khoản không tồn tại")
    void login_UserNotFound_ThrowsInvalidCredentialsException() {
        when(userRepository.findByUsernameOrEmail("student01", "student01")).thenReturn(Optional.empty());

        InvalidCredentialsException exception = assertThrows(
                InvalidCredentialsException.class,
                () -> authService.login(loginRequest)
        );

        assertEquals("Tên đăng nhập hoặc mật khẩu không chính xác", exception.getMessage());
    }

    @Test
    @DisplayName("TC_AUTH_007: Đăng nhập thất bại khi sai mật khẩu")
    void login_WrongPassword_ThrowsInvalidCredentialsException() {
        when(userRepository.findByUsernameOrEmail("student01", "student01")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("Password@123", "hashed_password_xyz")).thenReturn(false);

        InvalidCredentialsException exception = assertThrows(
                InvalidCredentialsException.class,
                () -> authService.login(loginRequest)
        );

        assertEquals("Tên đăng nhập hoặc mật khẩu không chính xác", exception.getMessage());
        verify(jwtService, never()).generateToken(any());
    }
}
