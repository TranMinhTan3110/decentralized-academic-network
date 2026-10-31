package com.network.user_service.security;

import com.network.user_service.dto.response.GoogleTokenPayload;
import com.network.user_service.exception.InvalidCredentialsException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withBadRequest;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class GoogleTokenVerifierTest {

    private MockRestServiceServer mockServer;
    private GoogleTokenVerifierImpl verifier;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        mockServer = MockRestServiceServer.bindTo(builder).build();
        verifier = new GoogleTokenVerifierImpl(builder);
    }

    @Test
    @DisplayName("Xác minh idToken thành công khi Google trả về payload hợp lệ")
    void verify_Success() {
        String mockResponse = """
            {
                "sub": "123456789",
                "email": "scholar@dedocu.vn",
                "email_verified": "true",
                "name": "Scholar User",
                "picture": "https://avatar.url/img.png",
                "aud": "mock-app-client-id"
            }
        """;

        mockServer.expect(requestTo("https://oauth2.googleapis.com/tokeninfo?id_token=valid-token"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(mockResponse, MediaType.APPLICATION_JSON));

        GoogleTokenPayload payload = verifier.verify("valid-token");

        assertNotNull(payload);
        assertEquals("scholar@dedocu.vn", payload.getEmail());
        assertEquals("Scholar User", payload.getName());
        assertEquals("123456789", payload.getSub());
        mockServer.verify();
    }

    @Test
    @DisplayName("Xác minh idToken thất bại khi Google trả về lỗi 400 Bad Request")
    void verify_InvalidToken_ThrowsException() {
        mockServer.expect(requestTo("https://oauth2.googleapis.com/tokeninfo?id_token=invalid-token"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withBadRequest());

        assertThrows(InvalidCredentialsException.class, () -> verifier.verify("invalid-token"));
        mockServer.verify();
    }

    @Test
    @DisplayName("Xác minh idToken thất bại khi aud không khớp với googleClientId")
    void verify_AudMismatch_ThrowsException() {
        ReflectionTestUtils.setField(verifier, "googleClientId", "my-configured-client-id");

        String mockResponse = """
            {
                "sub": "123456789",
                "email": "scholar@dedocu.vn",
                "name": "Scholar User",
                "aud": "different-client-id"
            }
        """;

        mockServer.expect(requestTo("https://oauth2.googleapis.com/tokeninfo?id_token=token-with-wrong-aud"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(mockResponse, MediaType.APPLICATION_JSON));

        InvalidCredentialsException ex = assertThrows(InvalidCredentialsException.class,
                () -> verifier.verify("token-with-wrong-aud"));
        assertTrue(ex.getMessage().contains("không thuộc về ứng dụng"));
        mockServer.verify();
    }
}
