package com.network.user_service.controller;

import com.network.user_service.dto.request.ChangePasswordRequest;
import com.network.user_service.dto.request.UpdateProfileRequest;
import com.network.user_service.dto.response.ApiResponse;
import com.network.user_service.dto.response.UserResponse;
import com.network.user_service.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

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

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        String email = authentication.getName();
        UserResponse userResponse = userService.updateProfile(email, request);

        return ResponseEntity.ok(
                ApiResponse.<UserResponse>builder()
                        .success(true)
                        .message("Cập nhật thông tin tài khoản thành công")
                        .data(userResponse)
                        .build()
        );
    }

    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        String email = authentication.getName();
        userService.changePassword(email, request);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("Đổi mật khẩu thành công")
                        .build()
        );
    }
}
