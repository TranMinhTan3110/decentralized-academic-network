package com.network.document_service.service;

import com.network.document_service.entity.Notification;
import com.network.document_service.repository.NotificationRepository;
import com.network.document_service.service.impl.NotificationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class NotificationServiceTest {

    private NotificationRepository repo;
    private NotificationService service;

    @BeforeEach
    void setUp() {
        repo = mock(NotificationRepository.class);
        service = new NotificationServiceImpl(repo);
    }

    @Test
    void getMyNotifications_shouldReturnList() {
        UUID userId = UUID.randomUUID();
        when(repo.findByRecipientUserIdOrderByCreatedAtDesc(userId)).thenReturn(List.of(
                Notification.builder().title("Lượt thích mới").recipientUserId(userId).build()
        ));

        var list = service.getMyNotifications(userId);
        assertEquals(1, list.size());
        assertEquals("Lượt thích mới", list.get(0).getTitle());
    }

    @Test
    void markAsRead_shouldSetTrue() {
        UUID notiId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        Notification n = Notification.builder().id(notiId).recipientUserId(ownerId).isRead(false).build();
        when(repo.findById(notiId)).thenReturn(Optional.of(n));

        service.markAsRead(notiId, ownerId);
        assertTrue(n.getIsRead());
        verify(repo).save(n);
    }

    @Test
    void markAsRead_ofOtherUser_shouldThrowForbidden() {
        UUID notiId = UUID.randomUUID();
        Notification n = Notification.builder().id(notiId).recipientUserId(UUID.randomUUID()).isRead(false).build();
        when(repo.findById(notiId)).thenReturn(Optional.of(n));

        assertThrows(com.network.document_service.exception.ForbiddenException.class,
                () -> service.markAsRead(notiId, UUID.randomUUID()));
        verify(repo, never()).save(any());
    }

    @Test
    void countUnread_shouldReturnCount() {
        UUID userId = UUID.randomUUID();
        when(repo.countByRecipientUserIdAndIsReadFalse(userId)).thenReturn(5L);

        long count = service.countUnread(userId);
        assertEquals(5L, count);
    }

    @Test
    void markAllAsRead_shouldCallRepo() {
        UUID userId = UUID.randomUUID();
        service.markAllAsRead(userId);
        verify(repo).markAllAsReadByUserId(userId);
    }

    @Test
    void deleteNotification_whenOwner_shouldDelete() {
        UUID notiId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        Notification n = Notification.builder().id(notiId).recipientUserId(ownerId).build();
        when(repo.findById(notiId)).thenReturn(Optional.of(n));

        service.deleteNotification(notiId, ownerId);
        verify(repo).delete(n);
    }

    @Test
    void deleteNotification_whenNotOwner_shouldThrowForbidden() {
        UUID notiId = UUID.randomUUID();
        Notification n = Notification.builder().id(notiId).recipientUserId(UUID.randomUUID()).build();
        when(repo.findById(notiId)).thenReturn(Optional.of(n));

        assertThrows(com.network.document_service.exception.ForbiddenException.class,
                () -> service.deleteNotification(notiId, UUID.randomUUID()));
        verify(repo, never()).delete(any());
    }

    @Test
    void createNotification_andSubscribe_shouldSaveAndPush() {
        UUID recipientId = UUID.randomUUID();
        UUID actorId = UUID.randomUUID();
        UUID docId = UUID.randomUUID();

        var emitter = service.subscribe(recipientId);
        assertNotNull(emitter);

        when(repo.save(any(Notification.class))).thenAnswer(inv -> {
            Notification saved = inv.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        service.createNotification(recipientId, actorId, docId, "DOCUMENT_LIKED", "Title", "Content");
        verify(repo).save(any(Notification.class));
    }

    @Test
    void createNotification_selfInteraction_shouldSkipUnlessBadgeOrTier() {
        UUID userId = UUID.randomUUID();
        service.createNotification(userId, userId, UUID.randomUUID(), "DOCUMENT_LIKED", "Self like", "Content");
        verify(repo, never()).save(any());

        service.createNotification(userId, userId, null, "BADGE_EARNED", "Badge", "Content");
        verify(repo, times(1)).save(any());
    }

    @Test
    void createNotification_spamInteractionWithinCooldown_shouldSkip() {
        UUID recipientId = UUID.randomUUID();
        UUID actorId = UUID.randomUUID();
        UUID docId = UUID.randomUUID();

        when(repo.existsByRecipientUserIdAndActorUserIdAndDocumentIdAndNotificationTypeAndCreatedAtAfter(
                eq(recipientId), eq(actorId), eq(docId), eq("DOCUMENT_LIKED"), any()))
                .thenReturn(true);

        service.createNotification(recipientId, actorId, docId, "DOCUMENT_LIKED", "Title", "Content");
        verify(repo, never()).save(any());
    }
}
