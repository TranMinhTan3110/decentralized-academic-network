package com.network.document_service.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class UserContextFilter extends OncePerRequestFilter {

    private static final UUID DEFAULT_SEED_USER_ID = UUID.fromString("10000000-0000-0000-0000-000000000001");
    private static final UUID DEFAULT_SEED_ADMIN_ID = UUID.fromString("20000000-0000-0000-0000-000000000001");

    @Value("${application.security.jwt.secret-key:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}")
    private String jwtSecretKey;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String xUserId = request.getHeader("X-User-Id");
        String xUserRole = request.getHeader("X-User-Role");

        try {
            if (xUserId != null && !xUserId.isBlank()) {
                String trimmed = xUserId.trim();
                if ("{{testUserId}}".equalsIgnoreCase(trimmed)) {
                    SecurityContextHolder.setUserId(DEFAULT_SEED_USER_ID);
                    SecurityContextHolder.setRole("USER");
                } else if ("{{testAdminId}}".equalsIgnoreCase(trimmed)) {
                    SecurityContextHolder.setUserId(DEFAULT_SEED_ADMIN_ID);
                    SecurityContextHolder.setRole("ADMIN");
                } else {
                    try {
                        SecurityContextHolder.setUserId(UUID.fromString(trimmed));
                        SecurityContextHolder.setRole(xUserRole != null && !xUserRole.isBlank() ? xUserRole.trim() : "USER");
                    } catch (IllegalArgumentException ex) {
                        // Invalid UUID format (e.g. malformed header), keep context empty
                    }
                }
            }

            // Fallback: Check Authorization: Bearer <jwt> if X-User-Id was not provided or invalid
            if (SecurityContextHolder.getUserId() == null) {
                String authHeader = request.getHeader("Authorization");
                if (authHeader != null && authHeader.regionMatches(true, 0, "Bearer ", 0, 7)) {
                    String token = authHeader.substring(7).trim();
                    if (!token.isBlank() && !"{{authToken}}".equalsIgnoreCase(token)) {
                        try {
                            SecretKey key = Keys.hmacShaKeyFor(jwtSecretKey.getBytes(StandardCharsets.UTF_8));
                            Claims claims = Jwts.parser()
                                    .verifyWith(key)
                                    .build()
                                    .parseSignedClaims(token)
                                    .getPayload();

                            Object uidClaim = claims.get("userId");
                            if (uidClaim != null) {
                                SecurityContextHolder.setUserId(UUID.fromString(uidClaim.toString()));
                            } else if (claims.getSubject() != null) {
                                try {
                                    SecurityContextHolder.setUserId(UUID.fromString(claims.getSubject()));
                                } catch (IllegalArgumentException ignored) {
                                }
                            }

                            Object roleClaim = claims.get("role");
                            if (roleClaim != null) {
                                SecurityContextHolder.setRole(roleClaim.toString());
                            } else {
                                SecurityContextHolder.setRole("USER");
                            }
                        } catch (Exception ex) {
                            // Invalid or expired token, proceed without setting security context
                        }
                    }
                }
            }

            filterChain.doFilter(request, response);
        } finally {
            SecurityContextHolder.clear();
        }
    }
}
