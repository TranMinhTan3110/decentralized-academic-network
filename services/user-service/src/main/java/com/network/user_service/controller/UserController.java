package com.network.user_service.controller;

import com.network.user_service.config.InternalApiProperties;
import com.network.user_service.dto.request.ChangePasswordRequest;
import com.network.user_service.dto.request.DeductPointsRequest;
import com.network.user_service.dto.request.UpdateProfileRequest;
import com.network.user_service.dto.response.ApiResponse;
import com.network.user_service.dto.response.BadgeResponse;
import com.network.user_service.dto.response.FollowResponse;
import com.network.user_service.dto.response.UserResponse;
import com.network.user_service.dto.response.UserSummaryDto;
import com.network.user_service.exception.AppException;
import com.network.user_service.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

        private final UserService userService;
        private final InternalApiProperties internalApiProperties;

        public UserController(UserService userService, InternalApiProperties internalApiProperties) {
                this.userService = userService;
                this.internalApiProperties = internalApiProperties;
        }

        @GetMapping("/badges/catalog")
        public ResponseEntity<ApiResponse<List<BadgeResponse>>> getAllBadges() {
                List<BadgeResponse> badges = userService.getAllAvailableBadges();

                return ResponseEntity.ok(
                                ApiResponse.<List<BadgeResponse>>builder()
                                                .success(true)
                                                .message("Lấy danh mục huy hiệu thành công")
                                                .data(badges)
                                                .build());
        }

        @PostMapping("/{identifier}/award-badge/{badgeCode}")
        public ResponseEntity<ApiResponse<Void>> awardBadge(
                        @PathVariable("identifier") String identifier,
                        @PathVariable("badgeCode") String badgeCode) {
                userService.awardBadgeToUser(identifier, badgeCode);

                return ResponseEntity.ok(
                                ApiResponse.<Void>builder()
                                                .success(true)
                                                .message("Gán huy hiệu cho người dùng thành công")
                                                .build());
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
                                                .build());
        }

        @GetMapping("/public/{identifier}")
        public ResponseEntity<ApiResponse<UserResponse>> getPublicProfile(
                        @PathVariable("identifier") String identifier) {
                UserResponse userResponse = userService.getPublicUserProfile(identifier);

                return ResponseEntity.ok(
                                ApiResponse.<UserResponse>builder()
                                                .success(true)
                                                .message("Lấy thông tin hồ sơ công khai thành công")
                                                .data(userResponse)
                                                .build());
        }

        @GetMapping("/{identifier}/badges")
        public ResponseEntity<ApiResponse<List<BadgeResponse>>> getUserBadges(
                        @PathVariable("identifier") String identifier) {
                List<BadgeResponse> badges = userService.getUserBadges(identifier);

                return ResponseEntity.ok(
                                ApiResponse.<List<BadgeResponse>>builder()
                                                .success(true)
                                                .message("Lấy danh sách huy hiệu thành công")
                                                .data(badges)
                                                .build());
        }

        @GetMapping("/{identifier}/is-following")
        public ResponseEntity<ApiResponse<Boolean>> isFollowing(
                        Authentication authentication,
                        @PathVariable("identifier") String identifier) {
                String email = (authentication != null && authentication.isAuthenticated()) ? authentication.getName()
                                : null;
                Boolean isFollowing = userService.isFollowing(email, identifier);

                return ResponseEntity.ok(
                                ApiResponse.<Boolean>builder()
                                                .success(true)
                                                .message("Kiểm tra trạng thái theo dõi thành công")
                                                .data(isFollowing)
                                                .build());
        }

        @PostMapping("/{identifier}/toggle-follow")
        public ResponseEntity<ApiResponse<FollowResponse>> toggleFollow(
                        Authentication authentication,
                        @PathVariable("identifier") String identifier) {
                String email = authentication.getName();
                FollowResponse response = userService.toggleFollow(email, identifier);

                return ResponseEntity.ok(
                                ApiResponse.<FollowResponse>builder()
                                                .success(true)
                                                .message(Boolean.TRUE.equals(response.getIsFollowing())
                                                                ? "Đã theo dõi thành công"
                                                                : "Đã hủy theo dõi thành công")
                                                .data(response)
                                                .build());
        }

        @PutMapping("/me")
        public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
                        Authentication authentication,
                        @Valid @RequestBody UpdateProfileRequest request) {
                String email = authentication.getName();
                UserResponse userResponse = userService.updateProfile(email, request);

                return ResponseEntity.ok(
                                ApiResponse.<UserResponse>builder()
                                                .success(true)
                                                .message("Cập nhật thông tin tài khoản thành công")
                                                .data(userResponse)
                                                .build());
        }

        @PutMapping("/change-password")
        public ResponseEntity<ApiResponse<Void>> changePassword(
                        Authentication authentication,
                        @Valid @RequestBody ChangePasswordRequest request) {
                String email = authentication.getName();
                userService.changePassword(email, request);

                return ResponseEntity.ok(
                                ApiResponse.<Void>builder()
                                                .success(true)
                                                .message("Đổi mật khẩu thành công")
                                                .build());
        }

        @DeleteMapping("/me")
        public ResponseEntity<ApiResponse<Void>> deleteAccount(Authentication authentication) {
                String email = authentication.getName();
                userService.deleteAccount(email);

                return ResponseEntity.ok(
                                ApiResponse.<Void>builder()
                                                .success(true)
                                                .message("Tài khoản đã được xóa thành công")
                                                .build());
        }

        // ===================== Internal service-to-service endpoints =====================
        // Được document-service gọi để hiển thị tác giả và thực hiện giao dịch điểm.
        // Các endpoint ghi (deduct-points) bắt buộc phải có X-Internal-Api-Key hợp lệ.

        @GetMapping("/{id}/summary")
        public ResponseEntity<ApiResponse<UserSummaryDto>> getUserSummary(@PathVariable("id") UUID id) {
                UserSummaryDto summary = userService.getUserSummary(id);
                return ResponseEntity.ok(ApiResponse.<UserSummaryDto>builder()
                                .success(true)
                                .message("Lấy thông tin tác giả thành công")
                                .data(summary)
                                .build());
        }

        @GetMapping("/batch")
        public ResponseEntity<ApiResponse<List<UserSummaryDto>>> getUserSummariesBatch(
                        @RequestParam(name = "ids") List<UUID> ids) {
                List<UserSummaryDto> summaries = userService.getUserSummariesBatch(ids);
                return ResponseEntity.ok(ApiResponse.<List<UserSummaryDto>>builder()
                                .success(true)
                                .message("Lấy danh sách tác giả thành công")
                                .data(summaries)
                                .build());
        }

        @GetMapping("/{id}/balance")
        public ResponseEntity<ApiResponse<Map<String, Integer>>> getBalance(
                        @PathVariable("id") UUID id,
                        @RequestHeader(value = "X-Internal-Api-Key", required = false) String internalKey) {
                requireInternalKey(internalKey);
                int balance = userService.getBalance(id);
                return ResponseEntity.ok(ApiResponse.<Map<String, Integer>>builder()
                                .success(true)
                                .message("Lấy số dư điểm thành công")
                                .data(Map.of("balance", balance))
                                .build());
        }

        @PostMapping("/{id}/deduct-points")
        public ResponseEntity<ApiResponse<Map<String, Integer>>> deductPoints(
                        @PathVariable("id") UUID id,
                        @Valid @RequestBody DeductPointsRequest request,
                        @RequestHeader(value = "X-Internal-Api-Key", required = false) String internalKey) {
                requireInternalKey(internalKey);
                int remainingBalance = userService.deductPoints(id, request.getPoints(), request.getIdempotencyKey());
                return ResponseEntity.ok(ApiResponse.<Map<String, Integer>>builder()
                                .success(true)
                                .message("Trừ điểm thành công")
                                .data(Map.of("balance", remainingBalance))
                                .build());
        }

        private void requireInternalKey(String providedKey) {
                String expected = internalApiProperties != null ? internalApiProperties.getKey() : null;
                if (expected == null || expected.isBlank()) {
                        return; // Chế độ dev: chưa cấu hình key
                }
                if (!expected.equals(providedKey)) {
                        throw new AppException("Internal API key không hợp lệ", HttpStatus.UNAUTHORIZED);
                }
        }
}
