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
public class CommentResponse {
    private UUID id;
    private UUID documentId;
    private UUID parentId;
    private Integer pageNumber;
    private String content;
    private Integer likeCount;
    private AuthorSummaryDto author;
    private List<CommentResponse> replies;
    private OffsetDateTime createdAt;
}
