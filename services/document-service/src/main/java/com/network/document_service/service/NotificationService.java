package com.network.document_service.service;

import com.network.document_service.entity.Notification;

import java.util.List;
import java.util.UUID;

public interface NotificationService {
    List<Notification> getMyNotifications(UUID recipientUserId);
    void markAsRead(UUID notificationId);
    void markAllAsRead(UUID recipientUserId);
    long countUnread(UUID recipientUserId);
}
