package com.network.document_service.controller;

import com.network.document_service.config.SecurityContextHolder;
import com.network.document_service.dto.request.DocumentUpdateRequest;
import com.network.document_service.dto.request.DocumentUploadRequest;
import com.network.document_service.dto.response.*;
import com.network.document_service.exception.UnauthorizedException;
import com.network.document_service.service.DocumentService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/documents", "/api/v1/documents"})
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
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

    @PostMapping(value = {"", "/upload"}, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DocumentDetailResponse>> uploadDocument(
            @Valid @ModelAttribute DocumentUploadRequest request) {
        UUID userId = getRequiredUserId();
        DocumentDetailResponse response = documentService.uploadDocument(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đăng tải tài liệu thành công", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DocumentDetailResponse>> getDocumentDetail(@PathVariable UUID id) {
        UUID currentUserId = getOptionalUserId();
        DocumentDetailResponse detail = documentService.getDocumentDetail(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<DocumentFeedResponse>>> getDocumentsFeed(
            @RequestParam(required = false, defaultValue = "latest") String filter,
            @RequestParam(required = false) UUID universityId,
            @RequestParam(required = false) UUID courseId,
            @RequestParam(required = false) String academicYear,
            @RequestParam(required = false) String docType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        UUID currentUserId = getOptionalUserId();
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<DocumentFeedResponse> feed = documentService.getDocumentsFeed(
                filter, universityId, courseId, academicYear, docType, currentUserId, pageable
        );
        return ResponseEntity.ok(ApiResponse.success(feed));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PageResponse<DocumentFeedResponse>>> searchDocuments(
            @RequestParam(name = "q", required = false, defaultValue = "") String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        UUID currentUserId = getOptionalUserId();
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<DocumentFeedResponse> result = documentService.searchDocuments(query, currentUserId, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/trending")
    public ResponseEntity<ApiResponse<List<DocumentFeedResponse>>> getTrendingDocuments(
            @RequestParam(defaultValue = "10") int limit) {
        UUID currentUserId = getOptionalUserId();
        List<DocumentFeedResponse> trending = documentService.getTrendingDocuments(limit, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(trending));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DocumentDetailResponse>> updateDocument(
            @PathVariable UUID id,
            @Valid @RequestBody DocumentUpdateRequest request) {
        UUID currentUserId = getRequiredUserId();
        DocumentDetailResponse updated = documentService.updateDocument(id, currentUserId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin tài liệu thành công", updated));
    }

    @GetMapping("/views/me")
    public ResponseEntity<ApiResponse<PageResponse<DocumentFeedResponse>>> getMyViewHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        UUID currentUserId = getRequiredUserId();
        PageResponse<DocumentFeedResponse> history =
                documentService.getMyViewHistory(currentUserId, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadDocument(@PathVariable UUID id) {
        UUID userId = getRequiredUserId();
        DocumentFileResponse file = documentService.downloadDocument(id, userId);
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + file.getFilename() + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(file.getContent());
    }

    @GetMapping("/{id}/preview")
    public ResponseEntity<ApiResponse<DocumentPreviewResponse>> getDocumentPreview(@PathVariable UUID id) {
        DocumentPreviewResponse preview = documentService.getDocumentPreview(id);
        return ResponseEntity.ok(ApiResponse.success(preview));
    }

    @PostMapping("/{id}/view")
    public ResponseEntity<ApiResponse<Void>> recordView(@PathVariable UUID id) {
        UUID currentUserId = getOptionalUserId();
        documentService.recordView(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Đã ghi nhận lượt xem", null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDocument(@PathVariable UUID id) {
        UUID currentUserId = getRequiredUserId();
        documentService.deleteDocument(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Xóa tài liệu thành công", null));
    }
}
