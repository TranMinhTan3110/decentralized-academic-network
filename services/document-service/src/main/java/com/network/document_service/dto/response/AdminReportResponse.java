package com.network.document_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminReportResponse {
    private UUID id;
    private UUID documentId;
    private String documentTitle;
    private String reporterName;
    private String authorName;
    private String reason;
    private String description;
    private String status;
    private OffsetDateTime createdAt;
}

