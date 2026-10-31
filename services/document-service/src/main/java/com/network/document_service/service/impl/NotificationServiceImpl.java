package com.network.document_service.service.impl;

import com.network.document_service.dto.response.PageResponse;
import com.network.document_service.entity.Notification;
import com.network.document_service.exception.ForbiddenException;
import com.network.document_service.repository.NotificationRepository;
import com.network.document_service.service.NotificationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
    @Transactional(readOnly = true)
    public PageResponse<Notification> getMyNotificationsPaged(UUID recipientUserId, Pageable pageable) {
        Page<Notification> page = notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc(recipientUserId, pageable);
        return PageResponse.<Notification>builder()
                .content(page.getContent())
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    @Override
    public void markAsRead(UUID notificationId, UUID recipientUserId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ForbiddenException("Thông báo không tồn tại"));
        // Ownership check: user A không được đánh dấu thông báo của user B
        if (!notification.getRecipientUserId().equals(recipientUserId)) {
            throw new ForbiddenException("Bạn không có quyền thao tác với thông báo này");
        }
        notification.setIsRead(true);
        notificationRepository.save(notification);
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

    @Override
    public void createNotification(UUID recipientUserId, UUID actorUserId, UUID documentId,
                                   String type, String title, String content) {
        if (recipientUserId == null || recipientUserId.equals(actorUserId)) {
            return; // Không tự thông báo cho chính mình
        }
        try {
            notificationRepository.save(Notification.builder()
                    .recipientUserId(recipientUserId)
                    .actorUserId(actorUserId)
                    .documentId(documentId)
                    .notificationType(type)
                    .title(title)
                    .content(content)
                    .isRead(false)
                    .build());
        } catch (Exception ex) {
            // Notification failure không được phá flow chính (best-effort)
        }
    }
}