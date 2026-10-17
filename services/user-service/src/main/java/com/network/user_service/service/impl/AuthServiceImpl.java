package com.network.user_service.service.impl;

import com.network.user_service.dto.request.ForgotPasswordRequest;
import com.network.user_service.dto.request.GoogleLoginRequest;
import com.network.user_service.dto.request.LoginRequest;
import com.network.user_service.dto.request.RegisterRequest;
import com.network.user_service.dto.request.ResetPasswordRequest;
import com.network.user_service.dto.request.VerifyOtpRequest;
import com.network.user_service.dto.response.AuthResponse;
import com.network.user_service.dto.response.GoogleTokenPayload;
import com.network.user_service.dto.response.UserResponse;
import com.network.user_service.entity.University;
import com.network.user_service.entity.User;
import com.network.user_service.entity.UserVerificationCode;
import com.network.user_service.exception.DuplicateResourceException;
import com.network.user_service.exception.InvalidCredentialsException;
import com.network.user_service.exception.ResourceNotFoundException;
import com.network.user_service.repository.UniversityRepository;
import com.network.user_service.repository.UserRepository;
import com.network.user_service.repository.UserVerificationCodeRepository;
import com.network.user_service.security.GoogleTokenVerifier;
import com.network.user_service.service.AuthService;
import com.network.user_service.service.EmailService;
import com.network.user_service.service.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final UniversityRepository universityRepository;
    private final UserVerificationCodeRepository verificationCodeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final GoogleTokenVerifier googleTokenVerifier;
    private final EmailService emailService;

    public AuthServiceImpl(
            UserRepository userRepository,
            UniversityRepository universityRepository,
            UserVerificationCodeRepository verificationCodeRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            GoogleTokenVerifier googleTokenVerifier,
            EmailService emailService
    ) {
        super();
        this.userRepository = userRepository;
        this.universityRepository = universityRepository;
        this.verificationCodeRepository = verificationCodeRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.googleTokenVerifier = googleTokenVerifier;
        this.emailService = emailService;
    }



    @Override
    @Transactional
    public UserResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String requestedUsername = request.getUsername().trim().toLowerCase();

        // 1. Kiểm tra username đã bị tài khoản khác (đã xác thực) sử dụng chưa
        Optional<User> existingUsernameUser = userRepository.findByUsername(requestedUsername);
        if (existingUsernameUser.isPresent()) {
            User existing = existingUsernameUser.get();
            if (!existing.getEmail().equalsIgnoreCase(email)) {
                if (Boolean.TRUE.equals(existing.getIsVerified())) {
                    throw new DuplicateResourceException("Username đã tồn tại trong hệ thống");
                }
                // Nếu tài khoản cũ chưa xác thực thì giải phóng username đó cho người dùng mới
                existing.setUsername(existing.getUsername() + "_" + UUID.randomUUID().toString().substring(0, 6));
                userRepository.save(existing);
            }
        }

        University university = null;
        if (request.getUniversityId() != null) {
            university = universityRepository.findById(request.getUniversityId()).orElse(null);
        }

        String avatarText = generateAvatarText(request.getFullName());

        // 2. Kiểm tra email trong hệ thống
        Optional<User> existingEmailUser = userRepository.findByEmail(email);
        User user;

        if (existingEmailUser.isPresent()) {
            user = existingEmailUser.get();
            if (Boolean.TRUE.equals(user.getIsVerified())) {
                throw new DuplicateResourceException("Email đã được sử dụng trong hệ thống");
            }
            // Nếu tài khoản CHƯA XÁC THỰC: Cập nhật lại thông tin mới nhất và cấp lại OTP
            user.setUsername(requestedUsername);
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
            user.setFullName(request.getFullName().trim());
            user.setUniversity(university);
            user.setMajor(request.getMajor());
            user.setAvatarText(avatarText);
            user.setAvatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=" + requestedUsername);
        } else {
            // Tạo tài khoản mới ở trạng thái chờ kích hoạt
            user = User.builder()
                    .email(email)
                    .username(requestedUsername)
                    .passwordHash(passwordEncoder.encode(request.getPassword()))
                    .fullName(request.getFullName().trim())
                    .university(university)
                    .major(request.getMajor())
                    .avatarText(avatarText)
                    .avatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=" + requestedUsername)
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
        }

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

        // Gửi email OTP (kết nối SMTP gửi hòm thư thật + fallback in ra console)
        emailService.sendOtpEmail(email, otpCode, "ACCOUNT_ACTIVATION");

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

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản với email này không tồn tại"));

        String otpCode = generateOtpCode();
        UserVerificationCode verificationCode = UserVerificationCode.builder()
                .user(user)
                .code(otpCode)
                .type("PASSWORD_RESET")
                .expiresAt(OffsetDateTime.now().plusMinutes(10))
                .isUsed(false)
                .build();

        verificationCodeRepository.save(verificationCode);

        // Gửi email OTP đặt lại mật khẩu
        emailService.sendOtpEmail(email, otpCode, "PASSWORD_RESET");
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidCredentialsException("Tài khoản không tồn tại trong hệ thống"));

        UserVerificationCode verificationCode = verificationCodeRepository
                .findTopByUserAndCodeAndTypeAndIsUsedFalseOrderByCreatedAtDesc(user, request.getOtp().trim(), "PASSWORD_RESET")
                .orElseThrow(() -> new InvalidCredentialsException("Mã OTP không chính xác hoặc đã được sử dụng"));

        if (verificationCode.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new InvalidCredentialsException("Mã OTP đã hết hạn, vui lòng yêu cầu mã mới");
        }

        // Đánh dấu mã OTP đã dùng
        verificationCode.setIsUsed(true);
        verificationCodeRepository.save(verificationCode);

        // Cập nhật mật khẩu mới
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Override
    @Transactional
    public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
        GoogleTokenPayload payload = googleTokenVerifier.verify(request.getIdToken().trim());
        String email = payload.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            String fullName = payload.getName() != null && !payload.getName().isBlank()
                    ? payload.getName().trim()
                    : "Google User";
            String baseUsername = email.contains("@") ? email.substring(0, email.indexOf("@")) : "google_user";
            baseUsername = baseUsername.replaceAll("[^a-zA-Z0-9_]", "_").toLowerCase();
            String uniqueUsername = baseUsername;
            int counter = 1;
            while (userRepository.existsByUsername(uniqueUsername)) {
                uniqueUsername = baseUsername + counter;
                counter++;
            }

            String avatarUrl = payload.getPicture() != null && !payload.getPicture().isBlank()
                    ? payload.getPicture()
                    : "https://api.dicebear.com/7.x/avataaars/svg?seed=" + uniqueUsername;

            User newUser = User.builder()
                    .email(email)
                    .username(uniqueUsername)
                    .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .fullName(fullName)
                    .avatarText(generateAvatarText(fullName))
                    .avatarUrl(avatarUrl)
                    .scholarTitle("Scholar Node")
                    .role("USER")
                    .status("ACTIVE")
                    .authProvider("GOOGLE")
                    .providerId(payload.getSub())
                    .isVerified(true) // Tài khoản Google được xác minh sẵn
                    .reputationPoints(0)
                    .uploadPointsBalance(20)
                    .followerCount(0)
                    .followingCount(0)
                    .totalUploads(0)
                    .totalLikesReceived(0)
                    .totalQuizzesCompleted(0)
                    .build();

            return userRepository.save(newUser);
        });

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
