package com.network.document_service.service;

import com.network.document_service.dto.request.DocumentUpdateRequest;
import com.network.document_service.dto.request.DocumentUploadRequest;
import com.network.document_service.dto.response.DocumentDetailResponse;
import com.network.document_service.dto.response.DocumentFeedResponse;
import com.network.document_service.dto.response.DocumentPreviewResponse;
import com.network.document_service.dto.response.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

public interface DocumentService {
    DocumentDetailResponse uploadDocument(UUID userId, DocumentUploadRequest request);
    DocumentDetailResponse getDocumentDetail(UUID id, UUID currentUserId);
    PageResponse<DocumentFeedResponse> getDocumentsFeed(
            String filter,
            UUID universityId,
            UUID courseId,
            String academicYear,
            String docType,
            UUID currentUserId,
            Pageable pageable);

    default PageResponse<DocumentFeedResponse> getDocumentsFeed(
            String filter,
            UUID universityId,
            UUID courseId,
            String academicYear,
            String docType,
            List<String> recentKeywords,
            UUID currentUserId,
            Pageable pageable) {
        return getDocumentsFeed(filter, universityId, courseId, academicYear, docType, currentUserId, pageable);
    }

    void recordView(UUID documentId, UUID currentUserId);

    PageResponse<DocumentFeedResponse> getMyViewHistory(UUID currentUserId, Pageable pageable);
    void deleteDocument(UUID documentId, UUID currentUserId);

    PageResponse<DocumentFeedResponse> searchDocuments(String query, UUID currentUserId, Pageable pageable);
    List<DocumentFeedResponse> getTrendingDocuments(int limit, UUID currentUserId);
    DocumentDetailResponse updateDocument(UUID documentId, UUID currentUserId, DocumentUpdateRequest request);
    DocumentPreviewResponse getDocumentPreview(UUID documentId);

    com.network.document_service.dto.response.DocumentFileResponse downloadDocument(UUID documentId, UUID currentUserId);

    /**
     * Sinh lại thumbnail cho các tài liệu cũ chưa có (idempotent, giới hạn theo lượt).
     *
     * @return {found, updated, failed}
     */
    java.util.Map<String, Integer> backfillThumbnails(int limit);
}
