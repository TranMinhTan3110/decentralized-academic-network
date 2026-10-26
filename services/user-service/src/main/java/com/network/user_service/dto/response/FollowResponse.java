package com.network.user_service.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FollowResponse {
    private Boolean isFollowing;
    private Integer followerCount;
    private Integer followingCount;
}
