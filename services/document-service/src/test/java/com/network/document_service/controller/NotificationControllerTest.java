package com.network.document_service.controller;

import com.network.document_service.config.SecurityContextHolder;
import com.network.document_service.entity.Notification;
import com.network.document_service.service.NotificationService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(NotificationController.class)
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private NotificationService notificationService;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clear();
    }

    @Test
    void getMyNotifications_unauthenticated_shouldReturn401() throws Exception {
        mockMvc.perform(get("/api/notifications"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getMyNotifications_authenticated_shouldReturn200() throws Exception {
        UUID userId = UUID.randomUUID();
        when(notificationService.getMyNotifications(userId)).thenReturn(List.of(
                Notification.builder().title("Thông báo mới").build()
        ));

        mockMvc.perform(get("/api/notifications")
                        .header("X-User-Id", userId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].title").value("Thông báo mới"));
    }

    @Test
    void getUnreadCount_shouldReturn200() throws Exception {
        UUID userId = UUID.randomUUID();
        when(notificationService.countUnread(userId)).thenReturn(3L);

        mockMvc.perform(get("/api/notifications/unread-count")
                        .header("X-User-Id", userId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount").value(3));
    }

    @Test
    void markAsRead_shouldReturn200() throws Exception {
        UUID notiId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        mockMvc.perform(put("/api/notifications/" + notiId + "/read")
                        .header("X-User-Id", userId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(notificationService).markAsRead(notiId);
    }
}
