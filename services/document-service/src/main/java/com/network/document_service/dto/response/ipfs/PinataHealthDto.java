package com.network.document_service.dto.response.ipfs;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PinataHealthDto {
    private boolean online;
    private Long pingMs;
    private boolean authenticated;
    private long totalPins;
    private long totalSizeBytes;
    private String errorMessage;
}
