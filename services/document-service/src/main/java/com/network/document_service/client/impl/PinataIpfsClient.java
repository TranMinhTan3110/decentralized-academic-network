package com.network.document_service.client.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.network.document_service.config.IpfsProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.File;
import java.nio.file.Files;
import java.time.Duration;
import java.util.List;

@Component
@Slf4j
public class PinataIpfsClient {

    private final IpfsProperties ipfsProperties;
    private final ObjectMapper objectMapper;
    private String resolvedGatewayDomain = null;

    public PinataIpfsClient(IpfsProperties ipfsProperties) {
        this.ipfsProperties = ipfsProperties;
        this.objectMapper = new ObjectMapper();
    }

    public String upload(Resource fileResource, String filename) {
        try {
            String jwt = getResolvedJwt();
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

    public com.network.document_service.dto.response.ipfs.PinataHealthDto getPinataHealth() {
        if ("mock".equalsIgnoreCase(ipfsProperties.getMode())) {
            return com.network.document_service.dto.response.ipfs.PinataHealthDto.builder()
                    .online(true)
                    .pingMs(42L)
                    .authenticated(true)
                    .totalPins(142L)
                    .totalSizeBytes(12800000000L)
                    .build();
        }

        String jwt = getResolvedJwt();
        if (jwt == null || jwt.isBlank()) {
            return com.network.document_service.dto.response.ipfs.PinataHealthDto.builder()
                    .online(false)
                    .pingMs(null)
                    .authenticated(false)
                    .errorMessage("Pinata JWT token is not configured")
                    .build();
        }

        long start = System.currentTimeMillis();
        try {
            WebClient authClient = WebClient.builder()
                    .baseUrl("https://api.pinata.cloud")
                    .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + jwt)
                    .build();

            String authResp = authClient.get()
                    .uri("/data/testAuthentication")
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(5))
                    .block();

            long pingMs = System.currentTimeMillis() - start;
            boolean authenticated = authResp != null && authResp.contains("Congratulations");

            long totalPins = 0L;
            long totalSize = 0L;
            try {
                String totalResp = authClient.get()
                        .uri("/data/userPinnedDataTotal")
                        .retrieve()
                        .bodyToMono(String.class)
                        .timeout(Duration.ofSeconds(3))
                        .block();
                if (totalResp != null && !totalResp.isBlank()) {
                    JsonNode totalNode = objectMapper.readTree(totalResp);
                    if (totalNode.has("total_pins")) {
                        totalPins = totalNode.get("total_pins").asLong();
                    }
                    if (totalNode.has("total_size_bytes")) {
                        totalSize = totalNode.get("total_size_bytes").asLong();
                    }
                }
            } catch (Exception e) {
                log.debug("Pinata user pinned data total check skipped: {}", e.getMessage());
            }

            try {
                String gatewayResp = authClient.get()
                        .uri("/v3/ipfs/gateways")
                        .retrieve()
                        .bodyToMono(String.class)
                        .timeout(Duration.ofSeconds(3))
                        .block();
                if (gatewayResp != null && !gatewayResp.isBlank()) {
                    JsonNode gwNode = objectMapper.readTree(gatewayResp);
                    if (gwNode.has("data") && gwNode.get("data").has("rows")) {
                        JsonNode rows = gwNode.get("data").get("rows");
                        if (rows.isArray() && rows.size() > 0) {
                            String domain = rows.get(0).path("domain").asText("");
                            if (!domain.isBlank()) {
                                this.resolvedGatewayDomain = domain;
                                ipfsProperties.getPinata().setGatewayUrl("https://" + domain + ".mypinata.cloud/ipfs/");
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.debug("Pinata gateway discovery skipped: {}", e.getMessage());
            }

            return com.network.document_service.dto.response.ipfs.PinataHealthDto.builder()
                    .online(authenticated)
                    .pingMs(pingMs)
                    .authenticated(authenticated)
                    .totalPins(totalPins)
                    .totalSizeBytes(totalSize)
                    .build();
        } catch (Exception ex) {
            long pingMs = System.currentTimeMillis() - start;
            log.warn("Pinata Cloud health probe failed: {}", ex.getMessage());
            return com.network.document_service.dto.response.ipfs.PinataHealthDto.builder()
                    .online(false)
                    .pingMs(pingMs)
                    .authenticated(false)
                    .errorMessage(ex.getMessage())
                    .build();
        }
    }

    public String getResolvedGatewayUrl() {
        String configured = ipfsProperties.getPinata().getGatewayUrl();
        if (configured != null && !configured.isBlank() && !configured.contains("gateway.pinata.cloud")) {
            return configured.endsWith("/") ? configured : configured + "/";
        }
        String envGateway = System.getenv("PINATA_GATEWAY_URL");
        if (envGateway != null && !envGateway.isBlank()) {
            return envGateway.endsWith("/") ? envGateway.trim() : envGateway.trim() + "/";
        }
        String dotenvGateway = readEnvVarFromDotenv("PINATA_GATEWAY_URL");
        if (dotenvGateway != null && !dotenvGateway.isBlank()) {
            return dotenvGateway.endsWith("/") ? dotenvGateway.trim() : dotenvGateway.trim() + "/";
        }
        if (resolvedGatewayDomain != null && !resolvedGatewayDomain.isBlank()) {
            return "https://" + resolvedGatewayDomain + ".mypinata.cloud/ipfs/";
        }
        return "https://harlequin-working-cheetah-340.mypinata.cloud/ipfs/";
    }

    private String getResolvedJwt() {
        String jwt = ipfsProperties.getPinata().getJwt();
        if (jwt != null && !jwt.isBlank()) {
            return jwt.trim();
        }
        String envJwt = System.getenv("PINATA_JWT");
        if (envJwt != null && !envJwt.isBlank()) {
            return envJwt.trim();
        }
        String sysPropJwt = System.getProperty("PINATA_JWT");
        if (sysPropJwt != null && !sysPropJwt.isBlank()) {
            return sysPropJwt.trim();
        }
        return readEnvVarFromDotenv("PINATA_JWT");
    }

    private String readEnvVarFromDotenv(String key) {
        String prefix = key + "=";
        String[] candidatePaths = {
            ".env",
            "services/document-service/.env",
            "../services/document-service/.env",
            "../../services/document-service/.env"
        };
        for (String pathStr : candidatePaths) {
            File file = new File(pathStr);
            if (file.exists() && file.isFile()) {
                try {
                    List<String> lines = Files.readAllLines(file.toPath());
                    for (String line : lines) {
                        String trimmed = line.trim();
                        if (trimmed.startsWith(prefix)) {
                            String value = trimmed.substring(prefix.length()).trim();
                            if ((value.startsWith("\"") && value.endsWith("\""))
                                    || (value.startsWith("'") && value.endsWith("'"))) {
                                if (value.length() >= 2) {
                                    value = value.substring(1, value.length() - 1);
                                }
                            }
                            if (!value.isBlank()) {
                                return value;
                            }
                        }
                    }
                } catch (Exception ignored) {
                }
            }
        }
        return null;
    }
}
