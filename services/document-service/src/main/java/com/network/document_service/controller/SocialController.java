package com.network.document_service.controller;

import com.network.document_service.config.SecurityContextHolder;
import com.network.document_service.dto.request.CreateCommentRequest;
import com.network.document_service.dto.request.ReportDocumentRequest;
import com.network.document_service.dto.request.UnlockDocumentRequest;
import com.network.document_service.dto.response.*;
import com.network.document_service.exception.UnauthorizedException;
import com.network.document_service.service.SocialInteractionService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping({"/api/documents", "/api/v1/documents"})
public class SocialController {

    private final SocialInteractionService socialInteractionService;

    public SocialController(SocialInteractionService socialInteractionService) {
        this.socialInteractionService = socialInteractionService;
    }

    private UUID getOptionalUserId() {
        return SecurityContextHolder.getUserId();
    }

    private UUID getRequiredUserId() {
        UUID userId = SecurityContextHolder.getUserId();
        if (userId == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để thực hiện hành động này");
        }
        return userId;
    }

    @PostMapping({"/{id}/likes", "/{id}/like"})
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> toggleLike(@PathVariable("id") UUID id) {
        UUID userId = getRequiredUserId();
        boolean isLiked = socialInteractionService.toggleLike(id, userId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("liked", isLiked)));
    }

    @GetMapping("/{id}/likes")
    public ResponseEntity<ApiResponse<List<AuthorSummaryDto>>> getUsersWhoLiked(@PathVariable("id") UUID id) {
        List<AuthorSummaryDto> users = socialInteractionService.getUsersWhoLiked(id);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<CommentResponse>> addComment(
            @PathVariable("id") UUID id,
            @Valid @RequestBody CreateCommentRequest request) {
        UUID userId = getRequiredUserId();
        CommentResponse response = socialInteractionService.addComment(id, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Bình luận thành công", response));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<PageResponse<CommentResponse>>> getComments(
            @PathVariable("id") UUID id,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<CommentResponse> comments = socialInteractionService.getComments(id, pageable);
        return ResponseEntity.ok(ApiResponse.success(comments));
    }

    @DeleteMapping({"/comments/{commentId}", "/{id}/comments/{commentId}"})
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable(name = "id", required = false) UUID id,
            @PathVariable("commentId") UUID commentId) {
        UUID userId = getRequiredUserId();
        socialInteractionService.deleteComment(commentId, userId);
        return ResponseEntity.ok(ApiResponse.success("Xóa bình luận thành công", null));
    }

    @PostMapping({"/{id}/bookmarks", "/{id}/bookmark"})
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> toggleBookmark(
            @PathVariable("id") UUID id,
            @RequestParam(name = "collectionName", required = false, defaultValue = "Mặc định") String collectionName) {
        UUID userId = getRequiredUserId();
        boolean isBookmarked = socialInteractionService.toggleBookmark(id, userId, collectionName);
        return ResponseEntity.ok(ApiResponse.success(Map.of("bookmarked", isBookmarked)));
    }

    @DeleteMapping({"/{id}/bookmarks", "/{id}/bookmark"})
    public ResponseEntity<ApiResponse<Void>> removeBookmark(@PathVariable("id") UUID id) {
        UUID userId = getRequiredUserId();
        socialInteractionService.removeBookmark(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Đã bỏ lưu tài liệu", null));
    }

    @GetMapping({"/bookmarks/my", "/bookmarks/me", "/bookmarked/me"})
    public ResponseEntity<ApiResponse<PageResponse<DocumentFeedResponse>>> getMyBookmarks(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size) {
        UUID userId = getRequiredUserId();
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<DocumentFeedResponse> bookmarks = socialInteractionService.getMyBookmarks(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(bookmarks));
    }

    @PostMapping("/{id}/unlock")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> unlockDocument(
            @PathVariable("id") UUID id,
            @RequestBody(required = false) UnlockDocumentRequest request) {
        UUID userId = getRequiredUserId();
        boolean unlocked = socialInteractionService.unlockDocument(id, userId, request);
        return ResponseEntity.ok(ApiResponse.success(Map.of("unlocked", unlocked)));
    }

    @GetMapping("/{id}/unlock-status")
    public ResponseEntity<ApiResponse<UnlockStatusResponse>> checkUnlockStatus(@PathVariable("id") UUID id) {
        UUID userId = getOptionalUserId();
        UnlockStatusResponse response = socialInteractionService.checkUnlockStatus(id, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/unlocked/me")
    public ResponseEntity<ApiResponse<PageResponse<DocumentFeedResponse>>> getMyUnlockedDocuments(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size) {
        UUID userId = getRequiredUserId();
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<DocumentFeedResponse> response = socialInteractionService.getMyUnlockedDocuments(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping({"/{id}/reports", "/{id}/report"})
    public ResponseEntity<ApiResponse<Void>> reportDocument(
            @PathVariable("id") UUID id,
            @Valid @RequestBody ReportDocumentRequest request) {
        UUID userId = getRequiredUserId();
        socialInteractionService.reportDocument(id, userId, request);
        return ResponseEntity.ok(ApiResponse.success("Báo cáo vi phạm đã được ghi nhận", null));
    }
}
