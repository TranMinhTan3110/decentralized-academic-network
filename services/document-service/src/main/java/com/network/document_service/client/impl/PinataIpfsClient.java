package com.network.document_service.client.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.network.document_service.config.IpfsProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;

@Component
@Slf4j
@RequiredArgsConstructor
public class PinataIpfsClient {

    private final IpfsProperties ipfsProperties;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String upload(Resource fileResource, String filename) {
        try {
            String jwt = ipfsProperties.getPinata().getJwt();
            if (jwt == null || jwt.isBlank()) {
                throw new IllegalStateException("Pinata JWT chưa được cấu hình");
            }

            WebClient webClient = WebClient.builder()
                    .baseUrl(ipfsProperties.getPinata().getApiUrl())
                    .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + jwt)
                    .build();

            MultipartBodyBuilder builder = new MultipartBodyBuilder();
            builder.part("file", fileResource).filename(filename);

            String response = webClient.post()
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(builder.build()))
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(20))
                    .block();

            if (response != null && !response.isBlank()) {
                JsonNode jsonNode = objectMapper.readTree(response);
                if (jsonNode.has("IpfsHash")) {
                    return jsonNode.get("IpfsHash").asText();
                }
            }
            throw new IllegalStateException("Phản hồi từ Pinata không chứa IpfsHash");
        } catch (Exception ex) {
            log.warn("Pinata Cloud IPFS upload failed: {}", ex.getMessage());
            throw new RuntimeException("Pinata Cloud IPFS error", ex);
        }
    }
}
