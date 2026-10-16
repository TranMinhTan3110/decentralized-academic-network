package com.network.document_service.repository;

import com.network.document_service.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByRecipientUserIdOrderByCreatedAtDesc(UUID recipientUserId);
    long countByRecipientUserIdAndIsReadFalse(UUID recipientUserId);
}
