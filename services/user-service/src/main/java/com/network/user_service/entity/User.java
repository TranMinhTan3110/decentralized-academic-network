package com.network.user_service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
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

    @Column(name = "avatar_url", length = 500)
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

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

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
