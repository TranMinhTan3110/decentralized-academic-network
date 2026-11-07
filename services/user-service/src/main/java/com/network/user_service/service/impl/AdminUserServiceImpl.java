package com.network.user_service.service.impl;

import com.network.user_service.dto.request.UpdateUserRoleRequest;
import com.network.user_service.dto.request.UpdateUserStatusRequest;
import com.network.user_service.dto.response.AdminUserResponse;
import com.network.user_service.dto.response.AdminUserStatsResponse;
import com.network.user_service.entity.User;
import com.network.user_service.exception.AppException;
import com.network.user_service.exception.ResourceNotFoundException;
import com.network.user_service.repository.UserRepository;
import com.network.user_service.service.AdminUserService;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;

    public AdminUserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminUserResponse> getUsers(int page, int size, String search, String role, String status, UUID universityId) {
        int sanitizedSize = Math.min(Math.max(size, 1), 100);
        int sanitizedPage = Math.max(page, 0);
        Pageable pageable = PageRequest.of(sanitizedPage, sanitizedSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<User> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.isBlank()) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                Predicate emailPred = cb.like(cb.lower(root.get("email")), searchPattern);
                Predicate usernamePred = cb.like(cb.lower(root.get("username")), searchPattern);
                Predicate fullNamePred = cb.like(cb.lower(root.get("fullName")), searchPattern);
                predicates.add(cb.or(emailPred, usernamePred, fullNamePred));
            }

            if (role != null && !role.isBlank()) {
                predicates.add(cb.equal(cb.upper(root.get("role")), role.trim().toUpperCase()));
            }

            if (status != null && !status.isBlank()) {
                predicates.add(cb.equal(cb.upper(root.get("status")), status.trim().toUpperCase()));
            }

            if (universityId != null) {
                predicates.add(cb.equal(root.get("university").get("id"), universityId));
            }

            if (query != null && query.getResultType() != Long.class && query.getResultType() != long.class) {
                root.fetch("university", JoinType.LEFT);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return userRepository.findAll(spec, pageable).map(this::mapToAdminUserResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminUserResponse getUserById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));
        return mapToAdminUserResponse(user);
    }

    @Override
    @Transactional
    public AdminUserResponse updateUserStatus(UUID targetUserId, UpdateUserStatusRequest request, String currentAdminEmail) {
        String newStatus = request.getStatus() != null ? request.getStatus().trim().toUpperCase() : "";
        if (!"ACTIVE".equals(newStatus) && !"BANNED".equals(newStatus)) {
            throw new AppException("Trạng thái người dùng không hợp lệ. Chỉ chấp nhận ACTIVE hoặc BANNED", HttpStatus.BAD_REQUEST);
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + targetUserId));

        User currentAdmin = userRepository.findByEmail(currentAdminEmail)
                .orElseThrow(() -> new AppException("Không tìm thấy thông tin quản trị viên đang thao tác", HttpStatus.UNAUTHORIZED));

        if (targetUser.getId().equals(currentAdmin.getId()) && "BANNED".equals(newStatus)) {
            throw new AppException("Quản trị viên không được phép tự khóa tài khoản của chính mình", HttpStatus.BAD_REQUEST);
        }

        targetUser.setStatus(newStatus);
        User savedUser = userRepository.save(targetUser);

        log.info("Admin [{}] updated status of user [{}] to [{}]. Reason: {}",
                currentAdminEmail, targetUserId, newStatus, request.getReason());

        return mapToAdminUserResponse(savedUser);
    }

    @Override
    @Transactional
    public AdminUserResponse updateUserRole(UUID targetUserId, UpdateUserRoleRequest request, String currentAdminEmail) {
        String newRole = request.getRole() != null ? request.getRole().trim().toUpperCase() : "";
        if (!"ADMIN".equals(newRole) && !"USER".equals(newRole)) {
            throw new AppException("Vai trò người dùng không hợp lệ. Chỉ chấp nhận ADMIN hoặc USER", HttpStatus.BAD_REQUEST);
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + targetUserId));

        User currentAdmin = userRepository.findByEmail(currentAdminEmail)
                .orElseThrow(() -> new AppException("Không tìm thấy thông tin quản trị viên đang thao tác", HttpStatus.UNAUTHORIZED));

        if (targetUser.getId().equals(currentAdmin.getId()) && !"ADMIN".equals(newRole)) {
            throw new AppException("Quản trị viên không được phép tự thu hồi quyền Admin của chính mình", HttpStatus.BAD_REQUEST);
        }

        targetUser.setRole(newRole);
        User savedUser = userRepository.save(targetUser);

        log.info("Admin [{}] updated role of user [{}] to [{}]", currentAdminEmail, targetUserId, newRole);

        return mapToAdminUserResponse(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminUserStatsResponse getUserStats() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByStatusIgnoreCase("ACTIVE");
        long bannedUsers = userRepository.countByStatusIgnoreCase("BANNED");
        OffsetDateTime startOfWeek = OffsetDateTime.now().minusDays(7);
        long newUsersThisWeek = userRepository.countByCreatedAtGreaterThanEqual(startOfWeek);

        return AdminUserStatsResponse.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .bannedUsers(bannedUsers)
                .newUsersThisWeek(newUsersThisWeek)
                .build();
    }

    private AdminUserResponse mapToAdminUserResponse(User user) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .universityName(user.getUniversity() != null ? user.getUniversity().getName() : null)
                .major(user.getMajor())
                .role(user.getRole())
                .status(user.getStatus())
                .totalUploads(user.getTotalUploads() != null ? user.getTotalUploads() : 0)
                .reputationPoints(user.getReputationPoints() != null ? user.getReputationPoints() : 0)
                .scholarTitle(user.getScholarTitle() != null ? user.getScholarTitle() : "Scholar Node")
                .createdAt(user.getCreatedAt())
                .build();
    }
}

