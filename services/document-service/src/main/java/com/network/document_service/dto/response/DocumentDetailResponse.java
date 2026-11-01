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
public class DocumentDetailResponse {
    private UUID id;
    private String title;
    private String description;
    private String caption;
    private String docType;
    private String academicYear;
    private String semester;
    private String ipfsCid;
    private String previewIpfsCid;
    private String fileUrl;
    private Long fileSizeBytes;
    private String fileExtension;
    private String thumbnailUrl;
    private Integer totalPages;
    private Integer freePages;
    private Boolean isBlurLocked;
    private Integer unlockPointsRequired;
    private String status;
    private Integer likeCount;
    private Integer commentCount;
    private Integer viewCount;
    private Integer downloadCount;
    private Integer bookmarkCount;
    private UUID universityId;
    private String universityName;
    private UUID courseId;
    private String courseName;
    private AuthorSummaryDto author;
    private Boolean hasLiked;
    private Boolean hasBookmarked;
    private Boolean hasUnlocked;
    private List<DocumentAttachmentDto> attachments;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
