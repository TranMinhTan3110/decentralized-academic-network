package com.network.user_service.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.network.user_service.dto.request.ChangePasswordRequest;
import com.network.user_service.dto.request.UpdateProfileRequest;
import com.network.user_service.dto.response.UserResponse;
import com.network.user_service.dto.response.UserSummaryDto;
import com.network.user_service.exception.GlobalExceptionHandler;
import com.network.user_service.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        mockMvc = MockMvcBuilders
                .standaloneSetup(userController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("API GET /api/v1/users/me trả về 200 OK và profile người dùng")
    void getCurrentUser_ShouldReturn200_WhenAuthenticated() throws Exception {
        String email = "student01@dedocu.vn";
        Authentication auth = new UsernamePasswordAuthenticationToken(email, null, Collections.emptyList());

        UserResponse mockResponse = UserResponse.builder()
                .id(UUID.randomUUID())
                .email(email)
                .username("student01")
                .fullName("Nguyen Van A")
                .role("USER")
                .build();

        when(userService.getCurrentUserProfile(email)).thenReturn(mockResponse);

        mockMvc.perform(get("/api/v1/users/me")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value(email))
                .andExpect(jsonPath("$.data.username").value("student01"));
    }

    @Test
    @DisplayName("API PUT /api/v1/users/me cập nhật thành công và trả về 200 OK")
    void updateProfile_ShouldReturn200_WhenValidRequest() throws Exception {
        String email = "student01@dedocu.vn";
        Authentication auth = new UsernamePasswordAuthenticationToken(email, null, Collections.emptyList());

        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .fullName("Tran Minh Tan")
                .major("Kỹ thuật Phần mềm")
                .bio("Lập trình viên nhiệt huyết")
                .universityName("Đại học Bách Khoa Hà Nội")
                .avatarUrl("https://example.com/avatar.png")
                .build();

        UserResponse mockResponse = UserResponse.builder()
                .id(UUID.randomUUID())
                .email(email)
                .username("student01")
                .fullName("Tran Minh Tan")
                .major("Kỹ thuật Phần mềm")
                .universityName("Đại học Bách Khoa Hà Nội")
                .build();

        when(userService.updateProfile(eq(email), any(UpdateProfileRequest.class))).thenReturn(mockResponse);

        mockMvc.perform(put("/api/v1/users/me")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Cập nhật thông tin tài khoản thành công"))
                .andExpect(jsonPath("$.data.fullName").value("Tran Minh Tan"))
                .andExpect(jsonPath("$.data.universityName").value("Đại học Bách Khoa Hà Nội"));
    }

    @Test
    @DisplayName("API PUT /api/v1/users/change-password đổi mật khẩu thành công và trả về 200 OK")
    void changePassword_ShouldReturn200_WhenValidRequest() throws Exception {
        String email = "student01@dedocu.vn";
        Authentication auth = new UsernamePasswordAuthenticationToken(email, null, Collections.emptyList());

        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("OldPassword@123")
                .newPassword("NewPassword@456")
                .build();

        doNothing().when(userService).changePassword(eq(email), any(ChangePasswordRequest.class));

        mockMvc.perform(put("/api/v1/users/change-password")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Đổi mật khẩu thành công"));
    }

    @Test
    @DisplayName("API PUT /api/v1/users/change-password trả về 400 Bad Request khi mật khẩu mới quá ngắn")
    void changePassword_ShouldReturn400_WhenNewPasswordTooShort() throws Exception {
        String email = "student01@dedocu.vn";
        Authentication auth = new UsernamePasswordAuthenticationToken(email, null, Collections.emptyList());

        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("OldPassword@123")
                .newPassword("123") // Less than 6 characters
                .build();

        mockMvc.perform(put("/api/v1/users/change-password")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("API GET /api/v1/users/{id}/following-ids trả về 200 OK và danh sách UUID")
    void getFollowingIds_ShouldReturn200_WithListOfUuids() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID f1 = UUID.randomUUID();
        UUID f2 = UUID.randomUUID();

        when(userService.getFollowingIds(userId)).thenReturn(List.of(f1, f2));

        mockMvc.perform(get("/api/v1/users/" + userId + "/following-ids")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Lấy danh sách ID đang theo dõi thành công"))
                .andExpect(jsonPath("$.data[0]").value(f1.toString()))
                .andExpect(jsonPath("$.data[1]").value(f2.toString()));
    }

    @Test
    @DisplayName("API GET /api/v1/users/suggested trả về 200 OK và danh sách UserSummaryDto")
    void getSuggestedUsers_ShouldReturn200_WithList() throws Exception {
        UserSummaryDto user1 = UserSummaryDto.builder()
                .id(UUID.randomUUID())
                .username("auduongtan")
                .fullName("Âu Dương Tấn")
                .badge("Chuyên gia AI")
                .points(150)
                .universityName("ĐH Bách Khoa")
                .build();

        when(userService.getSuggestedUsers(any(), eq(5))).thenReturn(List.of(user1));

        mockMvc.perform(get("/api/v1/users/suggested?limit=5")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Lấy danh sách gợi ý theo dõi thành công"))
                .andExpect(jsonPath("$.data[0].username").value("auduongtan"))
                .andExpect(jsonPath("$.data[0].badge").value("Chuyên gia AI"))
                .andExpect(jsonPath("$.data[0].points").value(150));
    }

    @Test
    @DisplayName("API GET /api/v1/users/{id}/summary trả về 200 OK và UserSummaryDto")
    void getUserSummary_ShouldReturn200_WithSummary() throws Exception {
        UUID userId = UUID.randomUUID();
        UserSummaryDto summary = UserSummaryDto.builder()
                .id(userId)
                .username("testauthor")
                .fullName("Test Author")
                .badge("Tiến sĩ")
                .points(200)
                .build();

        when(userService.getUserSummary(userId)).thenReturn(summary);

        mockMvc.perform(get("/api/v1/users/" + userId + "/summary")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(userId.toString()))
                .andExpect(jsonPath("$.data.username").value("testauthor"));
    }
}
