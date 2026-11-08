package com.network.document_service.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.network.document_service.config.SecurityContextHolder;
import com.network.document_service.dto.request.ModerateDocumentRequest;
import com.network.document_service.service.DocumentService;
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

import static org.mockito.ArgumentMatchers.any;
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

    @MockBean
    private DocumentService documentService;

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

    @Test
    void moderateDocument_whenPublished_shouldPassStatus() throws Exception {
        SecurityContextHolder.setContext(UUID.randomUUID(), "ADMIN");
        UUID docId = UUID.randomUUID();
        ModerateDocumentRequest req = new ModerateDocumentRequest("PUBLISHED", "Bác bỏ tố cáo sai sự thật");

        mockMvc.perform(put("/api/v1/admin/documents/" + docId + "/moderate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        verify(socialInteractionService).moderateDocument(docId, "PUBLISHED", "Bác bỏ tố cáo sai sự thật");
    }

    @Test
    void moderateDocument_whenUserRole_shouldReturn403() throws Exception {
        SecurityContextHolder.setContext(UUID.randomUUID(), "USER");
        UUID docId = UUID.randomUUID();
        ModerateDocumentRequest req = new ModerateDocumentRequest("REJECTED", "Vi phạm");

        mockMvc.perform(put("/api/v1/admin/documents/" + docId + "/moderate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    void getAdminDocuments_whenAdminRole_shouldReturnPagedResponse() throws Exception {
        SecurityContextHolder.setContext(UUID.randomUUID(), "ADMIN");
        when(documentService.getAdminDocuments(any(), any(), any()))
                .thenReturn(com.network.document_service.dto.response.PageResponse.<com.network.document_service.dto.response.AdminDocumentResponse>builder()
                        .content(List.of())
                        .pageNumber(0)
                        .pageSize(10)
                        .totalElements(0)
                        .totalPages(0)
                        .last(true)
                        .build());

        mockMvc.perform(get("/api/v1/admin/documents")
                        .param("page", "0")
                        .param("size", "10")
                        .param("search", "Toán"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isArray());
    }

    @Test
    void getAdminDocuments_whenUserRole_shouldReturn403() throws Exception {
        SecurityContextHolder.setContext(UUID.randomUUID(), "USER");

        mockMvc.perform(get("/api/v1/admin/documents"))
                .andExpect(status().isForbidden());
    }

    @Test
    void deleteDocumentByAdmin_whenAdminRole_shouldReturnOk() throws Exception {
        SecurityContextHolder.setContext(UUID.randomUUID(), "ADMIN");
        UUID docId = UUID.randomUUID();

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/v1/admin/documents/" + docId))
                .andExpect(status().isOk());

        verify(documentService).deleteDocumentByAdmin(docId);
    }

    @Test
    void deleteDocumentByAdmin_whenUserRole_shouldReturn403() throws Exception {
        SecurityContextHolder.setContext(UUID.randomUUID(), "USER");
        UUID docId = UUID.randomUUID();

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/v1/admin/documents/" + docId))
                .andExpect(status().isForbidden());
    }

    @Test
    void getAdminStats_whenAdminRole_shouldReturnStats() throws Exception {
        SecurityContextHolder.setContext(UUID.randomUUID(), "ADMIN");
        when(documentService.getAdminStats()).thenReturn(
                com.network.document_service.dto.response.AdminDocumentStatsResponse.builder()
                        .totalDocuments(100)
                        .pendingReports(5)
                        .totalInteractions(500)
                        .rejectedDocuments(2)
                        .build()
        );

        mockMvc.perform(get("/api/v1/admin/documents/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalDocuments").value(100))
                .andExpect(jsonPath("$.data.pendingReports").value(5))
                .andExpect(jsonPath("$.data.totalInteractions").value(500))
                .andExpect(jsonPath("$.data.rejectedDocuments").value(2));
    }

    @Test
    void getAdminStats_whenUserRole_shouldReturn403() throws Exception {
        SecurityContextHolder.setContext(UUID.randomUUID(), "USER");

        mockMvc.perform(get("/api/v1/admin/documents/stats"))
                .andExpect(status().isForbidden());
    }
}
