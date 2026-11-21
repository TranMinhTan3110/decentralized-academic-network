package com.network.document_service.service;

import com.network.document_service.client.impl.LocalKuboIpfsClient;
import com.network.document_service.client.impl.PinataIpfsClient;
import com.network.document_service.config.IpfsProperties;
import com.network.document_service.dto.response.ipfs.*;
import com.network.document_service.entity.Document;
import com.network.document_service.repository.DocumentRepository;
import com.network.document_service.service.impl.IpfsMonitoringServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IpfsMonitoringServiceImplTest {

    @Mock
    private LocalKuboIpfsClient localKuboClient;

    @Mock
    private PinataIpfsClient pinataClient;

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private IpfsProperties ipfsProperties;

    @InjectMocks
    private IpfsMonitoringServiceImpl ipfsMonitoringService;

    @BeforeEach
    void setUp() {
        IpfsProperties.Local local = new IpfsProperties.Local();
        local.setGatewayUrl("http://localhost:8080/ipfs/");
        IpfsProperties.Pinata pinata = new IpfsProperties.Pinata();
        pinata.setGatewayUrl("https://gateway.pinata.cloud/ipfs/");

        lenient().when(ipfsProperties.getLocal()).thenReturn(local);
        lenient().when(ipfsProperties.getPinata()).thenReturn(pinata);
    }

    @Test
    void getOverview_whenBothOnline_returnsHealthy() {
        when(documentRepository.count()).thenReturn(50L);
        when(documentRepository.countByIsPinnedLocalTrueAndIsPinnedRemoteTrue()).thenReturn(45L);
        when(documentRepository.countByIsPinnedLocalTrueAndIsPinnedRemoteFalse()).thenReturn(3L);
        when(documentRepository.countByIsPinnedLocalFalseAndIsPinnedRemoteTrue()).thenReturn(2L);
        when(documentRepository.countByIsPinnedLocalFalseAndIsPinnedRemoteFalse()).thenReturn(0L);

        when(localKuboClient.getKuboHealth()).thenReturn(KuboHealthDto.builder().online(true).pingMs(10L).build());
        when(pinataClient.getPinataHealth()).thenReturn(PinataHealthDto.builder().online(true).pingMs(40L).build());

        IpfsClusterOverviewResponse overview = ipfsMonitoringService.getOverview();

        assertEquals("HEALTHY", overview.getStatus());
        assertEquals(50L, overview.getTotalDocuments());
        assertEquals(45L, overview.getPinnedBoth());
    }

    @Test
    void getTopology_whenDockerOffline_detectsDockerBottleneck() {
        when(localKuboClient.getKuboHealth()).thenReturn(KuboHealthDto.builder()
                .online(false)
                .errorMessage("Connection refused :5001")
                .build());
        when(pinataClient.getPinataHealth()).thenReturn(PinataHealthDto.builder()
                .online(true)
                .authenticated(true)
                .pingMs(45L)
                .totalPins(120L)
                .build());

        IpfsTopologyResponse topology = ipfsMonitoringService.getTopology();

        assertEquals("offline", topology.getKubo().getStatus());
        assertEquals("online", topology.getPinata().getStatus());
        assertEquals("DOCKER", topology.getVerdict().getFailingComponent());
        assertEquals("warning", topology.getVerdict().getLevel());
    }

    @Test
    void getTopology_whenPinataOffline_detectsPinataBottleneck() {
        when(localKuboClient.getKuboHealth()).thenReturn(KuboHealthDto.builder()
                .online(true)
                .pingMs(8L)
                .numObjects(120L)
                .build());
        when(pinataClient.getPinataHealth()).thenReturn(PinataHealthDto.builder()
                .online(false)
                .authenticated(false)
                .errorMessage("401 Unauthorized JWT expired")
                .build());

        IpfsTopologyResponse topology = ipfsMonitoringService.getTopology();

        assertEquals("online", topology.getKubo().getStatus());
        assertEquals("degraded", topology.getPinata().getStatus());
        assertEquals("PINATA", topology.getVerdict().getFailingComponent());
    }

    @Test
    void getTopology_whenBothOffline_detectsBothBottleneck() {
        when(localKuboClient.getKuboHealth()).thenReturn(KuboHealthDto.builder().online(false).build());
        when(pinataClient.getPinataHealth()).thenReturn(PinataHealthDto.builder().online(false).build());

        IpfsTopologyResponse topology = ipfsMonitoringService.getTopology();

        assertEquals("BOTH", topology.getVerdict().getFailingComponent());
        assertEquals("danger", topology.getVerdict().getLevel());
    }

    @Test
    void runDiagnostics_returnsHealthAssessment() {
        when(localKuboClient.getKuboHealth()).thenReturn(KuboHealthDto.builder().online(true).pingMs(12L).build());
        when(pinataClient.getPinataHealth()).thenReturn(PinataHealthDto.builder().online(true).pingMs(44L).build());

        IpfsDiagnosticResult result = ipfsMonitoringService.runDiagnostics();

        assertTrue(result.isHealthy());
        assertEquals("NONE", result.getBottleneckComponent());
    }

    @Test
    void syncDocumentToPinata_whenNotYetPinnedRemote_marksAsPinned() {
        UUID docId = UUID.randomUUID();
        Document doc = Document.builder()
                .id(docId)
                .title("Draft PDF")
                .ipfsCid("QmTest123")
                .isPinnedLocal(true)
                .isPinnedRemote(false)
                .build();

        when(documentRepository.findById(docId)).thenReturn(Optional.of(doc));

        ipfsMonitoringService.syncDocumentToPinata(docId);

        assertTrue(doc.getIsPinnedRemote());
        verify(documentRepository).save(doc);
    }

    @Test
    void getIpfsMode_returnsCurrentMode() {
        when(ipfsProperties.getMode()).thenReturn("hybrid");
        assertEquals("hybrid", ipfsMonitoringService.getIpfsMode());
    }

    @Test
    void updateIpfsMode_whenValid_updatesMode() {
        String updated = ipfsMonitoringService.updateIpfsMode("pinata-only");
        assertEquals("pinata-only", updated);
        verify(ipfsProperties).setMode("pinata-only");
    }

    @Test
    void updateIpfsMode_whenInvalid_throwsBadRequest() {
        assertThrows(com.network.document_service.exception.BadRequestException.class, () -> {
            ipfsMonitoringService.updateIpfsMode("invalid-mode");
        });
    }

    @Test
    void getConnectedPeers_delegatesToLocalKuboClient() {
        IpfsPeerDto peer = IpfsPeerDto.builder().peerId("12D3KooWPeer1").build();
        when(localKuboClient.getSwarmPeersDetail()).thenReturn(List.of(peer));

        List<IpfsPeerDto> peers = ipfsMonitoringService.getConnectedPeers();

        assertEquals(1, peers.size());
        assertEquals("12D3KooWPeer1", peers.get(0).getPeerId());
    }

    @Test
    void runGarbageCollection_delegatesToLocalKuboClient() {
        when(localKuboClient.runGarbageCollection()).thenReturn(Map.of("success", true, "clearedBlocks", 142L));

        Map<String, Object> result = ipfsMonitoringService.runGarbageCollection();

        assertTrue((Boolean) result.get("success"));
        assertEquals(142L, result.get("clearedBlocks"));
        verify(localKuboClient).runGarbageCollection();
    }
}
