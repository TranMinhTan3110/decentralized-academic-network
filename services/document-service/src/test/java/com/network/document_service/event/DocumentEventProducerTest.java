package com.network.document_service.event;

import org.junit.jupiter.api.Test;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.mockito.Mockito.*;

class DocumentEventProducerTest {

    @SuppressWarnings("unchecked")
    private final KafkaTemplate<String, Object> kafkaTemplate = mock(KafkaTemplate.class);
    private final DocumentEventProducer producer = new DocumentEventProducer(kafkaTemplate);

    @Test
    void sendDocumentUploaded_shouldSendMessage() {
        ReflectionTestUtils.setField(producer, "documentEventsTopic", "document-events");
        UUID docId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        DocumentUploadedEvent event = DocumentUploadedEvent.builder()
                .documentId(docId)
                .userId(userId)
                .title("Test Doc")
                .ipfsCid("QmTest")
                .build();

        producer.sendDocumentUploaded(event);
        verify(kafkaTemplate).send(eq("document-events"), eq(docId.toString()), eq(event));
    }

    @Test
    void sendDocumentInteracted_shouldSendMessage() {
        ReflectionTestUtils.setField(producer, "documentEventsTopic", "document-events");
        UUID docId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        DocumentInteractedEvent event = DocumentInteractedEvent.builder()
                .documentId(docId)
                .actorUserId(userId)
                .interactionType("LIKE")
                .build();

        producer.sendDocumentInteracted(event);
        verify(kafkaTemplate).send(eq("document-events"), eq(docId.toString()), eq(event));
    }

    @Test
    void sendDocument_withNull_shouldNotThrow() {
        producer.sendDocumentUploaded(null);
        producer.sendDocumentInteracted(null);
        verifyNoInteractions(kafkaTemplate);
    }
}
