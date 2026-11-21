package com.network.document_service.controller;

import com.network.document_service.config.SecurityContextHolder;
import com.network.document_service.dto.response.ApiResponse;
import com.network.document_service.dto.response.PageResponse;
import com.network.document_service.dto.response.ipfs.DesyncedDocumentDto;
import com.network.document_service.dto.response.ipfs.IpfsClusterOverviewResponse;
import com.network.document_service.dto.response.ipfs.IpfsDiagnosticResult;
import com.network.document_service.dto.response.ipfs.IpfsPeerDto;
import com.network.document_service.dto.response.ipfs.IpfsTopologyResponse;
import com.network.document_service.exception.ForbiddenException;
import com.network.document_service.exception.UnauthorizedException;
import com.network.document_service.service.IpfsMonitoringService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping({"/api/admin/ipfs", "/api/v1/admin/ipfs"})
@RequiredArgsConstructor
public class AdminIpfsController {

    private final IpfsMonitoringService ipfsMonitoringService;

    private void requireAdmin() {
        UUID userId = SecurityContextHolder.getUserId();
        if (userId == null) {
            throw new UnauthorizedException("Vui long dang nhap voi quyen quan tri vien");
        }
        String role = SecurityContextHolder.getRole();
        if (!"ADMIN".equalsIgnoreCase(role)) {
            throw new ForbiddenException("Ban khong co quyen quan tri de thuc hien hanh dong nay");
        }
    }

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<IpfsClusterOverviewResponse>> getOverview() {
        requireAdmin();
        IpfsClusterOverviewResponse overview = ipfsMonitoringService.getOverview();
        return ResponseEntity.ok(ApiResponse.success(overview));
    }

    @GetMapping("/topology")
    public ResponseEntity<ApiResponse<IpfsTopologyResponse>> getTopology() {
        requireAdmin();
        IpfsTopologyResponse topology = ipfsMonitoringService.getTopology();
        return ResponseEntity.ok(ApiResponse.success(topology));
    }

    @PostMapping("/diagnose")
    public ResponseEntity<ApiResponse<IpfsDiagnosticResult>> runDiagnostics() {
        requireAdmin();
        IpfsDiagnosticResult result = ipfsMonitoringService.runDiagnostics();
        return ResponseEntity.ok(ApiResponse.success("Ket qua chuan doan ha tang IPFS", result));
    }

    @GetMapping("/desynced")
    public ResponseEntity<ApiResponse<PageResponse<DesyncedDocumentDto>>> getDesyncedDocuments(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        requireAdmin();
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        Page<DesyncedDocumentDto> docs = ipfsMonitoringService.getDesyncedDocuments(pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(docs)));
    }

    @PostMapping("/sync/{id}")
    public ResponseEntity<ApiResponse<Void>> syncDocument(@PathVariable("id") UUID id) {
        requireAdmin();
        ipfsMonitoringService.syncDocumentToPinata(id);
        return ResponseEntity.ok(ApiResponse.success("Dong bo tai lieu sang Pinata thanh cong", null));
    }

    @PostMapping("/sync-all")
    public ResponseEntity<ApiResponse<Map<String, Object>>> syncAllDesynced() {
        requireAdmin();
        Map<String, Object> summary = ipfsMonitoringService.syncAllDesyncedToPinata();
        return ResponseEntity.ok(ApiResponse.success("Da kich hoat dong bo hang loat sang Pinata", summary));
    }

    @GetMapping("/mode")
    public ResponseEntity<ApiResponse<Map<String, String>>> getMode() {
        requireAdmin();
        String mode = ipfsMonitoringService.getIpfsMode();
        return ResponseEntity.ok(ApiResponse.success(Map.of("mode", mode)));
    }

    @PutMapping("/mode")
    public ResponseEntity<ApiResponse<Map<String, String>>> updateMode(@RequestBody Map<String, String> request) {
        requireAdmin();
        String mode = request != null ? request.get("mode") : null;
        String updated = ipfsMonitoringService.updateIpfsMode(mode);
        return ResponseEntity.ok(ApiResponse.success("Da cap nhat che do luu tru IPFS", Map.of("mode", updated)));
    }

    @GetMapping("/peers")
    public ResponseEntity<ApiResponse<List<IpfsPeerDto>>> getPeers() {
        requireAdmin();
        List<IpfsPeerDto> peers = ipfsMonitoringService.getConnectedPeers();
        return ResponseEntity.ok(ApiResponse.success(peers));
    }

    @PostMapping("/gc")
    public ResponseEntity<ApiResponse<Map<String, Object>>> runGarbageCollection() {
        requireAdmin();
        Map<String, Object> result = ipfsMonitoringService.runGarbageCollection();
        return ResponseEntity.ok(ApiResponse.success("Ket qua don dep bo nho Kubo IPFS", result));
    }
}
