package com.network.document_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDocumentStatsResponse {
    private long totalDocuments;
    private long pendingReports;
    private long totalInteractions;
    private long rejectedDocuments;
}

