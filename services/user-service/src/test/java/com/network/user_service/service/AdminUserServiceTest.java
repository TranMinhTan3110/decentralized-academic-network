package com.network.user_service.service;

import com.network.user_service.dto.request.UpdateUserRoleRequest;
import com.network.user_service.dto.request.UpdateUserStatusRequest;
import com.network.user_service.dto.response.AdminUserResponse;
import com.network.user_service.dto.response.AdminUserStatsResponse;
import com.network.user_service.entity.University;
import com.network.user_service.entity.User;
import com.network.user_service.exception.AppException;
import com.network.user_service.exception.ResourceNotFoundException;
import com.network.user_service.repository.UserRepository;
import com.network.user_service.service.impl.AdminUserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AdminUserServiceImpl adminUserService;

    private User adminUser;
    private User normalUser;
    private UUID adminId;
    private UUID normalUserId;

    @BeforeEach
    void setUp() {
        adminId = UUID.randomUUID();
        normalUserId = UUID.randomUUID();

        University university = University.builder()
                .id(UUID.randomUUID())
                .name("Đại học Bách Khoa")
                .build();

        adminUser = User.builder()
                .id(adminId)
                .email("admin@dedocu.com")
                .username("admin_node")
                .fullName("Quản Trị Viên")
                .role("ADMIN")
                .status("ACTIVE")
                .university(university)
                .totalUploads(10)
                .reputationPoints(500)
                .scholarTitle("Cao thủ")
                .createdAt(OffsetDateTime.now())
                .build();

        normalUser = User.builder()
                .id(normalUserId)
                .email("scholar@dedocu.com")
                .username("scholar_node")
                .fullName("Nguyễn Văn Học")
                .role("USER")
                .status("ACTIVE")
                .university(university)
                .totalUploads(48)
                .reputationPoints(612)
                .scholarTitle("Cao thủ")
                .createdAt(OffsetDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Lấy danh sách người dùng phân trang kèm chỉ số học thuật thành công")
    @SuppressWarnings("unchecked")
    void getUsers_Success() {
        Page<User> pagedUsers = new PageImpl<>(List.of(normalUser));
        when(userRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(pagedUsers);

        Page<AdminUserResponse> result = adminUserService.getUsers(0, 20, "scholar", "USER", "ACTIVE", null);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        AdminUserResponse response = result.getContent().get(0);
        assertThat(response.getId()).isEqualTo(normalUserId);
        assertThat(response.getUsername()).isEqualTo("scholar_node");
        assertThat(response.getTotalUploads()).isEqualTo(48);
        assertThat(response.getReputationPoints()).isEqualTo(612);
        assertThat(response.getScholarTitle()).isEqualTo("Cao thủ");
        assertThat(response.getUniversityName()).isEqualTo("Đại học Bách Khoa");
    }

    @Test
    @DisplayName("Xem chi tiết 1 người dùng thành công")
    void getUserById_Success() {
        when(userRepository.findById(normalUserId)).thenReturn(Optional.of(normalUser));

        AdminUserResponse response = adminUserService.getUserById(normalUserId);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(normalUserId);
        assertThat(response.getEmail()).isEqualTo("scholar@dedocu.com");
    }

    @Test
    @DisplayName("Xem chi tiết người dùng thất bại khi ID không tồn tại -> ném ResourceNotFoundException")
    void getUserById_NotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(userRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adminUserService.getUserById(nonExistentId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Không tìm thấy người dùng");
    }

    @Test
    @DisplayName("Khóa tài khoản người dùng khác thành công")
    void updateUserStatus_BanOtherUser_Success() {
        UpdateUserStatusRequest request = UpdateUserStatusRequest.builder()
                .status("BANNED")
                .reason("Spam tài liệu sai lệch")
                .build();

        when(userRepository.findById(normalUserId)).thenReturn(Optional.of(normalUser));
        when(userRepository.findByEmail("admin@dedocu.com")).thenReturn(Optional.of(adminUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AdminUserResponse response = adminUserService.updateUserStatus(normalUserId, request, "admin@dedocu.com");

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo("BANNED");
        verify(userRepository, times(1)).save(normalUser);
    }

    @Test
    @DisplayName("Admin tự khóa tài khoản của mình -> Báo lỗi BadRequest 400")
    void updateUserStatus_SelfBan_ThrowsBadRequest() {
        UpdateUserStatusRequest request = UpdateUserStatusRequest.builder()
                .status("BANNED")
                .reason("Tự khóa")
                .build();

        when(userRepository.findById(adminId)).thenReturn(Optional.of(adminUser));
        when(userRepository.findByEmail("admin@dedocu.com")).thenReturn(Optional.of(adminUser));

        assertThatThrownBy(() -> adminUserService.updateUserStatus(adminId, request, "admin@dedocu.com"))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appException = (AppException) ex;
                    assertThat(appException.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(appException.getMessage()).contains("Quản trị viên không được phép tự khóa tài khoản của chính mình");
                });

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Cập nhật trạng thái không hợp lệ -> Báo lỗi BadRequest 400")
    void updateUserStatus_InvalidStatus_ThrowsBadRequest() {
        UpdateUserStatusRequest request = UpdateUserStatusRequest.builder()
                .status("UNKNOWN")
                .build();

        assertThatThrownBy(() -> adminUserService.updateUserStatus(normalUserId, request, "admin@dedocu.com"))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appException = (AppException) ex;
                    assertThat(appException.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                });
    }

    @Test
    @DisplayName("Nâng quyền người dùng lên ADMIN thành công")
    void updateUserRole_PromoteToAdmin_Success() {
        UpdateUserRoleRequest request = UpdateUserRoleRequest.builder()
                .role("ADMIN")
                .build();

        when(userRepository.findById(normalUserId)).thenReturn(Optional.of(normalUser));
        when(userRepository.findByEmail("admin@dedocu.com")).thenReturn(Optional.of(adminUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AdminUserResponse response = adminUserService.updateUserRole(normalUserId, request, "admin@dedocu.com");

        assertThat(response).isNotNull();
        assertThat(response.getRole()).isEqualTo("ADMIN");
        verify(userRepository, times(1)).save(normalUser);
    }

    @Test
    @DisplayName("Admin tự hạ quyền của chính mình -> Báo lỗi BadRequest 400")
    void updateUserRole_SelfDemotion_ThrowsBadRequest() {
        UpdateUserRoleRequest request = UpdateUserRoleRequest.builder()
                .role("USER")
                .build();

        when(userRepository.findById(adminId)).thenReturn(Optional.of(adminUser));
        when(userRepository.findByEmail("admin@dedocu.com")).thenReturn(Optional.of(adminUser));

        assertThatThrownBy(() -> adminUserService.updateUserRole(adminId, request, "admin@dedocu.com"))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appException = (AppException) ex;
                    assertThat(appException.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(appException.getMessage()).contains("Quản trị viên không được phép tự thu hồi quyền Admin của chính mình");
                });
    }

    @Test
    @DisplayName("Lấy thống kê số lượng người dùng hệ thống thành công")
    void getUserStats_Success() {
        when(userRepository.count()).thenReturn(100L);
        when(userRepository.countByStatusIgnoreCase("ACTIVE")).thenReturn(90L);
        when(userRepository.countByStatusIgnoreCase("BANNED")).thenReturn(10L);
        when(userRepository.countByCreatedAtGreaterThanEqual(any(OffsetDateTime.class))).thenReturn(15L);

        AdminUserStatsResponse stats = adminUserService.getUserStats();

        assertThat(stats).isNotNull();
        assertThat(stats.getTotalUsers()).isEqualTo(100L);
        assertThat(stats.getActiveUsers()).isEqualTo(90L);
        assertThat(stats.getBannedUsers()).isEqualTo(10L);
        assertThat(stats.getNewUsersThisWeek()).isEqualTo(15L);
    }
}

