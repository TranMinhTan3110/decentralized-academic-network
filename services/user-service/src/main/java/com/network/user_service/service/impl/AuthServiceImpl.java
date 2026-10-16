package com.network.user_service.service.impl;

import com.network.user_service.dto.request.LoginRequest;
import com.network.user_service.dto.request.RegisterRequest;
import com.network.user_service.dto.request.VerifyOtpRequest;
import com.network.user_service.dto.response.AuthResponse;
import com.network.user_service.dto.response.UserResponse;
import com.network.user_service.entity.University;
import com.network.user_service.entity.User;
import com.network.user_service.entity.UserVerificationCode;
import com.network.user_service.exception.DuplicateResourceException;
import com.network.user_service.exception.InvalidCredentialsException;
import com.network.user_service.repository.UniversityRepository;
import com.network.user_service.repository.UserRepository;
import com.network.user_service.repository.UserVerificationCodeRepository;
import com.network.user_service.service.AuthService;
import com.network.user_service.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final UniversityRepository universityRepository;
    private final UserVerificationCodeRepository verificationCodeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Override
    @Transactional
    public UserResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Email đã được sử dụng trong hệ thống");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("Username đã tồn tại trong hệ thống");
        }

        University university = null;
        if (request.getUniversityId() != null) {
            university = universityRepository.findById(request.getUniversityId()).orElse(null);
        }

        String avatarText = generateAvatarText(request.getFullName());

        User user = User.builder()
                .email(email)
                .username(request.getUsername().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .university(university)
                .major(request.getMajor())
                .avatarText(avatarText)
                .avatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=" + request.getUsername().trim())
                .scholarTitle("Scholar Node")
                .role("USER")
                .status("ACTIVE")
                .authProvider("LOCAL")
                .isVerified(false) // Chưa xác minh Email
                .reputationPoints(0)
                .uploadPointsBalance(20)
                .followerCount(0)
                .followingCount(0)
                .totalUploads(0)
                .totalLikesReceived(0)
                .totalQuizzesCompleted(0)
                .build();

        User savedUser = userRepository.save(user);

        // Sinh mã OTP 6 số và lưu vào DB (thời hạn 10 phút)
        String otpCode = generateOtpCode();
        UserVerificationCode verificationCode = UserVerificationCode.builder()
                .user(savedUser)
                .code(otpCode)
                .type("ACCOUNT_ACTIVATION")
                .expiresAt(OffsetDateTime.now().plusMinutes(10))
                .isUsed(false)
                .build();

        verificationCodeRepository.save(verificationCode);

        // Log mô phỏng gửi mail OTP (khi lên production kết nối Spring Mail)
        System.out.println("=================================================");
        System.out.println(">> [EMAIL SERVICE] Gửi OTP kích hoạt tới: " + email);
        System.out.println(">> [OTP CODE]: " + otpCode);
        System.out.println("=================================================");

        return mapToUserResponse(savedUser);
    }

    @Override
    @Transactional
    public UserResponse verifyOtp(VerifyOtpRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidCredentialsException("Tài khoản không tồn tại trong hệ thống"));

        UserVerificationCode verificationCode = verificationCodeRepository
                .findTopByUserAndCodeAndTypeAndIsUsedFalseOrderByCreatedAtDesc(user, request.getCode().trim(), "ACCOUNT_ACTIVATION")
                .orElseThrow(() -> new InvalidCredentialsException("Mã OTP không chính xác hoặc đã được sử dụng"));

        if (verificationCode.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new InvalidCredentialsException("Mã OTP đã hết hạn, vui lòng yêu cầu mã mới");
        }

        // Đánh dấu mã đã dùng & kích hoạt tài khoản
        verificationCode.setIsUsed(true);
        verificationCodeRepository.save(verificationCode);

        user.setIsVerified(true);
        User verifiedUser = userRepository.save(user);

        return mapToUserResponse(verifiedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidCredentialsException("Email hoặc mật khẩu không chính xác"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Email hoặc mật khẩu không chính xác");
        }

        // Kiểm tra xem đã kích hoạt email chưa
        if (!Boolean.TRUE.equals(user.getIsVerified())) {
            throw new InvalidCredentialsException("Tài khoản chưa được xác minh email. Vui lòng nhập mã OTP để kích hoạt");
        }

        String token = jwtService.generateToken(user);

        return AuthResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .expiresIn(jwtService.getExpirationInSeconds())
                .user(mapToUserResponse(user))
                .build();
    }

    private String generateOtpCode() {
        SecureRandom random = new SecureRandom();
        int num = 100000 + random.nextInt(900000);
        return String.valueOf(num);
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
}
