package com.network.user_service.service;

import com.network.user_service.dto.request.ChangePasswordRequest;
import com.network.user_service.dto.request.UpdateProfileRequest;
import com.network.user_service.dto.response.UserResponse;

public interface UserService {
    UserResponse getCurrentUserProfile(String email);
    UserResponse updateProfile(String email, UpdateProfileRequest request);
    void changePassword(String email, ChangePasswordRequest request);
    void deleteAccount(String email);
}
