package com.network.document_service.service;

import com.network.document_service.dto.request.CreateCommentRequest;
import com.network.document_service.dto.request.ReportDocumentRequest;
import com.network.document_service.dto.request.UnlockDocumentRequest;
import com.network.document_service.dto.response.CommentResponse;
import com.network.document_service.dto.response.DocumentFeedResponse;
import com.network.document_service.dto.response.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface SocialInteractionService {
    boolean toggleLike(UUID documentId, UUID userId);
    CommentResponse addComment(UUID documentId, UUID userId, CreateCommentRequest request);
    PageResponse<CommentResponse> getComments(UUID documentId, Pageable pageable);
    boolean toggleBookmark(UUID documentId, UUID userId, String collectionName);
    PageResponse<DocumentFeedResponse> getMyBookmarks(UUID userId, Pageable pageable);
    boolean unlockDocument(UUID documentId, UUID userId, UnlockDocumentRequest request);
    void reportDocument(UUID documentId, UUID userId, ReportDocumentRequest request);
}
