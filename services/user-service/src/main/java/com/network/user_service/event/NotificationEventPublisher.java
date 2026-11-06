package com.network.user_service.event;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
@Slf4j
public class NotificationEventPublisher {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.kafka.topics.notification-events:user-notification-events}")
    private String notificationEventsTopic;

    public NotificationEventPublisher(KafkaTemplate<String, String> kafkaTemplate, ObjectMapper objectMapper) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    public void publishNotification(UUID recipientUserId, UUID actorUserId, UUID documentId,
                                    String notificationType, String title, String content) {
        if (recipientUserId == null || notificationType == null || notificationType.isBlank()) {
            return;
        }
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("recipientUserId", recipientUserId.toString());
            if (actorUserId != null) {
                payload.put("actorUserId", actorUserId.toString());
            }
            if (documentId != null) {
                payload.put("documentId", documentId.toString());
            }
            payload.put("notificationType", notificationType);
            payload.put("title", title);
            payload.put("content", content);
            payload.put("timestamp", OffsetDateTime.now().toString());

            String json = objectMapper.writeValueAsString(payload);
            String topic = (notificationEventsTopic != null && !notificationEventsTopic.isBlank())
                    ? notificationEventsTopic
                    : "user-notification-events";
            kafkaTemplate.send(topic, recipientUserId.toString(), json);
            log.info("Published Kafka notification event {} for recipient {}", notificationType, recipientUserId);
        } catch (Exception ex) {
            log.warn("Failed to publish notification event to Kafka: {}", ex.getMessage());
        }
    }
}

