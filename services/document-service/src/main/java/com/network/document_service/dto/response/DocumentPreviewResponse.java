package com.network.document_service.dto.response;

import lombok.*;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentPreviewResponse {
    private UUID documentId;
    private String title;
    private int freePages;
    private int totalPages;
    private boolean isBlurLocked;
    private String thumbnailUrl;
    private String previewIpfsCid;
    private List<String> previewPages;
}
