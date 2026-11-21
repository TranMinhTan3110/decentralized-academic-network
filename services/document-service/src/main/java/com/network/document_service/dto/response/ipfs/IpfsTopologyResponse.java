package com.network.document_service.dto.response.ipfs;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IpfsTopologyResponse {
    private String backendStatus;
    private String currentMode;
    private KuboTopologyNode kubo;
    private PinataTopologyNode pinata;
    private GatewayTopologyNode gateway;
    private DiagnosticVerdict verdict;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KuboTopologyNode {
        private String status;
        private Long pingMs;
        private String version;
        private String peerId;
        private int swarmPeersCount;
        private long repoSizeBytes;
        private long pinnedCount;
        private String errorMessage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PinataTopologyNode {
        private String status;
        private Long pingMs;
        private boolean authenticated;
        private long pinnedCount;
        private long storageUsedBytes;
        private String errorMessage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GatewayTopologyNode {
        private String localGatewayStatus;
        private String pinataGatewayStatus;
        private String localGatewayUrl;
        private String pinataGatewayUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DiagnosticVerdict {
        private String level;
        private String title;
        private String description;
        private String failingComponent;
    }
}
