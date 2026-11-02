package com.network.user_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardResponse {
    private String period;
    private OffsetDateTime updatedAt;
    private List<LeaderboardEntryDto> entries;
    private LeaderboardEntryDto currentUserEntry;
    private LeaderboardEntryDto nextRankUser;
    private int pointsToNextRank;
}

