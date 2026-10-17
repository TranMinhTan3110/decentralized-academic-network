package com.network.document_service.service;

import com.network.document_service.dto.request.CreateCommentRequest;
import com.network.document_service.dto.request.ReportDocumentRequest;
import com.network.document_service.dto.request.UnlockDocumentRequest;
import com.network.document_service.dto.response.*;
import com.network.document_service.entity.DocumentReport;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface SocialInteractionService {
    boolean toggleLike(UUID documentId, UUID userId);
    List<AuthorSummaryDto> getUsersWhoLiked(UUID documentId);

    CommentResponse addComment(UUID documentId, UUID userId, CreateCommentRequest request);
    PageResponse<CommentResponse> getComments(UUID documentId, Pageable pageable);
    void deleteComment(UUID commentId, UUID currentUserId);

    boolean toggleBookmark(UUID documentId, UUID userId, String collectionName);
    void removeBookmark(UUID documentId, UUID userId);
    PageResponse<DocumentFeedResponse> getMyBookmarks(UUID userId, Pageable pageable);

    boolean unlockDocument(UUID documentId, UUID userId, UnlockDocumentRequest request);
    UnlockStatusResponse checkUnlockStatus(UUID documentId, UUID userId);
    PageResponse<DocumentFeedResponse> getMyUnlockedDocuments(UUID userId, Pageable pageable);

    void reportDocument(UUID documentId, UUID userId, ReportDocumentRequest request);
    List<DocumentReport> getAdminReports();
    void moderateDocument(UUID documentId, String status, String reason);
}
