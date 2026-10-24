package com.network.document_service.event;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;

@Component
public class DocumentEventProducer {

    private static final Logger log = LoggerFactory.getLogger(DocumentEventProducer.class);

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${app.kafka.topics.document-events:document-events}")
    private String documentEventsTopic;

    public DocumentEventProducer(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void sendDocumentUploaded(DocumentUploadedEvent event) {
        if (event == null) return;
        if (event.getTimestamp() == null) {
            event.setTimestamp(OffsetDateTime.now());
        }
        try {
            String key = event.getDocumentId() != null ? event.getDocumentId().toString() : "upload";
            kafkaTemplate.send(documentEventsTopic, key, event);
            log.info("Sent DocumentUploadedEvent for docId: {}", event.getDocumentId());
        } catch (Exception ex) {
            log.warn("Failed to publish DocumentUploadedEvent to Kafka topic {}: {}", documentEventsTopic, ex.getMessage());
        }
    }

    public void sendDocumentInteracted(DocumentInteractedEvent event) {
        if (event == null) return;
        if (event.getTimestamp() == null) {
            event.setTimestamp(OffsetDateTime.now());
        }
        try {
            String key = event.getDocumentId() != null ? event.getDocumentId().toString() : "interaction";
            kafkaTemplate.send(documentEventsTopic, key, event);
            log.info("Sent DocumentInteractedEvent for docId: {}, type: {}", event.getDocumentId(), event.getInteractionType());
        } catch (Exception ex) {
            log.warn("Failed to publish DocumentInteractedEvent to Kafka topic {}: {}", documentEventsTopic, ex.getMessage());
        }
    }
}
