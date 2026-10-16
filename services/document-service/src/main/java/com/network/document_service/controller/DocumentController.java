package com.network.document_service.controller;

import com.network.document_service.config.SecurityContextHolder;
import com.network.document_service.dto.request.DocumentUploadRequest;
import com.network.document_service.dto.response.ApiResponse;
import com.network.document_service.dto.response.DocumentDetailResponse;
import com.network.document_service.dto.response.DocumentFeedResponse;
import com.network.document_service.dto.response.PageResponse;
import com.network.document_service.exception.UnauthorizedException;
import com.network.document_service.service.DocumentService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
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

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
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
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        UUID currentUserId = getOptionalUserId();
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<DocumentFeedResponse> feed = documentService.getDocumentsFeed(
                filter, universityId, courseId, academicYear, currentUserId, pageable
        );
        return ResponseEntity.ok(ApiResponse.success(feed));
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
