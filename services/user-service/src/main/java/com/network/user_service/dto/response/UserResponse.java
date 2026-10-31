package com.network.user_service.dto.response;

import lombok.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private UUID id;
    private UUID universityId;
    private String universityName;
    private String email;
    private String username;
    private String fullName;
    private String avatarUrl;
    private String avatarText;
    private String bio;
    private String major;
    private String scholarTitle;
    private String walletAddress;
    private Integer followerCount;
    private Integer followingCount;
    private Integer reputationPoints;
    private Integer uploadPointsBalance;
    private Integer totalUploads;
    private Integer totalLikesReceived;
    private Integer totalQuizzesCompleted;
    private String role;
    private String status;
    private Boolean isVerified;
    private List<BadgeResponse> badges;
    private OffsetDateTime createdAt;
}
