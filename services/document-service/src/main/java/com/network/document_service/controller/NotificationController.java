package com.network.document_service.controller;

import com.network.document_service.config.SecurityContextHolder;
import com.network.document_service.dto.response.ApiResponse;
import com.network.document_service.entity.Notification;
import com.network.document_service.exception.UnauthorizedException;
import com.network.document_service.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping({"/api/notifications", "/api/v1/notifications"})
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    private UUID getRequiredUserId() {
        UUID userId = SecurityContextHolder.getUserId();
        if (userId == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để xem thông báo");
        }
        return userId;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Notification>>> getMyNotifications() {
        UUID userId = getRequiredUserId();
        List<Notification> list = notificationService.getMyNotifications(userId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount() {
        UUID userId = getRequiredUserId();
        long count = notificationService.countUnread(userId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("unreadCount", count)));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable UUID id) {
        getRequiredUserId();
        notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success("Đã đánh dấu đã đọc", null));
    }

    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead() {
        UUID userId = getRequiredUserId();
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(ApiResponse.success("Đã đánh dấu tất cả thông báo là đã đọc", null));
    }
}
