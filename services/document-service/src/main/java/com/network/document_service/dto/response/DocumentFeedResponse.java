package com.network.document_service.dto.response;

import lombok.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentFeedResponse {
    private UUID id;
    private String title;
    private String description;
    private String docType;
    private String academicYear;
    private String semester;
    private String fileExtension;
    private String thumbnailUrl;
    private Integer totalPages;
    private Integer freePages;
    private Boolean isBlurLocked;
    private Integer unlockPointsRequired;
    private Integer likeCount;
    private Integer commentCount;
    private Integer viewCount;
    private Integer bookmarkCount;
    private String universityName;
    private String courseName;
    private AuthorSummaryDto author;
    private Boolean hasLiked;
    private Boolean hasBookmarked;
    private Boolean hasUnlocked;
    private List<DocumentAttachmentDto> attachments;
    private String recommendationReason;
    private Double recommendationScore;
    private OffsetDateTime createdAt;
}
