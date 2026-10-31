package com.network.document_service.event;

import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentUploadedEvent {
    private UUID documentId;
    private UUID userId;
    private String title;
    private String ipfsCid;
    private String previewIpfsCid;
    private Integer totalPages;
    private UUID universityId;
    private UUID courseId;
    private OffsetDateTime timestamp;
}
