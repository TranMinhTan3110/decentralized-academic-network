package com.network.document_service.dto.response.ipfs;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KuboHealthDto {
    private boolean online;
    private Long pingMs;
    private String version;
    private String peerId;
    private int swarmPeersCount;
    private long repoSizeBytes;
    private long numObjects;
    private double rateIn;
    private double rateOut;
    private String errorMessage;
}
