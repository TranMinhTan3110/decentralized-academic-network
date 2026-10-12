package com.network.user_service.service.impl;

import com.network.user_service.dto.response.UserResponse;
import com.network.user_service.entity.User;
import com.network.user_service.exception.ResourceNotFoundException;
import com.network.user_service.repository.UserRepository;
import com.network.user_service.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUserProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin người dùng với email: " + email));

        return mapToUserResponse(user);
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
