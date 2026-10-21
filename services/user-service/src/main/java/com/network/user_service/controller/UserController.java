package com.network.user_service.controller;

import com.network.user_service.dto.request.ChangePasswordRequest;
import com.network.user_service.dto.request.UpdateProfileRequest;
import com.network.user_service.dto.response.ApiResponse;
import com.network.user_service.dto.response.BadgeResponse;
import com.network.user_service.dto.response.FollowResponse;
import com.network.user_service.dto.response.UserResponse;
import com.network.user_service.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/badges/catalog")
    public ResponseEntity<ApiResponse<List<BadgeResponse>>> getAllBadges() {
        List<BadgeResponse> badges = userService.getAllAvailableBadges();

        return ResponseEntity.ok(
                ApiResponse.<List<BadgeResponse>>builder()
                        .success(true)
                        .message("Lấy danh mục huy hiệu thành công")
                        .data(badges)
                        .build()
        );
    }

    @PostMapping("/{identifier}/award-badge/{badgeCode}")
    public ResponseEntity<ApiResponse<Void>> awardBadge(
            @PathVariable("identifier") String identifier,
            @PathVariable("badgeCode") String badgeCode
    ) {
        userService.awardBadgeToUser(identifier, badgeCode);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("Gán huy hiệu cho người dùng thành công")
                        .build()
        );
    }

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

    @GetMapping("/public/{identifier}")
    public ResponseEntity<ApiResponse<UserResponse>> getPublicProfile(@PathVariable("identifier") String identifier) {
        UserResponse userResponse = userService.getPublicUserProfile(identifier);

        return ResponseEntity.ok(
                ApiResponse.<UserResponse>builder()
                        .success(true)
                        .message("Lấy thông tin hồ sơ công khai thành công")
                        .data(userResponse)
                        .build()
        );
    }

    @GetMapping("/{identifier}/badges")
    public ResponseEntity<ApiResponse<List<BadgeResponse>>> getUserBadges(@PathVariable("identifier") String identifier) {
        List<BadgeResponse> badges = userService.getUserBadges(identifier);

        return ResponseEntity.ok(
                ApiResponse.<List<BadgeResponse>>builder()
                        .success(true)
                        .message("Lấy danh sách huy hiệu thành công")
                        .data(badges)
                        .build()
        );
    }

    @GetMapping("/{identifier}/is-following")
    public ResponseEntity<ApiResponse<Boolean>> isFollowing(
            Authentication authentication,
            @PathVariable("identifier") String identifier
    ) {
        String email = (authentication != null && authentication.isAuthenticated()) ? authentication.getName() : null;
        Boolean isFollowing = userService.isFollowing(email, identifier);

        return ResponseEntity.ok(
                ApiResponse.<Boolean>builder()
                        .success(true)
                        .message("Kiểm tra trạng thái theo dõi thành công")
                        .data(isFollowing)
                        .build()
        );
    }

    @PostMapping("/{identifier}/toggle-follow")
    public ResponseEntity<ApiResponse<FollowResponse>> toggleFollow(
            Authentication authentication,
            @PathVariable("identifier") String identifier
    ) {
        String email = authentication.getName();
        FollowResponse response = userService.toggleFollow(email, identifier);

        return ResponseEntity.ok(
                ApiResponse.<FollowResponse>builder()
                        .success(true)
                        .message(Boolean.TRUE.equals(response.getIsFollowing()) ? "Đã theo dõi thành công" : "Đã hủy theo dõi thành công")
                        .data(response)
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

    @DeleteMapping("/me")
    public ResponseEntity<ApiResponse<Void>> deleteAccount(Authentication authentication) {
        String email = authentication.getName();
        userService.deleteAccount(email);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("Tài khoản đã được xóa thành công")
                        .build()
        );
    }
}
