package com.network.document_service.event;

import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentInteractedEvent {
    private UUID documentId;
    private UUID actorUserId;
    private String interactionType; // LIKE, UNLIKE, VIEW, COMMENT, BOOKMARK, UNLOCK
    private Integer pageNumber;
    private OffsetDateTime timestamp;
}
