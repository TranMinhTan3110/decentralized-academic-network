package com.network.document_service.service.impl;

import com.network.document_service.entity.Notification;
import com.network.document_service.repository.NotificationRepository;
import com.network.document_service.service.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationServiceImpl(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Notification> getMyNotifications(UUID recipientUserId) {
        return notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc(recipientUserId);
    }

    @Override
    public void markAsRead(UUID notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setIsRead(true);
            notificationRepository.save(n);
        });
    }

    @Override
    public void markAllAsRead(UUID recipientUserId) {
        notificationRepository.markAllAsReadByUserId(recipientUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public long countUnread(UUID recipientUserId) {
        return notificationRepository.countByRecipientUserIdAndIsReadFalse(recipientUserId);
    }
}
