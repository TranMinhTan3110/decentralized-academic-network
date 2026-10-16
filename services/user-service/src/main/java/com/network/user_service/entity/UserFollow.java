package com.network.user_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "user_follows")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserFollow {

    @EmbeddedId
    private UserFollowId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("followerId")
    @JoinColumn(name = "follower_id", nullable = false)
    private User follower;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("followingId")
    @JoinColumn(name = "following_id", nullable = false)
    private User following;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }
}
