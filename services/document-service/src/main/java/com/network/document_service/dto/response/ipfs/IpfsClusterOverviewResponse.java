package com.network.document_service.dto.response.ipfs;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IpfsClusterOverviewResponse {
    private String status;
    private long totalDocuments;
    private long pinnedBoth;
    private long pinnedLocalOnly;
    private long pinnedRemoteOnly;
    private long failedOrOrphan;
    private KuboHealthDto kubo;
    private PinataHealthDto pinata;
}
