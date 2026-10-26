package com.network.document_service.controller;

import com.network.document_service.config.SecurityContextHolder;
import com.network.document_service.dto.request.ModerateDocumentRequest;
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
    public ResponseEntity<ApiResponse<List<DocumentReport>>> getAdminReports() {
        requireAdmin();
        List<DocumentReport> reports = socialInteractionService.getAdminReports();
        return ResponseEntity.ok(ApiResponse.success(reports));
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
