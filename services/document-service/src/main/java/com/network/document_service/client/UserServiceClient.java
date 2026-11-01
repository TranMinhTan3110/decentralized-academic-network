package com.network.document_service.client;

import com.network.document_service.dto.response.ApiResponse;
import com.network.document_service.dto.response.AuthorSummaryDto;
import com.network.document_service.exception.ServiceUnavailableException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class UserServiceClient {

    private static final Logger log = LoggerFactory.getLogger(UserServiceClient.class);

    private final WebClient userServiceWebClient;

    public UserServiceClient(WebClient userServiceWebClient) {
        this.userServiceWebClient = userServiceWebClient;
    }

    @Cacheable(value = "authorCache", key = "#p0", condition = "#p0 != null", unless = "#result == null || #result.id == null")
    public AuthorSummaryDto getAuthorSummary(UUID userId) {
        if (userId == null) {
            return AuthorSummaryDto.anonymous();
        }
        try {
            ApiResponse<AuthorSummaryDto> response = userServiceWebClient.get()
                    .uri("/api/v1/users/{id}/summary", userId)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<ApiResponse<AuthorSummaryDto>>() {})
                    .timeout(Duration.ofSeconds(3))
                    .block();

            if (response != null && response.getData() != null) {
                return response.getData();
            }
        } catch (Exception ex) {
            log.warn("Failed to fetch author summary for userId: {}, using anonymous fallback. Reason: {}", userId, ex.getMessage());
        }
        return AuthorSummaryDto.anonymous();
    }

    public Map<UUID, AuthorSummaryDto> getAuthorsBatch(List<UUID> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<UUID> distinctIds = userIds.stream().filter(Objects::nonNull).distinct().collect(Collectors.toList());
        try {
            String idsParam = distinctIds.stream().map(UUID::toString).collect(Collectors.joining(","));
            ApiResponse<List<AuthorSummaryDto>> response = userServiceWebClient.get()
                    .uri(uriBuilder -> uriBuilder.path("/api/v1/users/batch").queryParam("ids", idsParam).build())
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<ApiResponse<List<AuthorSummaryDto>>>() {})
                    .timeout(Duration.ofSeconds(4))
                    .block();

            if (response != null && response.getData() != null) {
                return response.getData().stream()
                        .filter(a -> a.getId() != null)
                        .collect(Collectors.toMap(AuthorSummaryDto::getId, a -> a, (k1, k2) -> k1));
            }
        } catch (Exception ex) {
            log.warn("Failed to batch fetch author summaries, falling back. Reason: {}", ex.getMessage());
        }

        Map<UUID, AuthorSummaryDto> fallbackMap = new HashMap<>();
        for (UUID uid : distinctIds) {
            fallbackMap.put(uid, AuthorSummaryDto.anonymous());
        }
        return fallbackMap;
    }

    public List<UUID> getFollowingIds(UUID userId) {
        if (userId == null) {
            return Collections.emptyList();
        }
        try {
            ApiResponse<List<UUID>> response = userServiceWebClient.get()
                    .uri("/api/v1/users/{id}/following-ids", userId)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<ApiResponse<List<UUID>>>() {})
                    .timeout(Duration.ofSeconds(3))
                    .block();

            if (response != null && response.getData() != null) {
                return response.getData().stream().filter(Objects::nonNull).distinct().collect(Collectors.toList());
            }
        } catch (Exception ex) {
            log.warn("Failed to fetch followingIds for userId: {}. Reason: {}", userId, ex.getMessage());
        }
        return Collections.emptyList();
    }

    public int getBalance(UUID userId) {
        if (userId == null) {
            return 0;
        }
        try {
            ApiResponse<Map<String, Integer>> response = userServiceWebClient.get()
                    .uri("/api/v1/users/{id}/balance", userId)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<ApiResponse<Map<String, Integer>>>() {})
                    .timeout(Duration.ofSeconds(3))
                    .block();

            if (response != null && response.getData() != null && response.getData().get("balance") != null) {
                return response.getData().get("balance");
            }
        } catch (Exception ex) {
            log.warn("Failed to fetch balance for userId: {}. Reason: {}", userId, ex.getMessage());
        }
        return 0;
    }

    public void deductPoints(UUID userId, int points, UUID idempotencyKey) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("userId", userId);
            body.put("points", points);
            body.put("idempotencyKey", idempotencyKey != null ? idempotencyKey.toString() : UUID.randomUUID().toString());

            userServiceWebClient.post()
                    .uri("/api/v1/users/{id}/deduct-points", userId)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Void.class)
                    .timeout(Duration.ofSeconds(5))
                    .block();
        } catch (Exception ex) {
            log.error("Failed to deduct points for userId: {}. Transaction aborted. Reason: {}", userId, ex.getMessage());
            throw new ServiceUnavailableException("Không thể hoàn tất giao dịch điểm: user-service không khả dụng hoặc lỗi kết nối");
        }
    }
}
