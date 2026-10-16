package com.network.document_service.service;

import com.network.document_service.dto.request.DocumentUploadRequest;
import com.network.document_service.dto.response.DocumentDetailResponse;
import com.network.document_service.dto.response.DocumentFeedResponse;
import com.network.document_service.dto.response.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface DocumentService {
    DocumentDetailResponse uploadDocument(UUID userId, DocumentUploadRequest request);
    DocumentDetailResponse getDocumentDetail(UUID id, UUID currentUserId);
    PageResponse<DocumentFeedResponse> getDocumentsFeed(
            String filter,
            UUID universityId,
            UUID courseId,
            String academicYear,
            UUID currentUserId,
            Pageable pageable);
    void recordView(UUID documentId, UUID currentUserId);
    void deleteDocument(UUID documentId, UUID currentUserId);
}
