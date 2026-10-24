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
        Notification n = Notification.builder().id(notiId).isRead(false).build();
        when(repo.findById(notiId)).thenReturn(Optional.of(n));

        service.markAsRead(notiId);
        assertTrue(n.getIsRead());
        verify(repo).save(n);
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
}
