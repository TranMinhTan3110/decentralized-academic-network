package com.network.user_service.event;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.network.user_service.dto.request.RecordReputationEventRequest;
import com.network.user_service.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReputationEventConsumerTest {

    @Mock
    private UserService userService;

    private ReputationEventConsumer consumer;

    @BeforeEach
    void setUp() {
        consumer = new ReputationEventConsumer(userService, new ObjectMapper());
    }

    @Test
    @DisplayName("consumeReputationEvent chuyển tiếp sự kiện hợp lệ sang userService.recordReputationEvent")
    void consumeReputationEvent_ValidJson_ShouldInvokeUserService() {
        UUID userId = UUID.randomUUID();
        String payload = String.format(
                "{\"userId\":\"%s\",\"actionType\":\"UPLOAD_DOC\",\"points\":10,\"referenceId\":\"doc-1\",\"idempotencyKey\":\"up-1\"}",
                userId
        );

        consumer.consumeReputationEvent(payload);

        ArgumentCaptor<RecordReputationEventRequest> captor = ArgumentCaptor.forClass(RecordReputationEventRequest.class);
        verify(userService).recordReputationEvent(eq(userId), captor.capture());
        assertThat(captor.getValue().getActionType()).isEqualTo("UPLOAD_DOC");
        assertThat(captor.getValue().getPoints()).isEqualTo(10);
        assertThat(captor.getValue().getIdempotencyKey()).isEqualTo("up-1");
    }

    @Test
    @DisplayName("consumeReputationEvent bỏ qua payload rỗng hoặc lỗi định dạng mà không ném ngoại lệ")
    void consumeReputationEvent_BlankOrInvalid_ShouldIgnoreGracefully() {
        consumer.consumeReputationEvent("");
        consumer.consumeReputationEvent("   ");
        consumer.consumeReputationEvent("{\"actionType\":\"UPLOAD_DOC\"}");
        consumer.consumeReputationEvent("not-a-json");

        verifyNoInteractions(userService);
    }

    @Test
    @DisplayName("consumeAiQuizEvent cộng +5 điểm khi QUIZ_COMPLETED đạt >= 80% và bỏ qua khi < 80%")
    void consumeAiQuizEvent_ShouldRewardWhenPercentageAtLeast80() {
        UUID userId = UUID.randomUUID();
        String passPayload = String.format(
                "{\"eventType\":\"QUIZ_COMPLETED\",\"userId\":\"%s\",\"quizId\":\"q-1\",\"attemptId\":\"att-1\",\"score\":9,\"percentage\":90.0}",
                userId
        );
        consumer.consumeAiQuizEvent(passPayload);
        verify(userService, times(1)).recordReputationEvent(eq(userId), any(RecordReputationEventRequest.class));

        // Dưới 80% -> không cộng điểm
        String lowPayload = String.format(
                "{\"eventType\":\"QUIZ_COMPLETED\",\"userId\":\"%s\",\"quizId\":\"q-1\",\"score\":5,\"percentage\":50.0}",
                userId
        );
        consumer.consumeAiQuizEvent(lowPayload);
        verifyNoMoreInteractions(userService);

        // Khác eventType -> bỏ qua
        consumer.consumeAiQuizEvent("{\"eventType\":\"DOCUMENT_VALIDATED\"}");
        consumer.consumeAiQuizEvent("");
        verifyNoMoreInteractions(userService);
    }
}

