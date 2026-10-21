package com.network.user_service.service;

import com.network.user_service.dto.request.ChangePasswordRequest;
import com.network.user_service.dto.request.UpdateProfileRequest;
import com.network.user_service.dto.response.BadgeResponse;
import com.network.user_service.dto.response.FollowResponse;
import com.network.user_service.dto.response.UserResponse;

import java.util.List;

public interface UserService {
    UserResponse getCurrentUserProfile(String email);
    UserResponse getPublicUserProfile(String identifier);
    List<BadgeResponse> getUserBadges(String identifier);
    List<BadgeResponse> getAllAvailableBadges();
    void awardBadgeToUser(String identifier, String badgeCode);
    FollowResponse toggleFollow(String followerEmail, String targetIdentifier);
    Boolean isFollowing(String followerEmail, String targetIdentifier);
    UserResponse updateProfile(String email, UpdateProfileRequest request);
    void changePassword(String email, ChangePasswordRequest request);
    void deleteAccount(String email);
}
