package com.network.document_service.controller;

import com.network.document_service.config.SecurityContextHolder;
import com.network.document_service.dto.request.CreateCommentRequest;
import com.network.document_service.dto.request.ReportDocumentRequest;
import com.network.document_service.dto.request.UnlockDocumentRequest;
import com.network.document_service.dto.response.ApiResponse;
import com.network.document_service.dto.response.CommentResponse;
import com.network.document_service.dto.response.DocumentFeedResponse;
import com.network.document_service.dto.response.PageResponse;
import com.network.document_service.exception.UnauthorizedException;
import com.network.document_service.service.SocialInteractionService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
public class SocialController {

    private final SocialInteractionService socialInteractionService;

    public SocialController(SocialInteractionService socialInteractionService) {
        this.socialInteractionService = socialInteractionService;
    }

    private UUID getRequiredUserId() {
        UUID userId = SecurityContextHolder.getUserId();
        if (userId == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để thực hiện hành động này");
        }
        return userId;
    }

    @PostMapping("/{id}/likes")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> toggleLike(@PathVariable UUID id) {
        UUID userId = getRequiredUserId();
        boolean isLiked = socialInteractionService.toggleLike(id, userId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("liked", isLiked)));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<CommentResponse>> addComment(
            @PathVariable UUID id,
            @Valid @RequestBody CreateCommentRequest request) {
        UUID userId = getRequiredUserId();
        CommentResponse response = socialInteractionService.addComment(id, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Bình luận thành công", response));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<PageResponse<CommentResponse>>> getComments(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<CommentResponse> comments = socialInteractionService.getComments(id, pageable);
        return ResponseEntity.ok(ApiResponse.success(comments));
    }

    @PostMapping("/{id}/bookmarks")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> toggleBookmark(
            @PathVariable UUID id,
            @RequestParam(required = false, defaultValue = "Mặc định") String collectionName) {
        UUID userId = getRequiredUserId();
        boolean isBookmarked = socialInteractionService.toggleBookmark(id, userId, collectionName);
        return ResponseEntity.ok(ApiResponse.success(Map.of("bookmarked", isBookmarked)));
    }

    @GetMapping("/bookmarks/my")
    public ResponseEntity<ApiResponse<PageResponse<DocumentFeedResponse>>> getMyBookmarks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        UUID userId = getRequiredUserId();
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<DocumentFeedResponse> bookmarks = socialInteractionService.getMyBookmarks(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(bookmarks));
    }

    @PostMapping("/{id}/unlock")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> unlockDocument(
            @PathVariable UUID id,
            @RequestBody(required = false) UnlockDocumentRequest request) {
        UUID userId = getRequiredUserId();
        boolean unlocked = socialInteractionService.unlockDocument(id, userId, request);
        return ResponseEntity.ok(ApiResponse.success(Map.of("unlocked", unlocked)));
    }

    @PostMapping("/{id}/reports")
    public ResponseEntity<ApiResponse<Void>> reportDocument(
            @PathVariable UUID id,
            @Valid @RequestBody ReportDocumentRequest request) {
        UUID userId = getRequiredUserId();
        socialInteractionService.reportDocument(id, userId, request);
        return ResponseEntity.ok(ApiResponse.success("Báo cáo vi phạm đã được ghi nhận", null));
    }
}
