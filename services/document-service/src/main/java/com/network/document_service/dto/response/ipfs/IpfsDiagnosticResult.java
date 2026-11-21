package com.network.document_service.dto.response.ipfs;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IpfsDiagnosticResult {
    private boolean healthy;
    private Long kuboPingMs;
    private Long pinataPingMs;
    private boolean kuboAvailable;
    private boolean pinataAvailable;
    private boolean localGatewayAvailable;
    private boolean pinataGatewayAvailable;
    private String bottleneckComponent;
    private String summary;
}
