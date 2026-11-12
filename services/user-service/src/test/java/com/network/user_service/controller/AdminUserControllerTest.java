package com.network.user_service.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.data.web.config.SpringDataJacksonConfiguration;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import com.network.user_service.dto.request.UpdateUserRoleRequest;
import com.network.user_service.dto.request.UpdateUserStatusRequest;
import com.network.user_service.dto.response.AdminUserResponse;
import com.network.user_service.dto.response.AdminUserStatsResponse;
import com.network.user_service.exception.AppException;
import com.network.user_service.exception.GlobalExceptionHandler;
import com.network.user_service.service.AdminUserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminUserControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private AdminUserService adminUserService;

    @InjectMocks
    private AdminUserController adminUserController;

    private final UUID testUserId = UUID.randomUUID();
    private Authentication adminAuth;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.registerModule(new SpringDataJacksonConfiguration().pageModule());

        MappingJackson2HttpMessageConverter messageConverter = new MappingJackson2HttpMessageConverter();
        messageConverter.setObjectMapper(objectMapper);

        mockMvc = MockMvcBuilders
                .standaloneSetup(adminUserController)
                .setMessageConverters(messageConverter)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        adminAuth = new UsernamePasswordAuthenticationToken(
                "admin@dedocu.com",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
    }

    private AdminUserResponse createSampleUserResponse() {
        return AdminUserResponse.builder()
                .id(testUserId)
                .username("scholar_node")
                .fullName("Nguyen Van Hoc")
                .email("scholar@dedocu.com")
                .avatarUrl("https://example.com/avatar.png")
                .universityName("Đại học Bách Khoa")
                .major("Công nghệ thông tin")
                .role("USER")
                .status("ACTIVE")
                .totalUploads(48)
                .reputationPoints(612)
                .scholarTitle("Cao thủ")
                .createdAt(OffsetDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Admin gọi GET /api/v1/admin/users thành công trả về 200 OK và Page users")
    void getUsers_WithAdminAuth_ShouldReturn200() throws Exception {
        AdminUserResponse userResponse = createSampleUserResponse();
        Page<AdminUserResponse> page = new PageImpl<>(List.of(userResponse));

        when(adminUserService.getUsers(anyInt(), anyInt(), any(), any(), any(), any()))
                .thenReturn(page);

        mockMvc.perform(get("/api/v1/admin/users")
                        .principal(adminAuth)
                        .param("page", "0")
                        .param("size", "20")
                        .param("search", "scholar")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].username").value("scholar_node"))
                .andExpect(jsonPath("$.data.content[0].totalUploads").value(48))
                .andExpect(jsonPath("$.data.content[0].reputationPoints").value(612))
                .andExpect(jsonPath("$.data.content[0].scholarTitle").value("Cao thủ"));
    }

    @Test
    @DisplayName("Admin gọi GET /api/v1/admin/users/{id} trả về 200 OK và chi tiết người dùng")
    void getUserById_WithAdminAuth_ShouldReturn200() throws Exception {
        AdminUserResponse userResponse = createSampleUserResponse();
        when(adminUserService.getUserById(testUserId)).thenReturn(userResponse);

        mockMvc.perform(get("/api/v1/admin/users/{id}", testUserId)
                        .principal(adminAuth)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(testUserId.toString()))
                .andExpect(jsonPath("$.data.email").value("scholar@dedocu.com"));
    }

    @Test
    @DisplayName("Admin gọi PUT /api/v1/admin/users/{id}/status thành công trả về 200 OK")
    void updateUserStatus_Success_ShouldReturn200() throws Exception {
        UpdateUserStatusRequest request = UpdateUserStatusRequest.builder()
                .status("BANNED")
                .reason("Vi phạm chính sách nội dung")
                .build();

        AdminUserResponse userResponse = createSampleUserResponse();
        userResponse.setStatus("BANNED");

        when(adminUserService.updateUserStatus(eq(testUserId), any(UpdateUserStatusRequest.class), anyString()))
                .thenReturn(userResponse);

        mockMvc.perform(put("/api/v1/admin/users/{id}/status", testUserId)
                        .principal(adminAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("BANNED"));
    }

    @Test
    @DisplayName("Admin thử tự khóa tài khoản của mình -> Báo lỗi BadRequest 400")
    void updateUserStatus_SelfBan_ShouldReturn400() throws Exception {
        UpdateUserStatusRequest request = UpdateUserStatusRequest.builder()
                .status("BANNED")
                .reason("Tự khóa")
                .build();

        when(adminUserService.updateUserStatus(eq(testUserId), any(UpdateUserStatusRequest.class), anyString()))
                .thenThrow(new AppException("Quản trị viên không được phép tự khóa tài khoản của chính mình", HttpStatus.BAD_REQUEST));

        mockMvc.perform(put("/api/v1/admin/users/{id}/status", testUserId)
                        .principal(adminAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Quản trị viên không được phép tự khóa tài khoản của chính mình"));
    }

    @Test
    @DisplayName("Cập nhật trạng thái người dùng với body rỗng -> Báo lỗi BadRequest 400 (Validation)")
    void updateUserStatus_BlankStatus_ShouldReturn400() throws Exception {
        UpdateUserStatusRequest request = UpdateUserStatusRequest.builder()
                .status("")
                .build();

        mockMvc.perform(put("/api/v1/admin/users/{id}/status", testUserId)
                        .principal(adminAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Admin gọi PUT /api/v1/admin/users/{id}/role thành công trả về 200 OK")
    void updateUserRole_Success_ShouldReturn200() throws Exception {
        UpdateUserRoleRequest request = UpdateUserRoleRequest.builder()
                .role("ADMIN")
                .build();

        AdminUserResponse userResponse = createSampleUserResponse();
        userResponse.setRole("ADMIN");

        when(adminUserService.updateUserRole(eq(testUserId), any(UpdateUserRoleRequest.class), anyString()))
                .thenReturn(userResponse);

        mockMvc.perform(put("/api/v1/admin/users/{id}/role", testUserId)
                        .principal(adminAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.role").value("ADMIN"));
    }

    @Test
    @DisplayName("Cập nhật vai trò người dùng với body rỗng -> Báo lỗi BadRequest 400 (Validation)")
    void updateUserRole_BlankRole_ShouldReturn400() throws Exception {
        UpdateUserRoleRequest request = UpdateUserRoleRequest.builder()
                .role("")
                .build();

        mockMvc.perform(put("/api/v1/admin/users/{id}/role", testUserId)
                        .principal(adminAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Admin gọi GET /api/v1/admin/users/stats thành công trả về số liệu thống kê")
    void getUserStats_WithAdminAuth_ShouldReturn200() throws Exception {
        AdminUserStatsResponse statsResponse = AdminUserStatsResponse.builder()
                .totalUsers(120L)
                .activeUsers(110L)
                .bannedUsers(10L)
                .newUsersThisWeek(18L)
                .build();

        when(adminUserService.getUserStats()).thenReturn(statsResponse);

        mockMvc.perform(get("/api/v1/admin/users/stats")
                        .principal(adminAuth)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalUsers").value(120))
                .andExpect(jsonPath("$.data.activeUsers").value(110))
                .andExpect(jsonPath("$.data.bannedUsers").value(10))
                .andExpect(jsonPath("$.data.newUsersThisWeek").value(18));
    }

    @Test
    @DisplayName("Xác nhận controller có khai báo @PreAuthorize(\"hasRole('ADMIN')\")")
    void controllerHasAdminPreAuthorizeAnnotation() {
        PreAuthorize annotation = AdminUserController.class.getAnnotation(PreAuthorize.class);
        assertThat(annotation).isNotNull();
        assertThat(annotation.value()).isEqualTo("hasRole('ADMIN')");
    }
}
