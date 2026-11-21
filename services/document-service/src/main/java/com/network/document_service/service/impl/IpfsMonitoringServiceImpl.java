package com.network.document_service.service.impl;

import com.network.document_service.client.impl.LocalKuboIpfsClient;
import com.network.document_service.client.impl.PinataIpfsClient;
import com.network.document_service.config.IpfsProperties;
import com.network.document_service.dto.response.ipfs.*;
import com.network.document_service.entity.Document;
import com.network.document_service.exception.BadRequestException;
import com.network.document_service.exception.ResourceNotFoundException;
import com.network.document_service.repository.DocumentRepository;
import com.network.document_service.service.IpfsMonitoringService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.core.io.Resource;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class IpfsMonitoringServiceImpl implements IpfsMonitoringService {

    private final LocalKuboIpfsClient localKuboClient;
    private final PinataIpfsClient pinataClient;
    private final DocumentRepository documentRepository;
    private final IpfsProperties ipfsProperties;

    @Override
    @Transactional(readOnly = true)
    public IpfsClusterOverviewResponse getOverview() {
        long totalDocs = documentRepository.count();
        long pinnedBoth = documentRepository.countByIsPinnedLocalTrueAndIsPinnedRemoteTrue();
        long pinnedLocalOnly = documentRepository.countByIsPinnedLocalTrueAndIsPinnedRemoteFalse();
        long pinnedRemoteOnly = documentRepository.countByIsPinnedLocalFalseAndIsPinnedRemoteTrue();
        long failedOrOrphan = documentRepository.countByIsPinnedLocalFalseAndIsPinnedRemoteFalse();

        KuboHealthDto kuboHealth = localKuboClient.getKuboHealth();
        PinataHealthDto pinataHealth = pinataClient.getPinataHealth();

        String overallStatus;
        if (kuboHealth.isOnline() && pinataHealth.isOnline()) {
            overallStatus = "HEALTHY";
        } else if (kuboHealth.isOnline() || pinataHealth.isOnline()) {
            overallStatus = "DEGRADED";
        } else {
            overallStatus = "CRITICAL";
        }

        return IpfsClusterOverviewResponse.builder()
                .status(overallStatus)
                .totalDocuments(totalDocs)
                .pinnedBoth(pinnedBoth)
                .pinnedLocalOnly(pinnedLocalOnly)
                .pinnedRemoteOnly(pinnedRemoteOnly)
                .failedOrOrphan(failedOrOrphan)
                .kubo(kuboHealth)
                .pinata(pinataHealth)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public IpfsTopologyResponse getTopology() {
        KuboHealthDto kuboHealth = localKuboClient.getKuboHealth();
        PinataHealthDto pinataHealth = pinataClient.getPinataHealth();

        long localPinnedCount = kuboHealth.getNumObjects() > 0 ?
                kuboHealth.getNumObjects() : documentRepository.countByIsPinnedLocalTrue();
        long remotePinnedCount = pinataHealth.getTotalPins() > 0 ?
                pinataHealth.getTotalPins() : documentRepository.countByIsPinnedRemoteTrue();

        IpfsTopologyResponse.KuboTopologyNode kuboNode = IpfsTopologyResponse.KuboTopologyNode.builder()
                .status(kuboHealth.isOnline() ? "online" : "offline")
                .pingMs(kuboHealth.getPingMs())
                .version(kuboHealth.getVersion())
                .peerId(kuboHealth.getPeerId())
                .swarmPeersCount(kuboHealth.getSwarmPeersCount())
                .repoSizeBytes(kuboHealth.getRepoSizeBytes())
                .pinnedCount(localPinnedCount)
                .errorMessage(kuboHealth.getErrorMessage())
                .build();

        String pinataStatus;
        if (pinataHealth.isOnline()) {
            pinataStatus = "online";
        } else if (pinataHealth.getErrorMessage() != null &&
                (pinataHealth.getErrorMessage().contains("JWT") || pinataHealth.getErrorMessage().contains("401"))) {
            pinataStatus = "degraded";
        } else {
            pinataStatus = "offline";
        }

        IpfsTopologyResponse.PinataTopologyNode pinataNode = IpfsTopologyResponse.PinataTopologyNode.builder()
                .status(pinataStatus)
                .pingMs(pinataHealth.getPingMs())
                .authenticated(pinataHealth.isAuthenticated())
                .pinnedCount(remotePinnedCount)
                .storageUsedBytes(pinataHealth.getTotalSizeBytes())
                .errorMessage(pinataHealth.getErrorMessage())
                .build();

        IpfsTopologyResponse.GatewayTopologyNode gatewayNode = IpfsTopologyResponse.GatewayTopologyNode.builder()
                .localGatewayStatus(kuboHealth.isOnline() ? "online" : "offline")
                .pinataGatewayStatus(pinataHealth.isOnline() ? "online" : "offline")
                .localGatewayUrl(ipfsProperties.getLocal().getGatewayUrl())
                .pinataGatewayUrl(pinataClient.getResolvedGatewayUrl())
                .build();

        IpfsTopologyResponse.DiagnosticVerdict verdict;
        if (!kuboHealth.isOnline() && !pinataHealth.isOnline()) {
            verdict = IpfsTopologyResponse.DiagnosticVerdict.builder()
                    .level("danger")
                    .failingComponent("BOTH")
                    .title("NGUY CẤP: TOÀN BỘ PROVIDER LƯU TRỮ MẤT KẾT NỐI")
                    .description("Cả Docker Kubo và Pinata Cloud đều không phản hồi. Tiến trình tải lên tài liệu mới sẽ bị chặn hoàn toàn.")
                    .build();
        } else if (!kuboHealth.isOnline()) {
            verdict = IpfsTopologyResponse.DiagnosticVerdict.builder()
                    .level("warning")
                    .failingComponent("DOCKER")
                    .title("SỰ CỐ TẠI DOCKER KUBO CONTAINER")
                    .description("Node Kubo Docker không phản hồi qua cổng 5001. Hệ thống tự động chuyển sang chế độ lưu trữ dự phòng qua Pinata Cloud.")
                    .build();
        } else if (!pinataHealth.isOnline()) {
            verdict = IpfsTopologyResponse.DiagnosticVerdict.builder()
                    .level("warning")
                    .failingComponent("PINATA")
                    .title("SỰ CỐ TẠI PINATA CLOUD BRIDGE")
                    .description("Không thể kết nối Pinata Cloud (lỗi xác thực JWT hoặc chạm trần hạn mức). Hệ thống đang hoạt động ở chế độ Local Kubo.")
                    .build();
        } else {
            verdict = IpfsTopologyResponse.DiagnosticVerdict.builder()
                    .level("success")
                    .failingComponent("NONE")
                    .title("MẠNG LƯỚI HOẠT ĐỘNG TỐI ƯU")
                    .description("Cả Docker Kubo và Pinata Cloud đều trực tuyến. Luồng dữ liệu Hybrid được phân phối ổn định 100%.")
                    .build();
        }

        return IpfsTopologyResponse.builder()
                .backendStatus("online")
                .currentMode(ipfsProperties.getMode())
                .kubo(kuboNode)
                .pinata(pinataNode)
                .gateway(gatewayNode)
                .verdict(verdict)
                .build();
    }

    @Override
    public IpfsDiagnosticResult runDiagnostics() {
        KuboHealthDto kubo = localKuboClient.getKuboHealth();
        PinataHealthDto pinata = pinataClient.getPinataHealth();

        boolean kuboOk = kubo.isOnline();
        boolean pinataOk = pinata.isOnline();

        String bottleneck;
        if (!kuboOk && !pinataOk) {
            bottleneck = "BOTH";
        } else if (!kuboOk) {
            bottleneck = "DOCKER";
        } else if (!pinataOk) {
            bottleneck = "PINATA";
        } else {
            bottleneck = "NONE";
        }

        String summary = String.format("Chẩn đoán hoàn tất: Kubo=%s (ping: %sms), Pinata=%s (ping: %sms), Điểm nghẽn=%s",
                kuboOk ? "ONLINE" : "OFFLINE",
                kubo.getPingMs() != null ? kubo.getPingMs() : -1,
                pinataOk ? "ONLINE" : "OFFLINE",
                pinata.getPingMs() != null ? pinata.getPingMs() : -1,
                bottleneck);

        return IpfsDiagnosticResult.builder()
                .healthy(kuboOk && pinataOk)
                .kuboPingMs(kubo.getPingMs())
                .pinataPingMs(pinata.getPingMs())
                .kuboAvailable(kuboOk)
                .pinataAvailable(pinataOk)
                .localGatewayAvailable(kuboOk)
                .pinataGatewayAvailable(pinataOk)
                .bottleneckComponent(bottleneck)
                .summary(summary)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DesyncedDocumentDto> getDesyncedDocuments(Pageable pageable) {
        Page<Document> docs = documentRepository.findDesyncedDocuments(pageable);
        return docs.map(doc -> DesyncedDocumentDto.builder()
                .id(doc.getId())
                .title(doc.getTitle())
                .ipfsCid(doc.getIpfsCid())
                .previewIpfsCid(doc.getPreviewIpfsCid())
                .isPinnedLocal(doc.getIsPinnedLocal())
                .isPinnedRemote(doc.getIsPinnedRemote())
                .fileSizeBytes(doc.getFileSizeBytes())
                .createdAt(doc.getCreatedAt())
                .build());
    }

    @Override
    @Transactional
    public void syncDocumentToPinata(UUID documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay tai lieu voi ID: " + documentId));

        if (Boolean.TRUE.equals(document.getIsPinnedRemote())) {
            log.info("Document {} already pinned to remote Pinata", documentId);
            return;
        }

        if (ipfsProperties.getMode() == null || "mock".equalsIgnoreCase(ipfsProperties.getMode())) {
            document.setIsPinnedRemote(true);
            documentRepository.save(document);
            log.info("Mock mode: Marked document {} as pinned to remote Pinata", documentId);
            return;
        }

        String ext = document.getFileExtension() != null ? document.getFileExtension() : "pdf";
        String filename = document.getTitle().trim().replaceAll("[^\\p{L}\\p{N}._-]", "_") + "." + ext;
        try {
            Resource fileResource = localKuboClient.getFileResource(document.getIpfsCid(), filename);
            String pinataHash = pinataClient.upload(fileResource, filename);
            log.info("Successfully synced document {} to remote Pinata (CID: {})", documentId, pinataHash);
            document.setIsPinnedRemote(true);
            documentRepository.save(document);
        } catch (Exception ex) {
            log.error("Failed to sync document {} to Pinata: {}", documentId, ex.getMessage());
            throw new RuntimeException("Đồng bộ lên Pinata thất bại: " + ex.getMessage(), ex);
        }
    }

    @Override
    @Transactional
    public Map<String, Object> syncAllDesyncedToPinata() {
        Page<Document> desyncedPage = documentRepository.findDesyncedDocuments(PageRequest.of(0, 50));
        List<Document> desynced = desyncedPage.getContent();

        int syncedCount = 0;
        int failedCount = 0;
        boolean isMock = ipfsProperties.getMode() == null || "mock".equalsIgnoreCase(ipfsProperties.getMode());

        for (Document doc : desynced) {
            if (Boolean.FALSE.equals(doc.getIsPinnedRemote())) {
                try {
                    if (!isMock) {
                        String ext = doc.getFileExtension() != null ? doc.getFileExtension() : "pdf";
                        String filename = doc.getTitle().trim().replaceAll("[^\\p{L}\\p{N}._-]", "_") + "." + ext;
                        Resource fileResource = localKuboClient.getFileResource(doc.getIpfsCid(), filename);
                        pinataClient.upload(fileResource, filename);
                    }
                    doc.setIsPinnedRemote(true);
                    documentRepository.save(doc);
                    syncedCount++;
                } catch (Exception ex) {
                    log.warn("Failed to batch sync document {} to Pinata: {}", doc.getId(), ex.getMessage());
                    failedCount++;
                }
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("scanned", desynced.size());
        result.put("synced", syncedCount);
        result.put("failed", failedCount);
        return result;
    }

    @Override
    public String getIpfsMode() {
        return ipfsProperties.getMode();
    }

    @Override
    public String updateIpfsMode(String mode) {
        if (mode == null || mode.isBlank()) {
            throw new BadRequestException("Mode khong duoc de trong");
        }
        String normalized = mode.trim().toLowerCase();
        if (!List.of("hybrid", "local-only", "pinata-only", "mock").contains(normalized)) {
            throw new BadRequestException("Che do khong hop le: " + mode + ". Cac che do ho tro: hybrid, local-only, pinata-only, mock");
        }
        ipfsProperties.setMode(normalized);
        log.info("IPFS storage mode updated to: {}", normalized);
        return normalized;
    }

    @Override
    public List<IpfsPeerDto> getConnectedPeers() {
        return localKuboClient.getSwarmPeersDetail();
    }

    @Override
    public Map<String, Object> runGarbageCollection() {
        return localKuboClient.runGarbageCollection();
    }
}
