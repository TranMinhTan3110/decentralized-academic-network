package com.network.user_service.controller;

import com.network.user_service.dto.request.UpdateUserRoleRequest;
import com.network.user_service.dto.request.UpdateUserStatusRequest;
import com.network.user_service.dto.response.AdminUserResponse;
import com.network.user_service.dto.response.AdminUserStatsResponse;
import com.network.user_service.dto.response.ApiResponse;
import com.network.user_service.service.AdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminUserResponse>>> getUsers(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "universityId", required = false) UUID universityId) {
        Page<AdminUserResponse> users = adminUserService.getUsers(page, size, search, role, status, universityId);
        return ResponseEntity.ok(ApiResponse.success(users, "Lấy danh sách người dùng thành công"));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AdminUserStatsResponse>> getUserStats() {
        AdminUserStatsResponse stats = adminUserService.getUserStats();
        return ResponseEntity.ok(ApiResponse.success(stats, "Lấy thống kê người dùng thành công"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminUserResponse>> getUserById(@PathVariable("id") UUID id) {
        AdminUserResponse user = adminUserService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(user, "Lấy thông tin người dùng thành công"));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<AdminUserResponse>> updateUserStatus(
            @PathVariable("id") UUID id,
            @Valid @RequestBody UpdateUserStatusRequest request,
            Authentication authentication) {
        String currentAdminEmail = authentication.getName();
        AdminUserResponse response = adminUserService.updateUserStatus(id, request, currentAdminEmail);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật trạng thái người dùng thành công"));
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<ApiResponse<AdminUserResponse>> updateUserRole(
            @PathVariable("id") UUID id,
            @Valid @RequestBody UpdateUserRoleRequest request,
            Authentication authentication) {
        String currentAdminEmail = authentication.getName();
        AdminUserResponse response = adminUserService.updateUserRole(id, request, currentAdminEmail);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật vai trò người dùng thành công"));
    }
}

