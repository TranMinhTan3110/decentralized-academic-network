package com.network.user_service.security;

import com.network.user_service.dto.response.GoogleTokenPayload;

public interface GoogleTokenVerifier {
    GoogleTokenPayload verify(String idToken);
}
