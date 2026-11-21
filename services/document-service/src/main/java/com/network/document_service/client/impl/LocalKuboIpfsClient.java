package com.network.document_service.client.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.network.document_service.config.IpfsProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@Slf4j
@RequiredArgsConstructor
public class LocalKuboIpfsClient {

    private final IpfsProperties ipfsProperties;
    private ObjectMapper objectMapper = new ObjectMapper();

    private WebClient buildWebClient() {
        ExchangeStrategies strategies = ExchangeStrategies.builder()
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(64 * 1024 * 1024))
                .build();
        return WebClient.builder()
                .baseUrl(ipfsProperties.getLocal().getApiUrl())
                .exchangeStrategies(strategies)
                .build();
    }

    /**
     * Unpin nội dung khỏi Kubo node (best-effort, dùng khi xóa document).
     */
    public void unpin(String cid) {
        if (cid == null || cid.isBlank()) {
            return;
        }
        try {
            WebClient webClient = buildWebClient();
            webClient.post()
                    .uri(uriBuilder -> uriBuilder.path("/pin/rm").queryParam("arg", cid).build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(2))
                    .block();
        } catch (Exception ex) {
            log.warn("Failed to unpin CID {} from local Kubo: {}", cid, ex.getMessage());
        }
    }

    /**
     * Tải nội dung tệp từ IPFS Kubo theo CID dưới dạng Resource.
     */
    public Resource getFileResource(String cid, String filename) {
        if (cid == null || cid.isBlank()) {
            throw new IllegalArgumentException("CID không được để trống");
        }
        try {
            WebClient webClient = buildWebClient();
            byte[] bytes = webClient.post()
                    .uri(uriBuilder -> uriBuilder.path("/cat").queryParam("arg", cid).build())
                    .retrieve()
                    .bodyToMono(byte[].class)
                    .timeout(Duration.ofSeconds(60))
                    .block();

            if (bytes == null || bytes.length == 0) {
                throw new IllegalStateException("Nội dung tệp rỗng từ IPFS Kubo cho CID: " + cid);
            }

            return new org.springframework.core.io.ByteArrayResource(bytes) {
                @Override
                public String getFilename() {
                    return filename;
                }
            };
        } catch (Exception ex) {
            log.warn("Failed to fetch file content from local Kubo for CID {}: {}", cid, ex.getMessage());
            throw new RuntimeException("Lỗi khi tải tệp từ IPFS Kubo: " + ex.getMessage(), ex);
        }
    }

    public String upload(Resource fileResource, String filename) {
        try {
            WebClient webClient = buildWebClient();

            MultipartBodyBuilder builder = new MultipartBodyBuilder();
            builder.part("file", fileResource).filename(filename);

            // Dung pin=false de Kubo ghi blockstore va dong HTTP stream ngay lap tuc (<50ms),
            // tranh bi treo ket noi khi Kubo giu pinset lock hoac cho quang ba DHT.
            String response = webClient.post()
                    .uri(uriBuilder -> uriBuilder.path("/add").queryParam("pin", "false").build())
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(builder.build()))
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(30))
                    .block();

            if (response != null && !response.isBlank()) {
                String firstJsonLine = response.trim().split("\\r?\\n")[0];
                JsonNode jsonNode = objectMapper.readTree(firstJsonLine);
                if (jsonNode.has("Hash")) {
                    String hash = jsonNode.get("Hash").asText();
                    // Pin bat dong bo o hau truong (best-effort) de khong chan luong upload cua nguoi dung
                    webClient.post()
                            .uri(uriBuilder -> uriBuilder.path("/pin/add").queryParam("arg", hash).build())
                            .retrieve()
                            .bodyToMono(String.class)
                            .timeout(Duration.ofSeconds(10))
                            .subscribe(
                                    res -> log.debug("Pinned CID {} asynchronously on local Kubo", hash),
                                    err -> log.debug("Async pin skipped/timed out for CID {}: {}", hash, err.getMessage())
                            );
                    return hash;
                }
            }
            throw new IllegalStateException("Phan hoi tu Local Kubo khong chua Hash IPFS");
        } catch (Exception ex) {
            log.warn("Local Kubo IPFS upload failed: {}", ex.getMessage());
            throw new RuntimeException("Local Kubo IPFS error", ex);
        }
    }

    public com.network.document_service.dto.response.ipfs.KuboHealthDto getKuboHealth() {
        if ("mock".equalsIgnoreCase(ipfsProperties.getMode())) {
            return com.network.document_service.dto.response.ipfs.KuboHealthDto.builder()
                    .online(true)
                    .pingMs(8L)
                    .version("kubo/0.32.0/mock")
                    .peerId("12D3KooWMockPeerIdLocalKubo")
                    .swarmPeersCount(42)
                    .repoSizeBytes(12800000000L)
                    .numObjects(1420L)
                    .rateIn(124.5)
                    .rateOut(345.8)
                    .build();
        }

        long start = System.currentTimeMillis();
        try {
            WebClient webClient = buildWebClient();
            String idJson = webClient.post()
                    .uri("/id")
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(3))
                    .block();

            long pingMs = System.currentTimeMillis() - start;
            String peerId = "";
            String version = "kubo";

            if (idJson != null && !idJson.isBlank()) {
                JsonNode root = objectMapper.readTree(idJson);
                if (root.has("ID")) {
                    peerId = root.get("ID").asText();
                }
                if (root.has("AgentVersion")) {
                    version = root.get("AgentVersion").asText();
                }
            }

            int swarmPeers = 0;
            try {
                String peersJson = webClient.post()
                        .uri("/swarm/peers")
                        .retrieve()
                        .bodyToMono(String.class)
                        .timeout(Duration.ofSeconds(2))
                        .block();
                if (peersJson != null && !peersJson.isBlank()) {
                    JsonNode peersNode = objectMapper.readTree(peersJson);
                    if (peersNode.has("Peers") && peersNode.get("Peers").isArray()) {
                        swarmPeers = peersNode.get("Peers").size();
                    }
                }
            } catch (Exception e) {
                log.debug("Kubo swarm peers check skipped: {}", e.getMessage());
            }

            long repoSize = 0L;
            long numObjects = 0L;
            try {
                String repoJson = webClient.post()
                        .uri("/repo/stat")
                        .retrieve()
                        .bodyToMono(String.class)
                        .timeout(Duration.ofSeconds(2))
                        .block();
                if (repoJson != null && !repoJson.isBlank()) {
                    JsonNode repoNode = objectMapper.readTree(repoJson);
                    if (repoNode.has("RepoSize")) {
                        repoSize = repoNode.get("RepoSize").asLong();
                    }
                    if (repoNode.has("NumObjects")) {
                        numObjects = repoNode.get("NumObjects").asLong();
                    }
                }
            } catch (Exception e) {
                log.debug("Kubo repo stat check skipped: {}", e.getMessage());
            }

            return com.network.document_service.dto.response.ipfs.KuboHealthDto.builder()
                    .online(true)
                    .pingMs(pingMs)
                    .peerId(peerId)
                    .version(version)
                    .swarmPeersCount(swarmPeers)
                    .repoSizeBytes(repoSize)
                    .numObjects(numObjects)
                    .rateIn(0.0)
                    .rateOut(0.0)
                    .build();
        } catch (Exception ex) {
            long pingMs = System.currentTimeMillis() - start;
            log.warn("Kubo IPFS health probe failed: {}", ex.getMessage());
            return com.network.document_service.dto.response.ipfs.KuboHealthDto.builder()
                    .online(false)
                    .pingMs(pingMs)
                    .errorMessage(ex.getMessage())
                    .build();
        }
    }

    public List<com.network.document_service.dto.response.ipfs.IpfsPeerDto> getSwarmPeersDetail() {
        if ("mock".equalsIgnoreCase(ipfsProperties.getMode())) {
            return List.of(
                    com.network.document_service.dto.response.ipfs.IpfsPeerDto.builder()
                            .peerId("12D3KooWTestPeer01Gateway")
                            .address("/ip4/113.190.24.77/tcp/4001")
                            .latency("14 ms")
                            .direction("Inbound")
                            .location("Ha Noi - DC01")
                            .build(),
                    com.network.document_service.dto.response.ipfs.IpfsPeerDto.builder()
                            .peerId("12D3KooWTestPeer02Worker")
                            .address("/ip4/113.190.24.55/tcp/4001")
                            .latency("22 ms")
                            .direction("Inbound")
                            .location("Da Nang - DC03")
                            .build(),
                    com.network.document_service.dto.response.ipfs.IpfsPeerDto.builder()
                            .peerId("12D3KooWTestPeer03Worker")
                            .address("/ip4/113.190.24.88/tcp/4001")
                            .latency("31 ms")
                            .direction("Outbound")
                            .location("TP. Ho Chi Minh - DC02")
                            .build(),
                    com.network.document_service.dto.response.ipfs.IpfsPeerDto.builder()
                            .peerId("12D3KooWTestPeer04Bootstrap")
                            .address("/ip4/103.253.14.2/tcp/4001")
                            .latency("28 ms")
                            .direction("Outbound")
                            .location("Singapore Edge DC")
                            .build()
            );
        }

        List<com.network.document_service.dto.response.ipfs.IpfsPeerDto> result = new ArrayList<>();
        try {
            WebClient webClient = buildWebClient();
            String peersJson = webClient.post()
                    .uri("/swarm/peers")
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(3))
                    .block();

            if (peersJson != null && !peersJson.isBlank()) {
                JsonNode peersNode = objectMapper.readTree(peersJson);
                if (peersNode.has("Peers") && peersNode.get("Peers").isArray()) {
                    for (JsonNode peerItem : peersNode.get("Peers")) {
                        String peer = peerItem.has("Peer") ? peerItem.get("Peer").asText() : "";
                        String addr = peerItem.has("Addr") ? peerItem.get("Addr").asText() : "";
                        String latency = peerItem.has("Latency") ? peerItem.get("Latency").asText() : "---";
                        int dir = peerItem.has("Direction") ? peerItem.get("Direction").asInt() : 0;
                        String directionStr = dir == 1 ? "Inbound" : dir == 2 ? "Outbound" : "P2P";

                        result.add(com.network.document_service.dto.response.ipfs.IpfsPeerDto.builder()
                                .peerId(peer)
                                .address(addr)
                                .latency(latency)
                                .direction(directionStr)
                                .location("P2P Swarm Peer")
                                .build());

                        if (result.size() >= 20) {
                            break;
                        }
                    }
                }
            }
        } catch (Exception ex) {
            log.debug("Could not fetch detailed swarm peers from Kubo: {}", ex.getMessage());
        }
        return result;
    }

    public Map<String, Object> runGarbageCollection() {
        if ("mock".equalsIgnoreCase(ipfsProperties.getMode())) {
            Map<String, Object> mockRes = new HashMap<>();
            mockRes.put("success", true);
            mockRes.put("clearedBlocks", 142L);
            mockRes.put("freedBytes", 52428800L);
            mockRes.put("message", "Don dep bo nho Kubo thanh cong (Mock Mode)");
            return mockRes;
        }

        Map<String, Object> result = new HashMap<>();
        try {
            WebClient webClient = buildWebClient();
            String gcOutput = webClient.post()
                    .uri("/repo/gc")
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(15))
                    .block();

            long clearedBlocks = 0L;
            if (gcOutput != null && !gcOutput.isBlank()) {
                String[] lines = gcOutput.split("\\r?\\n");
                for (String line : lines) {
                    if (line.contains("Key")) {
                        clearedBlocks++;
                    }
                }
            }
            long freedBytes = clearedBlocks * 256 * 1024L;

            result.put("success", true);
            result.put("clearedBlocks", clearedBlocks);
            result.put("freedBytes", freedBytes);
            result.put("message", "Don dep bo nho Kubo thanh cong, da giai phong " + clearedBlocks + " khoi du lieu");
            return result;
        } catch (Exception ex) {
            log.warn("Kubo repo gc failed: {}", ex.getMessage());
            result.put("success", false);
            result.put("clearedBlocks", 0L);
            result.put("freedBytes", 0L);
            result.put("message", "Khong the don dep repo Kubo: " + ex.getMessage());
            return result;
        }
    }
}
