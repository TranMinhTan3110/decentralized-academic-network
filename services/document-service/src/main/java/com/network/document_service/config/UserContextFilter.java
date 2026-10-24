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

/**
 * Thiết lập danh tính cho request.
 *
 * Thứ tự ưu tiên:
 * 1. JWT hợp lệ trong Authorization header — nguồn danh tính chính (production).
 * 2. X-User-Id / X-User-Role header — CHỈ được tin khi
 *    application.security.trust-x-user-id=true (chế độ dev không có gateway).
 *
 * Lưu ý vận hành: khi deploy production phải đặt TRUST_X_USER_ID=false và
 * đảm bảo mọi request đi qua api-gateway (filter của gateway sẽ inject
 * header danh tính đã xác minh từ JWT claims).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class UserContextFilter extends OncePerRequestFilter {

    @Value("${application.security.jwt.secret-key:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}")
    private String jwtSecretKey;

    @Value("${application.security.trust-x-user-id:true}")
    private boolean trustXUserId;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        // 1. JWT là nguồn danh tính chính — luôn được ưu tiên nếu hợp lệ
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.regionMatches(true, 0, "Bearer ", 0, 7)) {
            String token = authHeader.substring(7).trim();
            if (!token.isBlank()) {
                applyFromJwt(token);
            }
        }

        // 2. Fallback dev: tin header do client/gateway gửi (tắt khi production)
        if (SecurityContextHolder.getUserId() == null && trustXUserId) {
            applyFromHeaders(request);
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            SecurityContextHolder.clear();
        }
    }

    private void applyFromJwt(String token) {
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
                    // Subject không phải UUID hợp lệ
                }
            }

            Object roleClaim = claims.get("role");
            SecurityContextHolder.setRole(roleClaim != null ? roleClaim.toString() : "USER");
        } catch (Exception ex) {
            // Token không hợp lệ/hết hạn — bỏ qua, request chạy anonymous
        }
    }

    private void applyFromHeaders(HttpServletRequest request) {
        String xUserId = request.getHeader("X-User-Id");
        if (xUserId == null || xUserId.isBlank()) {
            return;
        }
        try {
            SecurityContextHolder.setUserId(UUID.fromString(xUserId.trim()));
            String xUserRole = request.getHeader("X-User-Role");
            SecurityContextHolder.setRole(xUserRole != null && !xUserRole.isBlank() ? xUserRole.trim() : "USER");
        } catch (IllegalArgumentException ex) {
            // UUID không hợp lệ — giữ context rỗng (anonymous)
        }
    }
}
