package com.network.document_service.service;

import com.network.document_service.dto.response.PageResponse;
import com.network.document_service.entity.Notification;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface NotificationService {
    List<Notification> getMyNotifications(UUID recipientUserId);
    PageResponse<Notification> getMyNotificationsPaged(UUID recipientUserId, Pageable pageable);
    void markAsRead(UUID notificationId, UUID recipientUserId);
    void markAllAsRead(UUID recipientUserId);
    long countUnread(UUID recipientUserId);

    void createNotification(UUID recipientUserId, UUID actorUserId, UUID documentId,
                            String type, String title, String content);
}