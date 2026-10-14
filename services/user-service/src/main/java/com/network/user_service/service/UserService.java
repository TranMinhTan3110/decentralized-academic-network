package com.network.user_service.service;

import com.network.user_service.dto.response.UserResponse;

public interface UserService {
    UserResponse getCurrentUserProfile(String email);
}
