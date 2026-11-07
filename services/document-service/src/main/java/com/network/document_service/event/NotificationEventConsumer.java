package com.network.document_service.event;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.network.document_service.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

@Component
public class NotificationEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(NotificationEventConsumer.class);

    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    public NotificationEventConsumer(NotificationService notificationService, ObjectMapper objectMapper) {
        this.notificationService = notificationService;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(
            topics = "${app.kafka.topics.notification-events:user-notification-events}",
            groupId = "${spring.kafka.consumer.group-id:document-service-notification-group}"
    )
    public void consumeNotificationEvent(String payload) {
        if (payload == null || payload.isBlank()) {
            return;
        }
        try {
            Map<String, Object> data = objectMapper.readValue(payload, new TypeReference<Map<String, Object>>() {});
            UUID recipientUserId = parseUuid(data.get("recipientUserId"));
            if (recipientUserId == null) {
                return;
            }
            UUID actorUserId = parseUuid(data.get("actorUserId"));
            UUID documentId = parseUuid(data.get("documentId"));
            String type = data.get("notificationType") != null ? data.get("notificationType").toString() : "SYSTEM";
            String title = data.get("title") != null ? data.get("title").toString() : "Thông báo mới";
            String content = data.get("content") != null ? data.get("content").toString() : "";

            notificationService.createNotification(recipientUserId, actorUserId, documentId, type, title, content);
            log.info("Processed Kafka notification event {} for recipient {}", type, recipientUserId);
        } catch (Exception ex) {
            log.warn("Failed to process Kafka notification event payload: {}. Reason: {}", payload, ex.getMessage());
        }
    }

    private UUID parseUuid(Object raw) {
        if (raw == null) {
            return null;
        }
        String str = raw.toString().trim();
        if (str.isEmpty()) {
            return null;
        }
        try {
            return UUID.fromString(str);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}

