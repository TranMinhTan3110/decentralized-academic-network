package com.network.user_service.service;

import com.network.user_service.dto.request.ChangePasswordRequest;
import com.network.user_service.dto.request.UpdateProfileRequest;
import com.network.user_service.dto.response.UserResponse;
import com.network.user_service.entity.University;
import com.network.user_service.entity.User;
import com.network.user_service.exception.AppException;
import com.network.user_service.exception.ResourceNotFoundException;
import com.network.user_service.dto.response.UserSummaryDto;
import com.network.user_service.repository.BadgeRepository;
import com.network.user_service.repository.PointTransactionRepository;
import com.network.user_service.repository.UniversityRepository;
import com.network.user_service.repository.UserFollowRepository;
import com.network.user_service.repository.UserRepository;
import com.network.user_service.service.impl.UserServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UniversityRepository universityRepository;

    @Mock
    private UserFollowRepository userFollowRepository;

    @Mock
    private BadgeRepository badgeRepository;

    @Mock
    private PointTransactionRepository pointTransactionRepository;

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

    @Test
    @DisplayName("Xóa trường đại học khi universityName là chuỗi rỗng")
    void updateProfile_ShouldClearUniversity_WhenUniversityNameIsEmpty() {
        String email = "student01@dedocu.vn";
        University university = University.builder()
                .id(UUID.randomUUID())
                .name("Đại học Bách Khoa")
                .build();

        User user = User.builder()
                .id(UUID.randomUUID())
                .email(email)
                .university(university)
                .build();

        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .universityName("   ")
                .build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse response = userService.updateProfile(email, request);

        assertThat(response.getUniversityId()).isNull();
        assertThat(response.getUniversityName()).isNull();
    }

    @Test
    @DisplayName("Tự động tạo trường đại học mới khi chưa có trong cơ sở dữ liệu")
    void updateProfile_ShouldCreateNewUniversity_WhenNotInDatabase() {
        String email = "student01@dedocu.vn";
        User user = User.builder()
                .id(UUID.randomUUID())
                .email(email)
                .build();

        String longUniName = "Đại học Quốc gia Singapore National University of Singapore";
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .fullName("Tan")
                .universityName(longUniName)
                .build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(universityRepository.findFirstByNameIgnoreCase(longUniName)).thenReturn(Optional.empty());
        when(universityRepository.findByCode(anyString())).thenReturn(Optional.empty());
        when(universityRepository.save(any(University.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse response = userService.updateProfile(email, request);

        assertThat(response.getFullName()).isEqualTo("Tan");
        assertThat(response.getAvatarText()).isEqualTo("TA");
        assertThat(response.getUniversityName()).isEqualTo(longUniName);
    }

    @Test
    @DisplayName("getFollowingIds trả về danh sách UUID các tác giả đang theo dõi")
    void getFollowingIds_ShouldReturnList_WhenUserHasFollowings() {
        UUID userId = UUID.randomUUID();
        UUID following1 = UUID.randomUUID();
        UUID following2 = UUID.randomUUID();

        when(userFollowRepository.findFollowingIdsByFollowerId(userId))
                .thenReturn(List.of(following1, following2));

        List<UUID> result = userService.getFollowingIds(userId);

        assertThat(result).hasSize(2).containsExactly(following1, following2);
    }

    @Test
    @DisplayName("getFollowingIds trả về danh sách rỗng khi userId là null")
    void getFollowingIds_ShouldReturnEmptyList_WhenUserIdIsNull() {
        List<UUID> result = userService.getFollowingIds(null);

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("getSuggestedUsers cho người dùng đã đăng nhập: loại trừ bản thân và người đã theo dõi")
    void getSuggestedUsers_ShouldReturnSuggestedUsers_WhenAuthenticatedUser() {
        String email = "student01@dedocu.vn";
        UUID userId = UUID.randomUUID();
        UUID uniId = UUID.randomUUID();
        University uni = University.builder().id(uniId).name("ĐHBK Hà Nội").build();

        User currentUser = User.builder()
                .id(userId)
                .email(email)
                .university(uni)
                .build();

        User suggestedUser = User.builder()
                .id(UUID.randomUUID())
                .username("auduongtan")
                .fullName("Âu Dương Tấn")
                .scholarTitle("Chuyên gia AI")
                .university(uni)
                .uploadPointsBalance(100)
                .build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(currentUser));
        when(userRepository.findSuggestedUsersForUser(eq(userId), eq(uniId), any(Pageable.class)))
                .thenReturn(List.of(suggestedUser));

        List<UserSummaryDto> result = userService.getSuggestedUsers(email, 5);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getUsername()).isEqualTo("auduongtan");
        assertThat(result.get(0).getBadge()).isEqualTo("Chuyên gia AI");
        assertThat(result.get(0).getPoints()).isEqualTo(100);
        assertThat(result.get(0).getUniversityName()).isEqualTo("ĐHBK Hà Nội");
    }

    @Test
    @DisplayName("getSuggestedUsers cho khách chưa đăng nhập: lấy top người dùng")
    void getSuggestedUsers_ShouldReturnTopUsers_WhenGuest() {
        User topUser = User.builder()
                .id(UUID.randomUUID())
                .username("topauthor")
                .fullName("Top Author")
                .scholarTitle("Giáo sư")
                .uploadPointsBalance(500)
                .build();

        when(userRepository.findTopSuggestedUsers(any(Pageable.class)))
                .thenReturn(List.of(topUser));

        List<UserSummaryDto> result = userService.getSuggestedUsers(null, 5);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getUsername()).isEqualTo("topauthor");
        assertThat(result.get(0).getBadge()).isEqualTo("Giáo sư");
        assertThat(result.get(0).getPoints()).isEqualTo(500);
    }

    @Test
    @DisplayName("getUserSummary trả về đúng UserSummaryDto khi user tồn tại")
    void getUserSummary_ShouldReturnSummary_WhenUserExists() {
        UUID userId = UUID.randomUUID();
        User user = User.builder()
                .id(userId)
                .username("testauthor")
                .fullName("Test Author")
                .scholarTitle("Tiến sĩ")
                .uploadPointsBalance(250)
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        UserSummaryDto summary = userService.getUserSummary(userId);

        assertThat(summary).isNotNull();
        assertThat(summary.getId()).isEqualTo(userId);
        assertThat(summary.getUsername()).isEqualTo("testauthor");
        assertThat(summary.getBadge()).isEqualTo("Tiến sĩ");
        assertThat(summary.getPoints()).isEqualTo(250);
    }
}
