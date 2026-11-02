package com.network.user_service.service.impl;

import com.network.user_service.dto.request.ChangePasswordRequest;
import com.network.user_service.dto.request.RecordReputationEventRequest;
import com.network.user_service.dto.request.UpdateProfileRequest;
import com.network.user_service.dto.response.BadgeResponse;
import com.network.user_service.dto.response.FollowResponse;
import com.network.user_service.dto.response.LeaderboardEntryDto;
import com.network.user_service.dto.response.LeaderboardResponse;
import com.network.user_service.dto.response.ReputationEventResponse;
import com.network.user_service.dto.response.UserResponse;
import com.network.user_service.dto.response.UserSummaryDto;
import com.network.user_service.entity.Badge;
import com.network.user_service.entity.PointTransaction;
import com.network.user_service.entity.ReputationLog;
import com.network.user_service.entity.University;
import com.network.user_service.entity.User;
import com.network.user_service.entity.UserFollow;
import com.network.user_service.entity.UserFollowId;
import com.network.user_service.exception.AppException;
import com.network.user_service.exception.ResourceNotFoundException;
import com.network.user_service.repository.BadgeRepository;
import com.network.user_service.repository.PointTransactionRepository;
import com.network.user_service.repository.ReputationLogRepository;
import com.network.user_service.repository.UniversityRepository;
import com.network.user_service.repository.UserFollowRepository;
import com.network.user_service.repository.UserRepository;
import com.network.user_service.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Slf4j
public class UserServiceImpl implements UserService {

    private static final Pattern UUID_PATTERN = Pattern
            .compile("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$");

