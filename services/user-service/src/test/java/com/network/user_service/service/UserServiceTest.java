package com.network.user_service.service;

import com.network.user_service.dto.request.ChangePasswordRequest;
import com.network.user_service.dto.request.UpdateProfileRequest;
import com.network.user_service.dto.response.UserResponse;
import com.network.user_service.entity.University;
import com.network.user_service.entity.User;
import com.network.user_service.exception.AppException;
import com.network.user_service.exception.ResourceNotFoundException;
import com.network.user_service.repository.UniversityRepository;
import com.network.user_service.repository.UserRepository;
import com.network.user_service.service.impl.UserServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UniversityRepository universityRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserServiceImpl userService;

    @Test
    @DisplayName("Lấy profile thành công khi email tồn tại trong hệ thống")
    void getCurrentUserProfile_ShouldReturnUserResponse_WhenEmailExists() {
        String email = "student01@dedocu.vn";
        University university = University.builder()
                .id(UUID.randomUUID())
                .name("Đại học Bách Khoa")
                .build();

        User user = User.builder()
                .id(UUID.randomUUID())
                .email(email)
                .username("student01")
                .fullName("Nguyen Van A")
                .role("USER")
                .university(university)
                .build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

        UserResponse response = userService.getCurrentUserProfile(email);

        assertThat(response).isNotNull();
        assertThat(response.getEmail()).isEqualTo(email);
        assertThat(response.getUsername()).isEqualTo("student01");
        assertThat(response.getUniversityId()).isEqualTo(university.getId());
        assertThat(response.getUniversityName()).isEqualTo("Đại học Bách Khoa");
    }

    @Test
    @DisplayName("Ném ResourceNotFoundException khi không tìm thấy email")
    void getCurrentUserProfile_ShouldThrowException_WhenEmailNotFound() {
        String email = "notfound@dedocu.vn";
        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getCurrentUserProfile(email))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Không tìm thấy thông tin người dùng");
    }

    @Test
    @DisplayName("Cập nhật thông tin profile thành công và tính avatarText chính xác")
    void updateProfile_ShouldUpdateFieldsAndAvatarText() {
        String email = "student01@dedocu.vn";
        User user = User.builder()
                .id(UUID.randomUUID())
                .email(email)
                .username("student01")
                .fullName("Nguyen Van A")
                .avatarText("NA")
                .build();

        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .fullName("Trần Minh Tấn")
                .major("Kỹ thuật Phần mềm")
                .bio("Đam mê phân tán")
                .universityName("Đại học Bách Khoa Hà Nội")
                .avatarUrl("https://example.com/avatar.jpg")
                .build();

        University mockUni = University.builder()
                .id(UUID.randomUUID())
                .name("Đại học Bách Khoa Hà Nội")
                .code("HUST")
                .build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(universityRepository.findFirstByNameIgnoreCase("Đại học Bách Khoa Hà Nội")).thenReturn(Optional.of(mockUni));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse response = userService.updateProfile(email, request);

        assertThat(response.getFullName()).isEqualTo("Trần Minh Tấn");
        assertThat(response.getAvatarText()).isEqualTo("TT");
        assertThat(response.getMajor()).isEqualTo("Kỹ thuật Phần mềm");
        assertThat(response.getBio()).isEqualTo("Đam mê phân tán");
        assertThat(response.getUniversityName()).isEqualTo("Đại học Bách Khoa Hà Nội");
        assertThat(response.getAvatarUrl()).isEqualTo("https://example.com/avatar.jpg");
    }

    @Test
    @DisplayName("Đổi mật khẩu thành công khi mật khẩu hiện tại chính xác")
    void changePassword_ShouldSucceed_WhenCurrentPasswordMatches() {
        String email = "student01@dedocu.vn";
        User user = User.builder()
                .id(UUID.randomUUID())
                .email(email)
                .passwordHash("hashedOldPassword")
                .build();

        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("OldPassword@123")
                .newPassword("NewPassword@456")
                .build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("OldPassword@123", "hashedOldPassword")).thenReturn(true);
        when(passwordEncoder.encode("NewPassword@456")).thenReturn("hashedNewPassword");

        userService.changePassword(email, request);

        assertThat(user.getPasswordHash()).isEqualTo("hashedNewPassword");
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("Đổi mật khẩu thất bại khi mật khẩu hiện tại không khớp")
    void changePassword_ShouldThrowAppException_WhenCurrentPasswordInvalid() {
        String email = "student01@dedocu.vn";
        User user = User.builder()
                .id(UUID.randomUUID())
                .email(email)
                .passwordHash("hashedOldPassword")
                .build();

        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("WrongPassword")
                .newPassword("NewPassword@456")
                .build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("WrongPassword", "hashedOldPassword")).thenReturn(false);

        assertThatThrownBy(() -> userService.changePassword(email, request))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Mật khẩu hiện tại không chính xác");
    }

    @Test
    @DisplayName("Đổi mật khẩu thất bại khi mật khẩu mới trùng mật khẩu hiện tại")
    void changePassword_ShouldThrowAppException_WhenNewPasswordSameAsCurrent() {
        String email = "student01@dedocu.vn";
        User user = User.builder()
                .id(UUID.randomUUID())
                .email(email)
                .passwordHash("hashedOldPassword")
                .build();

        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("SamePassword@123")
                .newPassword("SamePassword@123")
                .build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("SamePassword@123", "hashedOldPassword")).thenReturn(true);

        assertThatThrownBy(() -> userService.changePassword(email, request))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Mật khẩu mới không được trùng với mật khẩu hiện tại");
    }
}
