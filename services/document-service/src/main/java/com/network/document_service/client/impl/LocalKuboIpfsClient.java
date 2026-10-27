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
                    .timeout(Duration.ofSeconds(5))
                    .block();
        } catch (Exception ex) {
            log.warn("Failed to unpin CID {} from local Kubo: {}", cid, ex.getMessage());
        }
    }

    public String upload(Resource fileResource, String filename) {
        try {
            WebClient webClient = buildWebClient();

            MultipartBodyBuilder builder = new MultipartBodyBuilder();
            builder.part("file", fileResource).filename(filename);

            // Dùng pin=false để Kubo ghi blockstore và đóng HTTP stream ngay lập tức (<50ms),
            // tránh bị treo kết nối khi Kubo giữ pinset lock hoặc chờ quảng bá DHT.
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
                    // Pin bất đồng bộ ở hậu trường (best-effort) để không chặn luồng upload của người dùng
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
            throw new IllegalStateException("Phản hồi từ Local Kubo không chứa Hash IPFS");
        } catch (Exception ex) {
            log.warn("Local Kubo IPFS upload failed: {}", ex.getMessage());
            throw new RuntimeException("Local Kubo IPFS error", ex);
        }
    }
}
