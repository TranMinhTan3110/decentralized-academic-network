package com.network.document_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDocumentResponse {
    private UUID id;
    private String title;
    private String cid;
    private Long fileSizeBytes;
    private String authorName;
    private UUID authorId;
    private Integer viewCount;
    private Integer likeCount;
    private Integer commentCount;
    private String status;
    private OffsetDateTime createdAt;
}

