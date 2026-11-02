package com.network.user_service.event;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.network.user_service.dto.request.RecordReputationEventRequest;
import com.network.user_service.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

@Component
@Slf4j
public class ReputationEventConsumer {

    private final UserService userService;
    private final ObjectMapper objectMapper;

    public ReputationEventConsumer(UserService userService, ObjectMapper objectMapper) {
        this.userService = userService;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(
            topics = "${app.kafka.topics.reputation-events:user-reputation-events}",
            groupId = "${spring.kafka.consumer.group-id:user-service-reputation-group}"
    )
    public void consumeReputationEvent(String payload) {
        if (payload == null || payload.isBlank()) {
            return;
        }
        try {
            Map<String, Object> data = objectMapper.readValue(payload, new TypeReference<Map<String, Object>>() {});
            Object rawUserId = data.get("userId");
            if (rawUserId == null) {
                return;
            }
            UUID userId = UUID.fromString(rawUserId.toString());
            String actionType = data.get("actionType") != null ? data.get("actionType").toString() : null;
            Integer points = data.get("points") instanceof Number num ? num.intValue() : null;
            String referenceId = data.get("referenceId") != null ? data.get("referenceId").toString() : null;
            String description = data.get("description") != null ? data.get("description").toString() : null;
            String idempotencyKey = data.get("idempotencyKey") != null ? data.get("idempotencyKey").toString() : null;

            RecordReputationEventRequest req = RecordReputationEventRequest.builder()
                    .userId(userId)
                    .actionType(actionType)
                    .points(points)
                    .referenceId(referenceId)
                    .description(description)
                    .idempotencyKey(idempotencyKey)
                    .build();

            userService.recordReputationEvent(userId, req);
            log.info("Processed Kafka reputation event {} for userId {}", actionType, userId);
        } catch (Exception ex) {
            log.warn("Failed to process Kafka reputation event payload: {}. Reason: {}", payload, ex.getMessage());
        }
    }

    @KafkaListener(
            topics = "${app.kafka.topics.ai-events:ai-events}",
            groupId = "${spring.kafka.consumer.group-id:user-service-reputation-group}"
    )
    public void consumeAiQuizEvent(String payload) {
        if (payload == null || payload.isBlank()) {
            return;
        }
        try {
            Map<String, Object> data = objectMapper.readValue(payload, new TypeReference<Map<String, Object>>() {});
            String eventType = data.get("eventType") != null ? data.get("eventType").toString() : "";
            if (!"QUIZ_COMPLETED".equalsIgnoreCase(eventType)) {
                return;
            }
            Object rawUserId = data.get("userId");
            if (rawUserId == null) {
                return;
            }
            double percentage = data.get("percentage") instanceof Number num ? num.doubleValue() : 0.0;
            if (percentage < 80.0) {
                return;
            }
            UUID userId = UUID.fromString(rawUserId.toString());
            String quizId = data.get("quizId") != null ? data.get("quizId").toString() : null;
            String attemptId = data.get("attemptId") != null ? data.get("attemptId").toString() : quizId;
            String idempotencyKey = attemptId != null ? "quiz-" + userId + "-" + attemptId : null;

            RecordReputationEventRequest req = RecordReputationEventRequest.builder()
                    .userId(userId)
                    .actionType("COMPLETE_QUIZ")
                    .points(5)
                    .referenceId(quizId)
                    .description("Hoàn thành bài trắc nghiệm AI đạt " + percentage + "%")
                    .idempotencyKey(idempotencyKey)
                    .build();

            userService.recordReputationEvent(userId, req);
            log.info("Processed AI QUIZ_COMPLETED reputation reward for userId {}", userId);
        } catch (Exception ex) {
            log.warn("Failed to process AI event payload: {}. Reason: {}", payload, ex.getMessage());
        }
    }
}