    private final UserRepository userRepository;
    private final UniversityRepository universityRepository;
    private final UserFollowRepository userFollowRepository;
    private final BadgeRepository badgeRepository;
    private final PointTransactionRepository pointTransactionRepository;
    private final ReputationLogRepository reputationLogRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UserServiceImpl(
            UserRepository userRepository,
            UniversityRepository universityRepository,
            UserFollowRepository userFollowRepository,
            BadgeRepository badgeRepository,
            PointTransactionRepository pointTransactionRepository,
            ReputationLogRepository reputationLogRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.universityRepository = universityRepository;
        this.userFollowRepository = userFollowRepository;
        this.badgeRepository = badgeRepository;
        this.pointTransactionRepository = pointTransactionRepository;
        this.reputationLogRepository = reputationLogRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserServiceImpl(
            UserRepository userRepository,
            UniversityRepository universityRepository,
            UserFollowRepository userFollowRepository,
            BadgeRepository badgeRepository,
            PointTransactionRepository pointTransactionRepository,
            PasswordEncoder passwordEncoder) {
        this(userRepository, universityRepository, userFollowRepository, badgeRepository,
                pointTransactionRepository, null, passwordEncoder);
    }

    @Override
    @Transactional
    public UserResponse getCurrentUserProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(
                        () -> new ResourceNotFoundException("Không tìm thấy thông tin người dùng với email: " + email));

        checkAndAwardBadges(user);
        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse getPublicUserProfile(String identifier) {
        User user = findUserByIdentifier(identifier);
        checkAndAwardBadges(user);
        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    public List<BadgeResponse> getUserBadges(String identifier) {
        User user = findUserByIdentifier(identifier);
        checkAndAwardBadges(user);
        return mapBadges(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BadgeResponse> getAllAvailableBadges() {
        return badgeRepository.findAll().stream()
                .map(badge -> BadgeResponse.builder()
                        .id(badge.getId())
                        .code(badge.getCode())
                        .name(badge.getName())
                        .description(badge.getDescription())
                        .iconUrl(badge.getIconUrl())
                        .build())
                .toList();
    }

    @Override
    @Transactional
    public void awardBadgeToUser(String identifier, String badgeCode) {
        User user = findUserByIdentifier(identifier);
        Badge badge = badgeRepository.findByCode(badgeCode)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy huy hiệu với mã: " + badgeCode));

        Set<Badge> userBadges = user.getBadges() != null ? user.getBadges() : new HashSet<>();
        userBadges.add(badge);
        user.setBadges(userBadges);
        userRepository.save(user);
    }

    @Transactional
    public void checkAndAwardBadges(User user) {
        if (user == null || user.getId() == null) {
            return;
        }

        Set<Badge> userBadges = user.getBadges() != null ? user.getBadges() : new HashSet<>();
        Set<String> existingCodes = userBadges.stream()
                .map(Badge::getCode)
                .collect(Collectors.toSet());

        boolean changed = false;

        // 1. Người Tiên Phong (FIRST_UPLOAD): Tải lên ít nhất 1 tài liệu
        if (user.getTotalUploads() != null && user.getTotalUploads() >= 1 && !existingCodes.contains("FIRST_UPLOAD")) {
            var b = badgeRepository.findByCode("FIRST_UPLOAD");
            if (b.isPresent()) {
                userBadges.add(b.get());
                changed = true;
            }
        }

        // 2. Nhà Đóng Góp Tích Cực (ACTIVE_CONTRIBUTOR): Tải lên từ 10 tài liệu
        if (user.getTotalUploads() != null && user.getTotalUploads() >= 10
                && !existingCodes.contains("ACTIVE_CONTRIBUTOR")) {
            var b = badgeRepository.findByCode("ACTIVE_CONTRIBUTOR");
            if (b.isPresent()) {
                userBadges.add(b.get());
                changed = true;
            }
        }

        // 3. Tài Liệu Xuất Sắc (EXCELLENT_DOC): Nhận được từ 50 lượt Thả tim
        if (user.getTotalLikesReceived() != null && user.getTotalLikesReceived() >= 50
                && !existingCodes.contains("EXCELLENT_DOC")) {
            var b = badgeRepository.findByCode("EXCELLENT_DOC");
            if (b.isPresent()) {
                userBadges.add(b.get());
                changed = true;
            }
        }

        // 4. Tác Giả Nổi Bật 2025 (TOP_AUTHOR_2025): Từ 5 tài liệu hoặc đạt 200+ điểm uy tín
        boolean isTopAuthor = (user.getTotalUploads() != null && user.getTotalUploads() >= 5
                && user.getTotalLikesReceived() != null && user.getTotalLikesReceived() >= 20)
                || (user.getReputationPoints() != null && user.getReputationPoints() >= 200);
        if (isTopAuthor && !existingCodes.contains("TOP_AUTHOR_2025")) {
            var b = badgeRepository.findByCode("TOP_AUTHOR_2025");
            if (b.isPresent()) {
                userBadges.add(b.get());
                changed = true;
            }
        }

        // 5. Học Giả Uy Tín (REPUTATION_500): Đạt mốc 500+ điểm uy tín
        if (user.getReputationPoints() != null && user.getReputationPoints() >= 500
                && !existingCodes.contains("REPUTATION_500")) {
            var b = badgeRepository.findByCode("REPUTATION_500");
            if (b.isPresent()) {
                userBadges.add(b.get());
                changed = true;
            }
        }

        // 6. Huyền Thoại Học Thuật (REPUTATION_1500): Đạt mốc 1,500+ điểm uy tín
        if (user.getReputationPoints() != null && user.getReputationPoints() >= 1500
                && !existingCodes.contains("REPUTATION_1500")) {
            var b = badgeRepository.findByCode("REPUTATION_1500");
            if (b.isPresent()) {
                userBadges.add(b.get());
                changed = true;
            }
        }

        // 7. Chiến Thần Trắc Nghiệm (QUIZ_MASTER): Hoàn thành từ 10 bài Quiz
        if (user.getTotalQuizzesCompleted() != null && user.getTotalQuizzesCompleted() >= 10
                && !existingCodes.contains("QUIZ_MASTER")) {
            var b = badgeRepository.findByCode("QUIZ_MASTER");
            if (b.isPresent()) {
                userBadges.add(b.get());
                changed = true;
            }
        }

        // 8. Học Giả Kết Nối (GENESIS_LEADER): Có từ 100 người theo dõi trở lên
        if (user.getFollowerCount() != null && user.getFollowerCount() >= 100
                && !existingCodes.contains("GENESIS_LEADER")) {
            var b = badgeRepository.findByCode("GENESIS_LEADER");
            if (b.isPresent()) {
                userBadges.add(b.get());
                changed = true;
            }
        }

        if (changed) {
            user.setBadges(userBadges);
            userRepository.save(user);
        }
    }

    @Override
    @Transactional
    public FollowResponse toggleFollow(String followerEmail, String targetIdentifier) {
        User follower = userRepository.findByEmail(followerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin người theo dõi"));

        User target = findUserByIdentifier(targetIdentifier);

        if (follower.getId().equals(target.getId())) {
            throw new AppException("Bạn không thể tự theo dõi chính mình", HttpStatus.BAD_REQUEST);
        }

        boolean alreadyFollowing = userFollowRepository.existsByIdFollowerIdAndIdFollowingId(follower.getId(),
                target.getId());

        if (alreadyFollowing) {
            userFollowRepository.deleteByIdFollowerIdAndIdFollowingId(follower.getId(), target.getId());
            int newFollowerCount = Math.max(0, (target.getFollowerCount() != null ? target.getFollowerCount() : 1) - 1);
            int newFollowingCount = Math.max(0,
                    (follower.getFollowingCount() != null ? follower.getFollowingCount() : 1) - 1);
            target.setFollowerCount(newFollowerCount);
            follower.setFollowingCount(newFollowingCount);
            userRepository.save(target);
            userRepository.save(follower);

            return FollowResponse.builder()
                    .isFollowing(false)
                    .followerCount(newFollowerCount)
                    .followingCount(newFollowingCount)
                    .build();
        } else {
            UserFollowId followId = new UserFollowId(follower.getId(), target.getId());
            UserFollow follow = UserFollow.builder()
                    .id(followId)
                    .follower(follower)
                    .following(target)
                    .build();
            userFollowRepository.save(follow);

            int newFollowerCount = (target.getFollowerCount() != null ? target.getFollowerCount() : 0) + 1;
            int newFollowingCount = (follower.getFollowingCount() != null ? follower.getFollowingCount() : 0) + 1;
            target.setFollowerCount(newFollowerCount);
            follower.setFollowingCount(newFollowingCount);
            userRepository.save(target);
            userRepository.save(follower);
            checkAndAwardBadges(target);

            return FollowResponse.builder()
                    .isFollowing(true)
                    .followerCount(newFollowerCount)
                    .followingCount(newFollowingCount)
                    .build();
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Boolean isFollowing(String followerEmail, String targetIdentifier) {
        if (followerEmail == null || followerEmail.isBlank()) {
            return false;
        }

        User follower = userRepository.findByEmail(followerEmail).orElse(null);
        if (follower == null) {
            return false;
        }

        try {
            User target = findUserByIdentifier(targetIdentifier);
            return userFollowRepository.existsByIdFollowerIdAndIdFollowingId(follower.getId(), target.getId());
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<UUID> getFollowingIds(UUID userId) {
        if (userId == null) {
            return Collections.emptyList();
        }
        return userFollowRepository.findFollowingIdsByFollowerId(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserSummaryDto> getSuggestedUsers(String currentUserEmail, int limit) {
        int effectiveLimit = Math.min(20, Math.max(1, limit));
        Pageable pageable = PageRequest.of(0, effectiveLimit);

        List<User> users;
        if (currentUserEmail != null && !currentUserEmail.isBlank()) {
            Optional<User> currentUserOpt = userRepository.findByEmail(currentUserEmail);
            if (currentUserOpt.isPresent()) {
                User currentUser = currentUserOpt.get();
                UUID universityId = currentUser.getUniversity() != null ? currentUser.getUniversity().getId() : null;
                users = userRepository.findSuggestedUsersForUser(currentUser.getId(), universityId, pageable);
            } else {
                users = userRepository.findTopSuggestedUsers(pageable);
            }
        } else {
            users = userRepository.findTopSuggestedUsers(pageable);
        }

        return users.stream()
                .map(this::mapToSummary)
                .toList();
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
        if (idempotencyKey != null && !idempotencyKey.isBlank() && pointTransactionRepository != null) {
            Optional<PointTransaction> existing = pointTransactionRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) {
                log.info("Deduct-points replayed for idempotencyKey {}, no-op", idempotencyKey);
                return userRepository.findById(userId).map(u -> u.getUploadPointsBalance() != null ? u.getUploadPointsBalance() : 0).orElse(0);
            }
        }

        // Khóa bi quan trên dòng user để hai request đồng thời không cùng vượt kiểm tra số dư
        User user = userRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + userId));

        int balance = user.getUploadPointsBalance() != null ? user.getUploadPointsBalance() : 0;
        if (balance < points) {
            throw new AppException("Không đủ điểm để mở khóa (cần " + points + ", còn " + balance + ")", HttpStatus.CONFLICT);
        }

        int newBalance = balance - points;
        user.setUploadPointsBalance(newBalance);

        if (pointTransactionRepository != null) {
            PointTransaction transaction = PointTransaction.builder()
                    .userId(userId)
                    .amount(-points)
                    .reason("UNLOCK_DOCUMENT")
                    .idempotencyKey(idempotencyKey)
                    .build();
            try {
                pointTransactionRepository.save(transaction);
            } catch (org.springframework.dao.DataIntegrityViolationException ex) {
                log.info("Duplicate deduct intercepted for key {}, rolling back", idempotencyKey);
                throw new AppException("Giao dịch điểm trùng lặp, đã được xử lý trước đó", HttpStatus.CONFLICT);
            }
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

    @Override
    @Transactional
    public ReputationEventResponse recordReputationEvent(UUID userId, RecordReputationEventRequest request) {
        if (userId == null) {
            throw new AppException("Mã người dùng không được để trống", HttpStatus.BAD_REQUEST);
        }
        String rawAction = request != null && request.getActionType() != null
                ? request.getActionType().trim().toUpperCase(Locale.ROOT)
                : "";
        if (rawAction.isEmpty()) {
            throw new AppException("Loại sự kiện tính điểm (actionType) không được để trống", HttpStatus.BAD_REQUEST);
        }

        String idempotencyKey = request != null && request.getIdempotencyKey() != null
                && !request.getIdempotencyKey().isBlank()
                ? request.getIdempotencyKey().trim()
                : null;

        if (idempotencyKey != null && reputationLogRepository != null
                && reputationLogRepository.existsByIdempotencyKey(idempotencyKey)) {
            User existingUser = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + userId));
            return ReputationEventResponse.builder()
                    .userId(userId)
                    .actionType(rawAction)
                    .pointsAdded(0)
                    .totalReputationPoints(existingUser.getReputationPoints() != null ? existingUser.getReputationPoints() : 0)
                    .uploadPointsBalance(existingUser.getUploadPointsBalance() != null ? existingUser.getUploadPointsBalance() : 0)
                    .scholarTitle(existingUser.getScholarTitle())
                    .duplicateSkipped(true)
                    .badges(mapBadges(existingUser))
                    .build();
        }

        User user = userRepository.findByIdForUpdate(userId)
                .or(() -> userRepository.findById(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + userId));

        int defaultPoints;
        String defaultDesc;
        switch (rawAction) {
            case "UPLOAD_DOC":
            case "UPLOAD_APPROVED":
                defaultPoints = 10;
                defaultDesc = "Đăng tải tài liệu học thuật lên hệ thống";
                user.setTotalUploads((user.getTotalUploads() != null ? user.getTotalUploads() : 0) + 1);
                break;
            case "RECEIVE_LIKE":
            case "DOC_LIKED":
                defaultPoints = 2;
                defaultDesc = "Tài liệu nhận được 1 lượt thả tim";
                user.setTotalLikesReceived((user.getTotalLikesReceived() != null ? user.getTotalLikesReceived() : 0) + 1);
                break;
            case "RECEIVE_BOOKMARK":
            case "DOC_BOOKMARKED":
                defaultPoints = 5;
                defaultDesc = "Tài liệu được lưu vào Thư viện (Bookmark)";
                break;
            case "RECEIVE_DOWNLOAD":
            case "DOC_DOWNLOADED":
                defaultPoints = 3;
                defaultDesc = "Tài liệu được tải xuống thành công";
                break;
            case "RATE_5_STAR":
                defaultPoints = 5;
                defaultDesc = "Tài liệu nhận đánh giá 5 sao xuất sắc";
                break;
            case "RATE_4_STAR":
                defaultPoints = 3;
                defaultDesc = "Tài liệu nhận đánh giá 4 sao chất lượng";
                break;
            case "COMPLETE_QUIZ":
            case "QUIZ_COMPLETED":
                defaultPoints = 5;
                defaultDesc = "Hoàn thành bài trắc nghiệm AI đạt kết quả tốt (>= 80%)";
                user.setTotalQuizzesCompleted((user.getTotalQuizzesCompleted() != null ? user.getTotalQuizzesCompleted() : 0) + 1);
                break;
            default:
                defaultPoints = 0;
                defaultDesc = "Ghi nhận đóng góp học thuật";
                break;
        }

        int pointsToAdd = (request.getPoints() != null && request.getPoints() > 0) ? request.getPoints() : defaultPoints;
        if (pointsToAdd <= 0) {
            throw new AppException("Loại sự kiện tính điểm không hợp lệ hoặc số điểm bằng 0: " + rawAction,
                    HttpStatus.BAD_REQUEST);
        }

        int newReputation = (user.getReputationPoints() != null ? user.getReputationPoints() : 0) + pointsToAdd;
        int newBalance = (user.getUploadPointsBalance() != null ? user.getUploadPointsBalance() : 0) + pointsToAdd;
        user.setReputationPoints(newReputation);
        user.setUploadPointsBalance(newBalance);
        user.setScholarTitle(resolveScholarTierTitle(newReputation));

        if (reputationLogRepository != null) {
            ReputationLog repLog = ReputationLog.builder()
                    .userId(userId)
                    .actionType(rawAction)
                    .points(pointsToAdd)
                    .referenceId(request.getReferenceId())
                    .description(request.getDescription() != null && !request.getDescription().isBlank()
                            ? request.getDescription().trim()
                            : defaultDesc)
                    .idempotencyKey(idempotencyKey)
                    .build();
            try {
                reputationLogRepository.save(repLog);
            } catch (org.springframework.dao.DataIntegrityViolationException ex) {
                log.info("Duplicate reputation event intercepted for key {}", idempotencyKey);
                return ReputationEventResponse.builder()
                        .userId(userId)
                        .actionType(rawAction)
                        .pointsAdded(0)
                        .totalReputationPoints(user.getReputationPoints())
                        .uploadPointsBalance(user.getUploadPointsBalance())
                        .scholarTitle(user.getScholarTitle())
                        .duplicateSkipped(true)
                        .badges(mapBadges(user))
                        .build();
            }
        }

        userRepository.save(user);
        checkAndAwardBadges(user);

        return ReputationEventResponse.builder()
                .userId(userId)
                .actionType(rawAction)
                .pointsAdded(pointsToAdd)
                .totalReputationPoints(user.getReputationPoints())
                .uploadPointsBalance(user.getUploadPointsBalance())
                .scholarTitle(user.getScholarTitle())
                .duplicateSkipped(false)
                .badges(mapBadges(user))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public LeaderboardResponse getLeaderboard(String period, int limit, String currentUserEmail) {
        String normalizedPeriod = normalizePeriod(period);
        int safeLimit = Math.min(100, Math.max(1, limit));

        List<User> activeUsers = userRepository.findAllActiveNonAdminUsers();
        if (activeUsers == null || activeUsers.isEmpty()) {
            return LeaderboardResponse.builder()
                    .period(normalizedPeriod)
                    .updatedAt(OffsetDateTime.now())
                    .entries(Collections.emptyList())
                    .pointsToNextRank(0)
                    .build();
        }

        UUID currentUserId = null;
        if (currentUserEmail != null && !currentUserEmail.isBlank()) {
            currentUserId = userRepository.findByEmail(currentUserEmail.trim())
                    .map(User::getId)
                    .orElse(null);
        }

        Map<UUID, Integer> periodPointsMap = new HashMap<>();
        Map<UUID, Integer> bookmarkCountsMap = new HashMap<>();

        if (!"all-time".equals(normalizedPeriod) && reputationLogRepository != null) {
            OffsetDateTime since = "weekly".equals(normalizedPeriod)
                    ? OffsetDateTime.now().minusDays(7)
                    : OffsetDateTime.now().minusDays(30);
            List<Object[]> sums = reputationLogRepository.sumPointsByUserSince(since);
            if (sums != null) {
                for (Object[] row : sums) {
                    if (row != null && row.length >= 2 && row[0] instanceof UUID uid && row[1] instanceof Number num) {
                        periodPointsMap.put(uid, num.intValue());
                    }
                }
            }
            List<Object[]> bms = reputationLogRepository.countActionsByUserSince("RECEIVE_BOOKMARK", since);
            if (bms != null) {
                for (Object[] row : bms) {
                    if (row != null && row.length >= 2 && row[0] instanceof UUID uid && row[1] instanceof Number num) {
                        bookmarkCountsMap.put(uid, num.intValue());
                    }
                }
            }
        } else if (reputationLogRepository != null) {
            List<Object[]> bms = reputationLogRepository.countAllTimeActionsByUser("RECEIVE_BOOKMARK");
            if (bms != null) {
                for (Object[] row : bms) {
                    if (row != null && row.length >= 2 && row[0] instanceof UUID uid && row[1] instanceof Number num) {
                        bookmarkCountsMap.put(uid, num.intValue());
                    }
                }
            }
        }

        boolean useAllTimeFallback = !"all-time".equals(normalizedPeriod) && periodPointsMap.isEmpty();

        final UUID resolvedCurrentUserId = currentUserId;
        List<LeaderboardEntryDto> allRanked = new ArrayList<>();

        for (User u : activeUsers) {
            int allTimePts = u.getReputationPoints() != null ? u.getReputationPoints() : 0;
            int pts;
            if ("all-time".equals(normalizedPeriod) || useAllTimeFallback) {
                pts = allTimePts;
            } else {
                pts = periodPointsMap.getOrDefault(u.getId(), 0);
            }

            int uploads = u.getTotalUploads() != null ? u.getTotalUploads() : 0;
            int likes = u.getTotalLikesReceived() != null ? u.getTotalLikesReceived() : 0;
            int saves = bookmarkCountsMap.getOrDefault(u.getId(), Math.max(0, uploads * 2));
            int followers = u.getFollowerCount() != null ? u.getFollowerCount() : 0;
            String school = u.getUniversity() != null && u.getUniversity().getName() != null
                    ? u.getUniversity().getName()
                    : "Đại học thành viên DeDocu";
            String tierTitle = resolveScholarTierTitle(allTimePts);

            allRanked.add(LeaderboardEntryDto.builder()
                    .userId(u.getId().toString())
                    .name(u.getFullName() != null ? u.getFullName() : u.getUsername())
                    .handle("@" + u.getUsername())
                    .avatar(resolveAvatarUrl(u))
                    .school(school)
                    .title(tierTitle)
                    .points(pts)
                    .uploads(uploads)
                    .saves(saves)
                    .likes(likes)
                    .followerCount(followers)
                    .currentUser(resolvedCurrentUserId != null && resolvedCurrentUserId.equals(u.getId()))
                    .trend(pts > 0 ? "up" : "same")
                    .change(pts > 0 ? 1 : 0)
                    .build());
        }

        allRanked.sort(Comparator
                .comparingInt(LeaderboardEntryDto::getPoints)
                .thenComparingInt(LeaderboardEntryDto::getUploads)
                .thenComparingInt(LeaderboardEntryDto::getLikes)
                .thenComparingInt(LeaderboardEntryDto::getFollowerCount)
                .reversed());

        LeaderboardEntryDto currentUserEntry = null;
        for (int i = 0; i < allRanked.size(); i++) {
            LeaderboardEntryDto entry = allRanked.get(i);
            entry.setRank(i + 1);
            if (entry.isCurrentUser()) {
                currentUserEntry = entry;
            }
        }

        LeaderboardEntryDto nextRankUser = null;
        int pointsToNextRank = 0;
        if (currentUserEntry != null && currentUserEntry.getRank() > 1) {
            nextRankUser = allRanked.get(currentUserEntry.getRank() - 2);
            pointsToNextRank = Math.max(1, nextRankUser.getPoints() - currentUserEntry.getPoints() + 1);
        }

        List<LeaderboardEntryDto> topEntries = allRanked.stream()
                .limit(safeLimit)
                .collect(Collectors.toList());

        return LeaderboardResponse.builder()
                .period(normalizedPeriod)
                .updatedAt(OffsetDateTime.now())
                .entries(topEntries)
                .currentUserEntry(currentUserEntry)
                .nextRankUser(nextRankUser)
                .pointsToNextRank(pointsToNextRank)
                .build();
    }

    public static String resolveScholarTierTitle(int reputationPoints) {
        if (reputationPoints >= 1500) {
            return "Huyền Thoại";
        }
        if (reputationPoints >= 500) {
            return "Cao Thủ";
        }
        if (reputationPoints >= 100) {
            return "Chuyên Gia";
        }
        return "Tân Thủ";
    }

    private String normalizePeriod(String period) {
        if (period == null || period.isBlank()) {
            return "weekly";
        }
        String p = period.trim().toLowerCase(Locale.ROOT);
        if ("monthly".equals(p) || "all-time".equals(p) || "weekly".equals(p)) {
            return p;
        }
        return "weekly";
    }

    private String resolveAvatarUrl(User user) {
        if (user == null) {
            return "";
        }
        String avatar = user.getAvatarUrl();
        if (avatar == null || avatar.isBlank() || avatar.contains("seed=Scholar")) {
            String seed = user.getUsername() != null && !user.getUsername().isBlank()
                    ? user.getUsername()
                    : (user.getId() != null ? user.getId().toString() : "scholar");
            return "https://api.dicebear.com/7.x/avataaars/svg?seed=" + seed;
        }
        return avatar;
    }

    private UserSummaryDto mapToSummary(User user) {
        String badgeName = "Thành viên";
        if (user.getScholarTitle() != null && !user.getScholarTitle().isBlank()) {
            badgeName = user.getScholarTitle();
        } else if (user.getBadges() != null && !user.getBadges().isEmpty()) {
            badgeName = user.getBadges().iterator().next().getName();
        }

        return UserSummaryDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .avatarUrl(resolveAvatarUrl(user))
                .universityName(user.getUniversity() != null ? user.getUniversity().getName() : null)
                .badge(badgeName)
                .points(user.getUploadPointsBalance() != null ? user.getUploadPointsBalance() : 0)
                .build();
    }

    private User findUserByIdentifier(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            throw new ResourceNotFoundException("Định danh người dùng không hợp lệ");
        }

        String raw = identifier.trim();
        final String searchKey = raw.startsWith("@") ? raw.substring(1) : raw;

        if (UUID_PATTERN.matcher(searchKey).matches()) {
            try {
                UUID uuid = UUID.fromString(searchKey);
                var userOpt = userRepository.findById(uuid);
                if (userOpt.isPresent()) {
                    return userOpt.get();
                }
            } catch (Exception ignored) {
            }
        }

        return userRepository.findByUsername(searchKey)
                .or(() -> userRepository.findByEmail(searchKey))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy thông tin người dùng với định danh: " + identifier));
    }

    @Override
    @Transactional
    public UserResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(
                        () -> new ResourceNotFoundException("Không tìm thấy thông tin người dùng với email: " + email));

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
            user.setAvatarText(generateAvatarText(request.getFullName().trim()));
        }

        if (request.getMajor() != null) {
            user.setMajor(request.getMajor().trim());
        }

        if (request.getBio() != null) {
            user.setBio(request.getBio().trim());
        }

        if (request.getAvatarUrl() != null && !request.getAvatarUrl().isBlank()) {
            user.setAvatarUrl(request.getAvatarUrl().trim());
        }

        if (request.getUniversityName() != null) {
            String uniName = request.getUniversityName().trim();
            if (uniName.isEmpty()) {
                user.setUniversity(null);
            } else {
                University university = universityRepository.findFirstByNameIgnoreCase(uniName)
                        .orElseGet(() -> {
                            String code = uniName.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
                            if (code.length() > 20) {
                                code = code.substring(0, 20);
                            }
                            if (code.isEmpty()) {
                                code = "UNI_" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
                            }
                            while (universityRepository.findByCode(code).isPresent()) {
                                code = (code.length() > 14 ? code.substring(0, 14) : code) + "_"
                                        + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
                            }
                            University newUni = University.builder()
                                    .name(uniName)
                                    .code(code)
                                    .city("Việt Nam")
                                    .build();
                            return universityRepository.save(newUni);
                        });
                user.setUniversity(university);
            }
        }

        User updatedUser = userRepository.save(user);
        return mapToUserResponse(updatedUser);
    }

    @Override
    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(
                        () -> new ResourceNotFoundException("Không tìm thấy thông tin người dùng với email: " + email));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new AppException("Mật khẩu hiện tại không chính xác", HttpStatus.BAD_REQUEST);
        }

        if (request.getCurrentPassword().equals(request.getNewPassword())) {
            throw new AppException("Mật khẩu mới không được trùng với mật khẩu hiện tại", HttpStatus.BAD_REQUEST);
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void deleteAccount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(
                        () -> new ResourceNotFoundException("Không tìm thấy thông tin người dùng với email: " + email));
        userRepository.delete(user);
    }

    private String generateAvatarText(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            return "SC";
        }
        String[] parts = fullName.trim().split("\\s+");
        if (parts.length == 1) {
            return parts[0].substring(0, Math.min(2, parts[0].length())).toUpperCase();
        }
        return (parts[0].substring(0, 1) + parts[parts.length - 1].substring(0, 1)).toUpperCase();
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .universityId(user.getUniversity() != null ? user.getUniversity().getId() : null)
                .universityName(user.getUniversity() != null ? user.getUniversity().getName() : null)
                .email(user.getEmail())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .avatarUrl(resolveAvatarUrl(user))
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
                .badges(mapBadges(user))
                .createdAt(user.getCreatedAt())
                .build();
    }

    private List<BadgeResponse> mapBadges(User user) {
        if (user.getBadges() == null || user.getBadges().isEmpty()) {
            return new ArrayList<>();
        }
        return user.getBadges().stream()
                .map(badge -> BadgeResponse.builder()
                        .id(badge.getId())
                        .code(badge.getCode())
                        .name(badge.getName())
                        .description(badge.getDescription())
                        .iconUrl(badge.getIconUrl())
                        .build())
                .toList();
    }
}
