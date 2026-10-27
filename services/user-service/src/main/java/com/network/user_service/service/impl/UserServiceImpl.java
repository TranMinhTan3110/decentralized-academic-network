package com.network.user_service.service.impl;

import com.network.user_service.dto.request.ChangePasswordRequest;
import com.network.user_service.dto.request.UpdateProfileRequest;
import com.network.user_service.dto.response.BadgeResponse;
import com.network.user_service.dto.response.FollowResponse;
import com.network.user_service.dto.response.UserResponse;
import com.network.user_service.dto.response.UserSummaryDto;
import com.network.user_service.entity.Badge;
import com.network.user_service.entity.PointTransaction;
import com.network.user_service.entity.University;
import com.network.user_service.entity.User;
import com.network.user_service.entity.UserFollow;
import com.network.user_service.entity.UserFollowId;
import com.network.user_service.exception.AppException;
import com.network.user_service.exception.ResourceNotFoundException;
import com.network.user_service.repository.BadgeRepository;
import com.network.user_service.repository.PointTransactionRepository;
import com.network.user_service.repository.UniversityRepository;
import com.network.user_service.repository.UserFollowRepository;
import com.network.user_service.repository.UserRepository;
import com.network.user_service.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(
            UserRepository userRepository,
            UniversityRepository universityRepository,
            UserFollowRepository userFollowRepository,
            BadgeRepository badgeRepository,
            PointTransactionRepository pointTransactionRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.universityRepository = universityRepository;
        this.userFollowRepository = userFollowRepository;
        this.badgeRepository = badgeRepository;
        this.pointTransactionRepository = pointTransactionRepository;
        this.passwordEncoder = passwordEncoder;
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

        // 1. Khởi đầu chia sẻ: Tải lên ít nhất 1 tài liệu
        if (user.getTotalUploads() != null && user.getTotalUploads() >= 1 && !existingCodes.contains("FIRST_UPLOAD")) {
            var b = badgeRepository.findByCode("FIRST_UPLOAD");
            if (b.isPresent()) {
                userBadges.add(b.get());
                changed = true;
            }
        }

        // 2. Đóng góp tích cực: Tải lên từ 10 tài liệu
        if (user.getTotalUploads() != null && user.getTotalUploads() >= 10
                && !existingCodes.contains("ACTIVE_CONTRIBUTOR")) {
            var b = badgeRepository.findByCode("ACTIVE_CONTRIBUTOR");
            if (b.isPresent()) {
                userBadges.add(b.get());
                changed = true;
            }
        }

        // 3. Top Author 2025: Tải lên từ 5 tài liệu và có lượt thích
        if (user.getTotalUploads() != null && user.getTotalUploads() >= 5 &&
                user.getTotalLikesReceived() != null && user.getTotalLikesReceived() >= 20 &&
                !existingCodes.contains("TOP_AUTHOR_2025")) {
            var b = badgeRepository.findByCode("TOP_AUTHOR_2025");
            if (b.isPresent()) {
                userBadges.add(b.get());
                changed = true;
            }
        }

        // 4. Học giả tri thức: Đạt mốc 500+ điểm uy tín
        if (user.getReputationPoints() != null && user.getReputationPoints() >= 500
                && !existingCodes.contains("REPUTATION_500")) {
            var b = badgeRepository.findByCode("REPUTATION_500");
            if (b.isPresent()) {
                userBadges.add(b.get());
                changed = true;
            }
        }

        // 5. 1,500+ Uy tín: Đạt mốc 1,500+ điểm uy tín
        if (user.getReputationPoints() != null && user.getReputationPoints() >= 1500
                && !existingCodes.contains("REPUTATION_1500")) {
            var b = badgeRepository.findByCode("REPUTATION_1500");
            if (b.isPresent()) {
                userBadges.add(b.get());
                changed = true;
            }
        }

        // 6. Bậc thầy Quiz: Hoàn thành từ 20 bài Quiz
        if (user.getTotalQuizzesCompleted() != null && user.getTotalQuizzesCompleted() >= 20
                && !existingCodes.contains("QUIZ_MASTER")) {
            var b = badgeRepository.findByCode("QUIZ_MASTER");
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
                .avatarUrl(user.getAvatarUrl())
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
