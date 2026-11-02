package com.network.user_service.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecordReputationEventRequest {
    private UUID userId;
    private String actionType;
    private Integer points;
    private String referenceId;
    private String description;
    private String idempotencyKey;
}

