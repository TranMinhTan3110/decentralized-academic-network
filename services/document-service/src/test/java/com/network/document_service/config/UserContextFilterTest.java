package com.network.document_service.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UserContextFilterTest {

    private final UserContextFilter filter = new UserContextFilter();

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clear();
    }

    @Test
    void doFilterInternal_withXUserIdHeader_shouldSetUserIdInContext() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        UUID userId = UUID.randomUUID();
        request.addHeader("X-User-Id", userId.toString());
        request.addHeader("X-User-Role", "USER");

        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain filterChain = mock(FilterChain.class);

        doAnswer(invocation -> {
            assertEquals(userId, SecurityContextHolder.getUserId());
            assertEquals("USER", SecurityContextHolder.getRole());
            return null;
        }).when(filterChain).doFilter(request, response);

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        // After request processing completes, thread-local must be cleared to prevent leaks
        assertNull(SecurityContextHolder.getUserId());
        assertNull(SecurityContextHolder.getRole());
    }

    @Test
    void doFilterInternal_withoutHeader_shouldKeepContextNull() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain filterChain = mock(FilterChain.class);

        filter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getUserId());
        assertNull(SecurityContextHolder.getRole());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void testSecurityContextHolderDirectMethods() {
        UUID uid = UUID.randomUUID();
        SecurityContextHolder.setUserId(uid);
        SecurityContextHolder.setRole("ADMIN");
        assertEquals(uid, SecurityContextHolder.getUserId());
        assertEquals("ADMIN", SecurityContextHolder.getRole());
        SecurityContextHolder.clear();
        assertNull(SecurityContextHolder.getUserId());
        assertNull(SecurityContextHolder.getRole());
    }
}
