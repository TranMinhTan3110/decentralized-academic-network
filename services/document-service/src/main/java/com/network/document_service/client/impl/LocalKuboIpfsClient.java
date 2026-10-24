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
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;

@Component
@Slf4j
@RequiredArgsConstructor
public class LocalKuboIpfsClient {

    private final IpfsProperties ipfsProperties;
    private ObjectMapper objectMapper = new ObjectMapper();

    public String upload(Resource fileResource, String filename) {
        try {
            WebClient webClient = WebClient.builder()
                    .baseUrl(ipfsProperties.getLocal().getApiUrl())
                    .build();

            MultipartBodyBuilder builder = new MultipartBodyBuilder();
            builder.part("file", fileResource).filename(filename);

            String response = webClient.post()
                    .uri("/add")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(builder.build()))
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(15))
                    .block();

            if (response != null && !response.isBlank()) {
                JsonNode jsonNode = objectMapper.readTree(response);
                if (jsonNode.has("Hash")) {
                    return jsonNode.get("Hash").asText();
                }
            }
            throw new IllegalStateException("Phản hồi từ Local Kubo không chứa Hash IPFS");
        } catch (Exception ex) {
            log.warn("Local Kubo IPFS upload failed: {}", ex.getMessage());
            throw new RuntimeException("Local Kubo IPFS error", ex);
        }
    }
}
