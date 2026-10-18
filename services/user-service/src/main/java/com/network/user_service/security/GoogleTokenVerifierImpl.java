package com.network.user_service.security;

import com.network.user_service.dto.response.GoogleTokenPayload;
import com.network.user_service.exception.InvalidCredentialsException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class GoogleTokenVerifierImpl implements GoogleTokenVerifier {

    private final RestClient restClient;

    @Value("${google.client-id:}")
    private String googleClientId;

    public GoogleTokenVerifierImpl(RestClient.Builder restClientBuilder) {
        this.restClient = restClientBuilder.baseUrl("https://oauth2.googleapis.com").build();
    }

    @Override
    public GoogleTokenPayload verify(String idToken) {
        try {
            GoogleTokenPayload payload = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/tokeninfo")
                            .queryParam("id_token", idToken)
                            .build())
                    .retrieve()
                    .body(GoogleTokenPayload.class);

            if (payload == null || payload.getEmail() == null) {
                throw new InvalidCredentialsException("Mã xác thực Google không hợp lệ hoặc đã hết hạn");
            }

            if (googleClientId != null && !googleClientId.isBlank() && !"mock-google-client-id".equals(googleClientId)) {
                if (!googleClientId.equals(payload.getAud())) {
                    throw new InvalidCredentialsException("Mã xác thực Google không thuộc về ứng dụng này");
                }
            }

            return payload;
        } catch (InvalidCredentialsException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new InvalidCredentialsException("Xác minh tài khoản Google thất bại: " + ex.getMessage());
        }
    }
}
