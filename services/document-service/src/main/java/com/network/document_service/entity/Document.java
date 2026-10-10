package com.network.document_service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "university_id")
    private University university;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String caption;

    @Builder.Default
    @Column(name = "doc_type", nullable = false, length = 50)
    private String docType = "SLIDE";

    @Builder.Default
    @Column(name = "academic_year", length = 20)
    private String academicYear = "2025";

    @Column(length = 20)
    private String semester;

    @Column(name = "ipfs_cid", nullable = false, length = 255)
    private String ipfsCid;

    @Column(name = "storage_node_peer", length = 150)
    private String storageNodePeer;

    @Column(name = "file_url", length = 500)
    private String fileUrl;

    @Builder.Default
    @Column(name = "file_size_bytes", nullable = false)
    private Long fileSizeBytes = 0L;

    @Builder.Default
    @Column(name = "file_extension", length = 10)
    private String fileExtension = "pdf";

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Builder.Default
    @Column(name = "total_pages", nullable = false)
    private Integer totalPages = 1;

    @Builder.Default
    @Column(name = "free_pages", nullable = false)
    private Integer freePages = 3;

    @Builder.Default
    @Column(name = "is_blur_locked", nullable = false)
    private Boolean isBlurLocked = true;

    @Builder.Default
    @Column(name = "unlock_points_required", nullable = false)
    private Integer unlockPointsRequired = 10;

    @Builder.Default
    @Column(length = 30)
    private String status = "PUBLISHED";

    @Builder.Default
    @Column(name = "like_count")
    private Integer likeCount = 0;

    @Builder.Default
    @Column(name = "comment_count")
    private Integer commentCount = 0;

    @Builder.Default
    @Column(name = "view_count")
    private Integer viewCount = 0;

    @Builder.Default
    @Column(name = "download_count")
    private Integer downloadCount = 0;

    @Builder.Default
    @Column(name = "bookmark_count")
    private Integer bookmarkCount = 0;

    @Builder.Default
    @Column(name = "quiz_generated_count")
    private Integer quizGeneratedCount = 0;

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
