package com.network.document_service.controller;

import com.network.document_service.config.SecurityContextHolder;
import com.network.document_service.dto.request.ModerateDocumentRequest;
import com.network.document_service.dto.response.AdminDocumentResponse;
import com.network.document_service.dto.response.AdminReportResponse;
import com.network.document_service.dto.response.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import com.network.document_service.dto.response.ApiResponse;
import com.network.document_service.entity.DocumentReport;
import com.network.document_service.exception.ForbiddenException;
import com.network.document_service.exception.UnauthorizedException;
import com.network.document_service.service.DocumentService;
import com.network.document_service.service.SocialInteractionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping({"/api/admin", "/api/v1/admin"})
public class AdminModerationController {

    private final SocialInteractionService socialInteractionService;
    private final DocumentService documentService;

    public AdminModerationController(SocialInteractionService socialInteractionService,
                                     DocumentService documentService) {
        this.socialInteractionService = socialInteractionService;
        this.documentService = documentService;
    }

    private void requireAdmin() {
        UUID userId = SecurityContextHolder.getUserId();
        if (userId == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập với quyền quản trị viên");
        }
        String role = SecurityContextHolder.getRole();
        if (!"ADMIN".equalsIgnoreCase(role)) {
            throw new ForbiddenException("Bạn không có quyền quản trị để thực hiện hành động này");
        }
    }

    @GetMapping("/reports")
    public ResponseEntity<ApiResponse<List<AdminReportResponse>>> getAdminReports() {
        requireAdmin();
        List<AdminReportResponse> reports = socialInteractionService.getAdminReports();
        return ResponseEntity.ok(ApiResponse.success(reports));
    }

    @GetMapping("/documents")
    public ResponseEntity<ApiResponse<PageResponse<AdminDocumentResponse>>> getAdminDocuments(
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size) {
        requireAdmin();
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100));
        PageResponse<AdminDocumentResponse> response = documentService.getAdminDocuments(search, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }


    @PostMapping("/documents/backfill-thumbnails")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> backfillThumbnails(
            @RequestParam(name = "limit", defaultValue = "20") int limit) {
        requireAdmin();
        Map<String, Integer> summary = documentService.backfillThumbnails(Math.min(limit, 100));
        return ResponseEntity.ok(ApiResponse.success("Đã quét và sinh lại thumbnail", summary));
    }

    @PutMapping("/documents/{id}/moderate")
    public ResponseEntity<ApiResponse<Void>> moderateDocument(
            @PathVariable("id") UUID id,
            @Valid @RequestBody ModerateDocumentRequest request) {
        requireAdmin();
        socialInteractionService.moderateDocument(id, request.getStatus(), request.getReason());
        return ResponseEntity.ok(ApiResponse.success("Kiểm duyệt tài liệu thành công", null));
    }
}
