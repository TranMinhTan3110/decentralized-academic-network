package com.network.user_service.service;

import com.network.user_service.dto.request.ChangePasswordRequest;
import com.network.user_service.dto.request.RecordReputationEventRequest;
import com.network.user_service.dto.request.UpdateProfileRequest;
import com.network.user_service.dto.response.BadgeResponse;
import com.network.user_service.dto.response.FollowResponse;
import com.network.user_service.dto.response.LeaderboardResponse;
import com.network.user_service.dto.response.ReputationEventResponse;
import com.network.user_service.dto.response.UserResponse;
import com.network.user_service.dto.response.UserSummaryDto;

import java.util.List;
import java.util.UUID;

public interface UserService {
    UserResponse getCurrentUserProfile(String email);

    UserResponse getPublicUserProfile(String identifier);

    List<BadgeResponse> getUserBadges(String identifier);

    List<BadgeResponse> getAllAvailableBadges();

    void awardBadgeToUser(String identifier, String badgeCode);

    FollowResponse toggleFollow(String followerEmail, String targetIdentifier);

    Boolean isFollowing(String followerEmail, String targetIdentifier);

    List<UUID> getFollowingIds(UUID userId);

    List<UserSummaryDto> getSuggestedUsers(String currentUserEmail, int limit);

    UserSummaryDto getUserSummary(UUID userId);

    List<UserSummaryDto> getUserSummariesBatch(List<UUID> userIds);

    /**
     * Trừ điểm khả dụng của người dùng. Idempotent theo idempotencyKey;
     * ném AppException(CONFLICT) nếu không đủ điểm.
     *
     * @return số dư còn lại sau khi trừ
     */
    int deductPoints(UUID userId, int points, String idempotencyKey);

    int getBalance(UUID userId);

    /**
     * Ghi nhận sự kiện cộng điểm danh tiếng & điểm tải tài liệu theo Quy chế Tính điểm.
     * Tự động cập nhật danh hiệu (Tân Thủ / Chuyên Gia / Cao Thủ / Huyền Thoại) và xét duyệt Huy hiệu.
     */
    ReputationEventResponse recordReputationEvent(UUID userId, RecordReputationEventRequest request);

    /**
     * Lấy bảng xếp hạng học giả theo kỳ (weekly, monthly, all-time).
     */
    LeaderboardResponse getLeaderboard(String period, int limit, String currentUserEmail);

    UserResponse updateProfile(String email, UpdateProfileRequest request);

    void changePassword(String email, ChangePasswordRequest request);

    void deleteAccount(String email);
}
