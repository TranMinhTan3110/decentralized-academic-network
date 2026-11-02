package com.network.user_service.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardEntryDto {
    private int rank;
    private String userId;
    private String name;
    private String handle;
    private String avatar;
    private String school;
    private String title;
    private int points;
    private int uploads;
    private int saves;
    private int likes;
    private int followerCount;

    @JsonProperty("isCurrentUser")
    private boolean currentUser;

    private String trend;
    private int change;
}

