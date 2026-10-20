package com.network.user_service.service.impl;

import com.network.user_service.dto.request.ChangePasswordRequest;
import com.network.user_service.dto.request.UpdateProfileRequest;
import com.network.user_service.dto.response.UserResponse;
import com.network.user_service.entity.University;
import com.network.user_service.entity.User;
import com.network.user_service.exception.AppException;
import com.network.user_service.exception.ResourceNotFoundException;
import com.network.user_service.repository.UniversityRepository;
import com.network.user_service.repository.UserRepository;
import com.network.user_service.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UniversityRepository universityRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUserProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin người dùng với email: " + email));

        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin người dùng với email: " + email));

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
                                code = (code.length() > 14 ? code.substring(0, 14) : code) + "_" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
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
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin người dùng với email: " + email));

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
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin người dùng với email: " + email));
        user.setStatus("DELETED");
        user.setIsVerified(false);
        userRepository.save(user);
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
                .createdAt(user.getCreatedAt())
                .build();
    }
}
