package com.network.user_service.service;

import com.network.user_service.dto.request.UpdateUserRoleRequest;
import com.network.user_service.dto.request.UpdateUserStatusRequest;
import com.network.user_service.dto.response.AdminUserResponse;
import com.network.user_service.dto.response.AdminUserStatsResponse;
import org.springframework.data.domain.Page;

import java.util.UUID;

public interface AdminUserService {

    Page<AdminUserResponse> getUsers(int page, int size, String search, String role, String status, UUID universityId);

    AdminUserResponse getUserById(UUID id);

    AdminUserResponse updateUserStatus(UUID targetUserId, UpdateUserStatusRequest request, String currentAdminEmail);

    AdminUserResponse updateUserRole(UUID targetUserId, UpdateUserRoleRequest request, String currentAdminEmail);

    AdminUserStatsResponse getUserStats();
}

