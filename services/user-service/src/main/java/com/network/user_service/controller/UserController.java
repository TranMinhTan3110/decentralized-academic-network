package com.network.user_service.controller;

import com.network.user_service.dto.response.ApiResponse;
import com.network.user_service.dto.response.UserResponse;
import com.network.user_service.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        UserResponse userResponse = userService.getCurrentUserProfile(email);

        return ResponseEntity.ok(
                ApiResponse.<UserResponse>builder()
                        .success(true)
                        .message("Lấy thông tin tài khoản thành công")
                        .data(userResponse)
                        .build()
        );
    }
}
