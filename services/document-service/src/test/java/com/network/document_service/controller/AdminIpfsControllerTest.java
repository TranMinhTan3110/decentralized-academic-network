package com.network.document_service.controller;

import com.network.document_service.config.SecurityContextHolder;
import com.network.document_service.dto.response.ipfs.*;
import com.network.document_service.service.IpfsMonitoringService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminIpfsController.class)
class AdminIpfsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private IpfsMonitoringService ipfsMonitoringService;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clear();
    }

    @Test
    void getOverview_whenNotAdmin_returns401Or403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/ipfs/overview"))
                .andExpect(status().isUnauthorized());

        SecurityContextHolder.setContext(UUID.randomUUID(), "USER");
        mockMvc.perform(get("/api/v1/admin/ipfs/overview"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getOverview_whenAdmin_returns200() throws Exception {
        SecurityContextHolder.setContext(UUID.randomUUID(), "ADMIN");
        IpfsClusterOverviewResponse overview = IpfsClusterOverviewResponse.builder()
                .status("HEALTHY")
                .totalDocuments(100L)
                .pinnedBoth(90L)
                .pinnedLocalOnly(5L)
                .pinnedRemoteOnly(5L)
                .failedOrOrphan(0L)
                .build();

        when(ipfsMonitoringService.getOverview()).thenReturn(overview);

        mockMvc.perform(get("/api/v1/admin/ipfs/overview"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("HEALTHY"))
                .andExpect(jsonPath("$.data.totalDocuments").value(100));
    }

    @Test
    void getTopology_whenAdmin_returnsTopologyData() throws Exception {
        SecurityContextHolder.setContext(UUID.randomUUID(), "ADMIN");
        IpfsTopologyResponse topology = IpfsTopologyResponse.builder()
                .backendStatus("online")
                .kubo(IpfsTopologyResponse.KuboTopologyNode.builder()
                        .status("online")
                        .pingMs(12L)
                        .version("kubo/0.32.0")
                        .swarmPeersCount(42)
                        .pinnedCount(120L)
                        .build())
                .pinata(IpfsTopologyResponse.PinataTopologyNode.builder()
                        .status("online")
                        .pingMs(45L)
                        .authenticated(true)
                        .pinnedCount(120L)
                        .build())
                .gateway(IpfsTopologyResponse.GatewayTopologyNode.builder()
                        .localGatewayStatus("online")
                        .pinataGatewayStatus("online")
                        .build())
                .verdict(IpfsTopologyResponse.DiagnosticVerdict.builder()
                        .level("success")
                        .failingComponent("NONE")
                        .title("MANG LUOI HOAT DONG TOI UU")
                        .description("He thong on dinh")
                        .build())
                .build();

        when(ipfsMonitoringService.getTopology()).thenReturn(topology);

        mockMvc.perform(get("/api/v1/admin/ipfs/topology"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.kubo.status").value("online"))
                .andExpect(jsonPath("$.data.pinata.status").value("online"))
                .andExpect(jsonPath("$.data.verdict.failingComponent").value("NONE"));
    }

    @Test
    void runDiagnostics_whenAdmin_returnsDiagnosticResult() throws Exception {
        SecurityContextHolder.setContext(UUID.randomUUID(), "ADMIN");
        IpfsDiagnosticResult result = IpfsDiagnosticResult.builder()
                .healthy(true)
                .kuboPingMs(10L)
                .pinataPingMs(50L)
                .kuboAvailable(true)
                .pinataAvailable(true)
                .bottleneckComponent("NONE")
                .summary("All systems operational")
                .build();

        when(ipfsMonitoringService.runDiagnostics()).thenReturn(result);

        mockMvc.perform(post("/api/v1/admin/ipfs/diagnose"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.bottleneckComponent").value("NONE"))
                .andExpect(jsonPath("$.data.healthy").value(true));
    }

    @Test
    void getDesyncedDocuments_whenAdmin_returnsPagedList() throws Exception {
        SecurityContextHolder.setContext(UUID.randomUUID(), "ADMIN");
        DesyncedDocumentDto docDto = DesyncedDocumentDto.builder()
                .id(UUID.randomUUID())
                .title("Test Doc")
                .ipfsCid("QmTest123")
                .isPinnedLocal(true)
                .isPinnedRemote(false)
                .fileSizeBytes(2048L)
                .createdAt(OffsetDateTime.now())
                .build();

        when(ipfsMonitoringService.getDesyncedDocuments(any()))
                .thenReturn(new PageImpl<>(List.of(docDto)));

        mockMvc.perform(get("/api/v1/admin/ipfs/desynced?page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].title").value("Test Doc"))
                .andExpect(jsonPath("$.data.content[0].isPinnedLocal").value(true));
    }

    @Test
    void syncDocument_whenAdmin_triggersSync() throws Exception {
        SecurityContextHolder.setContext(UUID.randomUUID(), "ADMIN");
        UUID docId = UUID.randomUUID();

        mockMvc.perform(post("/api/v1/admin/ipfs/sync/" + docId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void syncAllDesynced_whenAdmin_returnsSummary() throws Exception {
        SecurityContextHolder.setContext(UUID.randomUUID(), "ADMIN");
        when(ipfsMonitoringService.syncAllDesyncedToPinata())
                .thenReturn(Map.of("scanned", 5, "synced", 5));

        mockMvc.perform(post("/api/v1/admin/ipfs/sync-all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.scanned").value(5))
                .andExpect(jsonPath("$.data.synced").value(5));
    }

    @Test
    void getMode_whenAdmin_returnsCurrentMode() throws Exception {
        SecurityContextHolder.setContext(UUID.randomUUID(), "ADMIN");
        when(ipfsMonitoringService.getIpfsMode()).thenReturn("hybrid");

        mockMvc.perform(get("/api/v1/admin/ipfs/mode"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.mode").value("hybrid"));
    }

    @Test
    void updateMode_whenAdmin_updatesAndReturnsNewMode() throws Exception {
        SecurityContextHolder.setContext(UUID.randomUUID(), "ADMIN");
        when(ipfsMonitoringService.updateIpfsMode("local-only")).thenReturn("local-only");

        mockMvc.perform(put("/api/v1/admin/ipfs/mode")
                        .contentType("application/json")
                        .content("{\"mode\":\"local-only\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.mode").value("local-only"));
    }

    @Test
    void getPeers_whenAdmin_returnsPeersList() throws Exception {
        SecurityContextHolder.setContext(UUID.randomUUID(), "ADMIN");
        com.network.document_service.dto.response.ipfs.IpfsPeerDto peer = com.network.document_service.dto.response.ipfs.IpfsPeerDto.builder()
                .peerId("12D3KooWPeer1")
                .address("/ip4/127.0.0.1/tcp/4001")
                .latency("15 ms")
                .direction("Inbound")
                .location("Localhost")
                .build();
        when(ipfsMonitoringService.getConnectedPeers()).thenReturn(List.of(peer));

        mockMvc.perform(get("/api/v1/admin/ipfs/peers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].peerId").value("12D3KooWPeer1"))
                .andExpect(jsonPath("$.data[0].latency").value("15 ms"));
    }

    @Test
    void runGarbageCollection_whenAdmin_triggersGc() throws Exception {
        SecurityContextHolder.setContext(UUID.randomUUID(), "ADMIN");
        when(ipfsMonitoringService.runGarbageCollection())
                .thenReturn(Map.of("success", true, "clearedBlocks", 142L));

        mockMvc.perform(post("/api/v1/admin/ipfs/gc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.clearedBlocks").value(142));
    }
}
