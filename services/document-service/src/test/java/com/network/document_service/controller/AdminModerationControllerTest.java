package com.network.document_service.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.network.document_service.config.SecurityContextHolder;
import com.network.document_service.dto.request.ModerateDocumentRequest;
import com.network.document_service.service.SocialInteractionService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminModerationController.class)
class AdminModerationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SocialInteractionService socialInteractionService;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clear();
    }

    @Test
    void getReports_whenUserRole_shouldReturn403() throws Exception {
        SecurityContextHolder.setContext(UUID.randomUUID(), "USER");
        mockMvc.perform(get("/api/v1/admin/reports"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getReports_whenAdminRole_shouldReturnList() throws Exception {
        SecurityContextHolder.setContext(UUID.randomUUID(), "ADMIN");
        when(socialInteractionService.getAdminReports()).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/admin/reports"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    void moderateDocument_whenAdminRole_shouldUpdateStatus() throws Exception {
        SecurityContextHolder.setContext(UUID.randomUUID(), "ADMIN");
        UUID docId = UUID.randomUUID();
        ModerateDocumentRequest req = new ModerateDocumentRequest("REJECTED", "Vi phạm bản quyền");

        mockMvc.perform(put("/api/v1/admin/documents/" + docId + "/moderate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        verify(socialInteractionService).moderateDocument(docId, "REJECTED", "Vi phạm bản quyền");
    }
}
