package com.network.document_service.service.impl;

import com.network.document_service.dto.response.PageResponse;
import com.network.document_service.entity.Notification;
import com.network.document_service.exception.ForbiddenException;
import com.network.document_service.repository.NotificationRepository;
import com.network.document_service.service.NotificationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private static final long SSE_TIMEOUT_MS = 30 * 60 * 1000L; // 30 phút
    private static final Set<String> SELF_ALLOWED_TYPES = Set.of(
            "BADGE_EARNED", "TIER_UP", "MODERATION", "DOCUMENT_APPROVED", "SYSTEM"
    );

    private final NotificationRepository notificationRepository;
    private final Map<UUID, CopyOnWriteArrayList<SseEmitter>> userEmitters = new ConcurrentHashMap<>();

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
    public void deleteNotification(UUID notificationId, UUID recipientUserId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ForbiddenException("Thông báo không tồn tại"));
        if (!notification.getRecipientUserId().equals(recipientUserId)) {
            throw new ForbiddenException("Bạn không có quyền xóa thông báo này");
        }
        notificationRepository.delete(notification);
    }

    @Override
    @Transactional(readOnly = true)
    public long countUnread(UUID recipientUserId) {
        return notificationRepository.countByRecipientUserIdAndIsReadFalse(recipientUserId);
    }

    @Override
    public void createNotification(UUID recipientUserId, UUID actorUserId, UUID documentId,
                                   String type, String title, String content) {
        String normalizedType = type != null ? type.trim().toUpperCase() : "SYSTEM";
        if (recipientUserId == null) {
            return;
        }
        if (actorUserId != null && recipientUserId.equals(actorUserId) && !SELF_ALLOWED_TYPES.contains(normalizedType)) {
            return; // Không tự thông báo cho chính mình với các tương tác thông thường
        }

        // Chống spam thông báo: Với tương tác like/bookmark từ cùng 1 người trên cùng 1 tài liệu trong vòng 5 phút, bỏ qua không bắn lại
        if (actorUserId != null && documentId != null && ("DOCUMENT_LIKED".equals(normalizedType) || "DOCUMENT_BOOKMARKED".equals(normalizedType))) {
            java.time.OffsetDateTime fiveMinutesAgo = java.time.OffsetDateTime.now().minusMinutes(5);
            boolean recentlySent = notificationRepository.existsByRecipientUserIdAndActorUserIdAndDocumentIdAndNotificationTypeAndCreatedAtAfter(
                    recipientUserId, actorUserId, documentId, normalizedType, fiveMinutesAgo);
            if (recentlySent) {
                return;
            }
        }
        try {
            Notification saved = notificationRepository.save(Notification.builder()
                    .recipientUserId(recipientUserId)
                    .actorUserId(actorUserId)
                    .documentId(documentId)
                    .notificationType(normalizedType)
                    .title(title)
                    .content(content)
                    .isRead(false)
                    .build());
            pushToUser(recipientUserId, saved);
        } catch (Exception ex) {
            // Notification failure không được phá flow chính (best-effort)
        }
    }

    @Override
    @Transactional(readOnly = true)
    public SseEmitter subscribe(UUID userId) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MS);
        CopyOnWriteArrayList<SseEmitter> emitters = userEmitters.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>());
        emitters.add(emitter);

        Runnable cleanup = () -> removeEmitter(userId, emitter);
        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(e -> cleanup.run());

        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data(Map.of("status", "connected", "userId", userId.toString()), MediaType.APPLICATION_JSON));
        } catch (IOException ex) {
            removeEmitter(userId, emitter);
        }

        return emitter;
    }

    private void pushToUser(UUID userId, Notification notification) {
        CopyOnWriteArrayList<SseEmitter> emitters = userEmitters.get(userId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("notification")
                        .data(notification, MediaType.APPLICATION_JSON));
            } catch (Exception ex) {
                removeEmitter(userId, emitter);
            }
        }
    }

    private void removeEmitter(UUID userId, SseEmitter emitter) {
        CopyOnWriteArrayList<SseEmitter> emitters = userEmitters.get(userId);
        if (emitters != null) {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                userEmitters.remove(userId, emitters);
            }
        }
    }
}