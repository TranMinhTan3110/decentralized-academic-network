package com.network.document_service.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class UserContextFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String xUserId = request.getHeader("X-User-Id");
        String xUserRole = request.getHeader("X-User-Role");

        try {
            if (xUserId != null && !xUserId.isBlank()) {
                SecurityContextHolder.setUserId(UUID.fromString(xUserId.trim()));
                SecurityContextHolder.setRole(xUserRole != null ? xUserRole.trim() : "USER");
            }
            filterChain.doFilter(request, response);
        } finally {
            SecurityContextHolder.clear();
        }
    }
}
