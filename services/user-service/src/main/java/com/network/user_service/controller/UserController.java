package com.network.user_service.controller;

import com.network.user_service.config.InternalApiProperties;
import com.network.user_service.dto.request.DeductPointsRequest;
import com.network.user_service.dto.response.ApiResponse;
import com.network.user_service.dto.response.UserResponse;
import com.network.user_service.dto.response.UserSummaryDto;
import com.network.user_service.exception.AppException;
import com.network.user_service.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final InternalApiProperties internalApiProperties;

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

    // ===================== Internal service-to-service endpoints =====================
    // Được document-service gọi để hiển thị tác giả và thực hiện giao dịch điểm.
    // Các endpoint ghi (deduct-points) bắt buộc phải có X-Internal-Api-Key hợp lệ.

    @GetMapping("/{id}/summary")
    public ResponseEntity<ApiResponse<UserSummaryDto>> getUserSummary(@PathVariable UUID id) {
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
            @PathVariable UUID id,
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
            @PathVariable UUID id,
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
        String expected = internalApiProperties.getKey();
        if (expected == null || expected.isBlank()) {
            return; // Chế độ dev: chưa cấu hình key
        }
        if (!expected.equals(providedKey)) {
            throw new AppException("Internal API key không hợp lệ", HttpStatus.UNAUTHORIZED);
        }
    }
}
