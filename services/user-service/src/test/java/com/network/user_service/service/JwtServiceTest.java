package com.network.user_service.service;

import com.network.user_service.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;
    private User testUser;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        // Set test secret key and expiration
        ReflectionTestUtils.setField(jwtService, "secretKey", "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970");
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 3600000L); // 1 hour

        testUser = User.builder()
                .id(UUID.randomUUID())
                .email("test@dedocu.vn")
                .username("testuser")
                .role("USER")
                .build();
    }

    @Test
    @DisplayName("Sinh JWT token hợp lệ và trích xuất đúng username")
    void generateToken_AndExtractUsername() {
        String token = jwtService.generateToken(testUser);

        assertNotNull(token);
        assertFalse(token.isBlank());

        String extractedUsername = jwtService.extractUsername(token);
        assertEquals("testuser", extractedUsername);
    }

    @Test
    @DisplayName("Token hợp lệ khi kiểm tra với đúng User")
    void isTokenValid_ShouldReturnTrue_ForMatchingUser() {
        String token = jwtService.generateToken(testUser);

        boolean isValid = jwtService.isTokenValid(token, testUser);
        assertTrue(isValid);
    }

    @Test
    @DisplayName("Token không hợp lệ khi kiểm tra với User khác")
    void isTokenValid_ShouldReturnFalse_ForDifferentUser() {
        String token = jwtService.generateToken(testUser);

        User anotherUser = User.builder()
                .id(UUID.randomUUID())
                .username("different_user")
                .build();

        boolean isValid = jwtService.isTokenValid(token, anotherUser);
        assertFalse(isValid);
    }

    @Test
    @DisplayName("Trả về thời gian hết hạn tính bằng giây chính xác")
    void getExpirationInSeconds_ShouldReturnCorrectSeconds() {
        long seconds = jwtService.getExpirationInSeconds();
        assertEquals(3600L, seconds);
    }

    @Test
    @DisplayName("Trích xuất đúng email và role từ token")
    void extractEmailAndRole_ShouldReturnCorrectClaims() {
        String token = jwtService.generateToken(testUser);

        String email = jwtService.extractEmail(token);
        String role = jwtService.extractRole(token);

        assertEquals("test@dedocu.vn", email);
        assertEquals("USER", role);
        assertTrue(jwtService.isTokenValid(token));
    }

    @Test
    @DisplayName("isTokenValid trả về false khi token hỏng")
    void isTokenValid_ShouldReturnFalse_WhenTokenMalformed() {
        boolean isValid = jwtService.isTokenValid("malformed.jwt.token");
        assertFalse(isValid);
    }
}
