package com.network.user_service.service;

import com.network.user_service.dto.response.UserResponse;
import com.network.user_service.dto.response.UserSummaryDto;

import java.util.List;
import java.util.UUID;

public interface UserService {
    UserResponse getCurrentUserProfile(String email);

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
}
