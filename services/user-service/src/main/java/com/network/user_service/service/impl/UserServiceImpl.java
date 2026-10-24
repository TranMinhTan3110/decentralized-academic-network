package com.network.user_service.service.impl;

import com.network.user_service.dto.response.UserResponse;
import com.network.user_service.dto.response.UserSummaryDto;
import com.network.user_service.entity.PointTransaction;
import com.network.user_service.entity.User;
import com.network.user_service.exception.AppException;
import com.network.user_service.exception.ResourceNotFoundException;
import com.network.user_service.repository.PointTransactionRepository;
import com.network.user_service.repository.UserRepository;
import com.network.user_service.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PointTransactionRepository pointTransactionRepository;

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUserProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin người dùng với email: " + email));

        return mapToUserResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserSummaryDto getUserSummary(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + userId));
        return mapToSummary(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserSummaryDto> getUserSummariesBatch(List<UUID> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Collections.emptyList();
        }
        List<UUID> distinctIds = userIds.stream().filter(Objects::nonNull).distinct().toList();
        Map<UUID, UserSummaryDto> byId = new HashMap<>();
        userRepository.findAllById(distinctIds).forEach(u -> byId.put(u.getId(), mapToSummary(u)));

        // Trả về đúng thứ tự yêu cầu; id không tồn tại bị bỏ qua để caller tự fallback
        return distinctIds.stream()
                .map(byId::get)
                .filter(Objects::nonNull)
                .toList();
    }

    @Override
    @Transactional
    public int deductPoints(UUID userId, int points, String idempotencyKey) {
        if (points <= 0) {
            throw new AppException("Số điểm trừ phải lớn hơn 0", HttpStatus.BAD_REQUEST);
        }

        // Idempotency: giao dịch đã thực hiện thì trả về kết quả cũ thay vì trừ thêm
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            Optional<PointTransaction> existing = pointTransactionRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) {
                log.info("Deduct-points replayed for idempotencyKey {}, no-op", idempotencyKey);
                return userRepository.findById(userId).map(u -> u.getUploadPointsBalance() != null ? u.getUploadPointsBalance() : 0).orElse(0);
            }
        }

        // Khóa biên quan trên dòng user để hai request đồng thời không cùng vượt kiểm tra số dư
        User user = userRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + userId));

        int balance = user.getUploadPointsBalance() != null ? user.getUploadPointsBalance() : 0;
        if (balance < points) {
            throw new AppException("Không đủ điểm để mở khóa (cần " + points + ", còn " + balance + ")", HttpStatus.CONFLICT);
        }

        int newBalance = balance - points;
        user.setUploadPointsBalance(newBalance);

        PointTransaction transaction = PointTransaction.builder()
                .userId(userId)
                .amount(-points)
                .reason("UNLOCK_DOCUMENT")
                .idempotencyKey(idempotencyKey)
                .build();
        try {
            pointTransactionRepository.save(transaction);
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            // Trùng idempotencyKey: giao dịch gốc đã xử lý ở request khác.
            // Phải ném lỗi để rollback cả việc trừ điểm vừa làm trong TX này.
            log.info("Duplicate deduct intercepted for key {}, rolling back", idempotencyKey);
            throw new AppException("Giao dịch điểm trùng lặp, đã được xử lý trước đó", HttpStatus.CONFLICT);
        }

        return newBalance;
    }

    @Override
    @Transactional(readOnly = true)
    public int getBalance(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + userId));
        return user.getUploadPointsBalance() != null ? user.getUploadPointsBalance() : 0;
    }

    private UserSummaryDto mapToSummary(User user) {
        String badgeName = (user.getBadges() == null || user.getBadges().isEmpty())
                ? "Thành viên"
                : user.getBadges().iterator().next().getName();

        return UserSummaryDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .universityName(user.getUniversity() != null ? user.getUniversity().getName() : null)
                .badge(badgeName)
                .points(user.getUploadPointsBalance() != null ? user.getUploadPointsBalance() : 0)
                .build();
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .universityId(user.getUniversity() != null ? user.getUniversity().getId() : null)
                .email(user.getEmail())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .avatarText(user.getAvatarText())
                .bio(user.getBio())
                .major(user.getMajor())
                .scholarTitle(user.getScholarTitle())
                .walletAddress(user.getWalletAddress())
                .followerCount(user.getFollowerCount())
                .followingCount(user.getFollowingCount())
                .reputationPoints(user.getReputationPoints())
                .uploadPointsBalance(user.getUploadPointsBalance())
                .totalUploads(user.getTotalUploads())
                .totalLikesReceived(user.getTotalLikesReceived())
                .totalQuizzesCompleted(user.getTotalQuizzesCompleted())
                .role(user.getRole())
                .status(user.getStatus())
                .isVerified(user.getIsVerified())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
