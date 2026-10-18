package com.network.document_service.client;

import com.network.document_service.dto.response.ApiResponse;
import com.network.document_service.dto.response.AuthorSummaryDto;
import com.network.document_service.exception.ServiceUnavailableException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@SuppressWarnings("rawtypes")
class UserServiceClientTest {

    private WebClient webClient;
    private WebClient.RequestHeadersUriSpec requestHeadersUriSpec;
    private WebClient.RequestHeadersSpec requestHeadersSpec;
    private WebClient.RequestBodyUriSpec requestBodyUriSpec;
    private WebClient.RequestBodySpec requestBodySpec;
    private WebClient.ResponseSpec responseSpec;
    private UserServiceClient client;

    @BeforeEach
    void setUp() {
        webClient = mock(WebClient.class);
        requestHeadersUriSpec = mock(WebClient.RequestHeadersUriSpec.class);
        requestHeadersSpec = mock(WebClient.RequestHeadersSpec.class);
        requestBodyUriSpec = mock(WebClient.RequestBodyUriSpec.class);
        requestBodySpec = mock(WebClient.RequestBodySpec.class);
        responseSpec = mock(WebClient.ResponseSpec.class);
        client = new UserServiceClient(webClient);
    }

    @Test
    void getAuthorSummary_withNull_returnsAnonymous() {
        AuthorSummaryDto dto = client.getAuthorSummary(null);
        assertNotNull(dto);
        assertEquals("anonymous", dto.getUsername());
    }

    @Test
    @SuppressWarnings("unchecked")
    void getAuthorSummary_success_returnsDto() {
        UUID uid = UUID.randomUUID();
        AuthorSummaryDto expected = AuthorSummaryDto.builder()
                .id(uid)
                .username("testuser")
                .fullName("Test User")
                .build();
        ApiResponse<AuthorSummaryDto> apiResponse = ApiResponse.success(expected);

        when(webClient.get()).thenReturn(requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri(anyString(), any(Object.class))).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(any(ParameterizedTypeReference.class))).thenReturn(Mono.just(apiResponse));

        AuthorSummaryDto result = client.getAuthorSummary(uid);
        assertNotNull(result);
        assertEquals("testuser", result.getUsername());
    }

    @Test
    @SuppressWarnings("unchecked")
    void getAuthorSummary_nullData_returnsAnonymousFallback() {
        UUID uid = UUID.randomUUID();
        ApiResponse<AuthorSummaryDto> emptyResponse = ApiResponse.success(null);

        when(webClient.get()).thenReturn(requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri(anyString(), any(Object.class))).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(any(ParameterizedTypeReference.class))).thenReturn(Mono.just(emptyResponse));

        AuthorSummaryDto result = client.getAuthorSummary(uid);
        assertNotNull(result);
        assertEquals("anonymous", result.getUsername());
    }

    @Test
    void getAuthorSummary_onException_returnsAnonymousFallback() {
        UUID uid = UUID.randomUUID();
        when(webClient.get()).thenThrow(new RuntimeException("Connection refused"));

        AuthorSummaryDto result = client.getAuthorSummary(uid);
        assertNotNull(result);
        assertEquals("anonymous", result.getUsername());
    }

    @Test
    @SuppressWarnings("unchecked")
    void getAuthorsBatch_success_returnsMap() {
        UUID id1 = UUID.randomUUID();
        AuthorSummaryDto dto1 = AuthorSummaryDto.builder().id(id1).username("user1").build();
        ApiResponse<List<AuthorSummaryDto>> apiResponse = ApiResponse.success(List.of(dto1));

        when(webClient.get()).thenReturn(requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri(any(Function.class))).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(any(ParameterizedTypeReference.class))).thenReturn(Mono.just(apiResponse));

        Map<UUID, AuthorSummaryDto> res = client.getAuthorsBatch(List.of(id1));
        assertEquals(1, res.size());
        assertTrue(res.containsKey(id1));
    }

    @Test
    void getAuthorsBatch_onException_returnsFallbackMap() {
        UUID id1 = UUID.randomUUID();
        when(webClient.get()).thenThrow(new RuntimeException("Timeout"));

        Map<UUID, AuthorSummaryDto> res = client.getAuthorsBatch(List.of(id1));
        assertEquals(1, res.size());
        assertEquals("anonymous", res.get(id1).getUsername());
    }

    @Test
    void getAuthorsBatch_withEmptyList_returnsEmptyMap() {
        Map<UUID, AuthorSummaryDto> res = client.getAuthorsBatch(List.of());
        assertTrue(res.isEmpty());
        assertTrue(client.getAuthorsBatch(null).isEmpty());
    }

    @Test
    @SuppressWarnings("unchecked")
    void deductPoints_success() {
        UUID uid = UUID.randomUUID();
        when(webClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString(), any(Object.class))).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(any())).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(Void.class)).thenReturn(Mono.empty());

        assertDoesNotThrow(() -> client.deductPoints(uid, 10, null));
    }

    @Test
    void deductPoints_onException_throwsServiceUnavailable() {
        UUID uid = UUID.randomUUID();
        when(webClient.post()).thenThrow(new RuntimeException("Timeout"));

        assertThrows(ServiceUnavailableException.class, () -> client.deductPoints(uid, 10, UUID.randomUUID()));
    }
}
