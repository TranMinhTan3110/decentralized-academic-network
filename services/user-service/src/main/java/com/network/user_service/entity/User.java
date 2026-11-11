package com.network.user_service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "university_id")
    private University university;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, unique = true, length = 100)
    private String username;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(name = "avatar_url", columnDefinition = "TEXT")
    private String avatarUrl;

    @Column(name = "avatar_text", length = 10)
    private String avatarText;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(length = 150)
    private String major;

    @Column(name = "scholar_title", length = 100)
    private String scholarTitle;

    @Column(name = "wallet_address", length = 100)
    private String walletAddress;

    @Builder.Default
    @Column(name = "follower_count")
    private Integer followerCount = 0;

    @Builder.Default
    @Column(name = "following_count")
    private Integer followingCount = 0;

    @Builder.Default
    @Column(name = "reputation_points")
    private Integer reputationPoints = 0;

    @Builder.Default
    @Column(name = "upload_points_balance")
    private Integer uploadPointsBalance = 20;

    @Builder.Default
    @Column(name = "total_uploads")
    private Integer totalUploads = 0;

    @Builder.Default
    @Column(name = "total_likes_received")
    private Integer totalLikesReceived = 0;

    @Builder.Default
    @Column(name = "total_quizzes_completed")
    private Integer totalQuizzesCompleted = 0;

    @Builder.Default
    @Column(length = 30)
    private String role = "USER";

    @Builder.Default
    @Column(length = 30)
    private String status = "ACTIVE";

    @Builder.Default
    @Column(name = "auth_provider", length = 50)
    private String authProvider = "LOCAL";

    @Column(name = "provider_id")
    private String providerId;

    @Builder.Default
    @Column(name = "is_verified")
    private Boolean isVerified = false;

    @Builder.Default
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "user_badges",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "badge_id")
    )
    private Set<Badge> badges = new HashSet<>();

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public University getUniversity() { return university; }
    public void setUniversity(University university) { this.university = university; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public String getAvatarText() { return avatarText; }
    public void setAvatarText(String avatarText) { this.avatarText = avatarText; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getMajor() { return major; }
    public void setMajor(String major) { this.major = major; }

    public String getScholarTitle() { return scholarTitle; }
    public void setScholarTitle(String scholarTitle) { this.scholarTitle = scholarTitle; }

    public String getWalletAddress() { return walletAddress; }
    public void setWalletAddress(String walletAddress) { this.walletAddress = walletAddress; }

    public Integer getFollowerCount() { return followerCount; }
    public void setFollowerCount(Integer followerCount) { this.followerCount = followerCount; }

    public Integer getFollowingCount() { return followingCount; }
    public void setFollowingCount(Integer followingCount) { this.followingCount = followingCount; }

    public Integer getReputationPoints() { return reputationPoints; }
    public void setReputationPoints(Integer reputationPoints) { this.reputationPoints = reputationPoints; }

    public Integer getUploadPointsBalance() { return uploadPointsBalance; }
    public void setUploadPointsBalance(Integer uploadPointsBalance) { this.uploadPointsBalance = uploadPointsBalance; }

    public Integer getTotalUploads() { return totalUploads; }
    public void setTotalUploads(Integer totalUploads) { this.totalUploads = totalUploads; }

    public Integer getTotalLikesReceived() { return totalLikesReceived; }
    public void setTotalLikesReceived(Integer totalLikesReceived) { this.totalLikesReceived = totalLikesReceived; }

    public Integer getTotalQuizzesCompleted() { return totalQuizzesCompleted; }
    public void setTotalQuizzesCompleted(Integer totalQuizzesCompleted) { this.totalQuizzesCompleted = totalQuizzesCompleted; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getAuthProvider() { return authProvider; }
    public void setAuthProvider(String authProvider) { this.authProvider = authProvider; }

    public String getProviderId() { return providerId; }
    public void setProviderId(String providerId) { this.providerId = providerId; }

    public Boolean getIsVerified() { return isVerified; }
    public void setIsVerified(Boolean isVerified) { this.isVerified = isVerified; }

    public Set<Badge> getBadges() { return badges; }
    public void setBadges(Set<Badge> badges) { this.badges = badges; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = OffsetDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
