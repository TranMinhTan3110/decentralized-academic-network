package com.network.user_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReputationEventResponse {
    private UUID userId;
    private String actionType;
    private int pointsAdded;
    private int totalReputationPoints;
    private int uploadPointsBalance;
    private String scholarTitle;
    private boolean duplicateSkipped;
    private List<BadgeResponse> badges;
}

