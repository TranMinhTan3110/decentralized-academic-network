package com.network.document_service.controller;

import com.network.document_service.config.SecurityContextHolder;
import com.network.document_service.dto.response.DocumentDetailResponse;
import com.network.document_service.dto.response.DocumentFeedResponse;
import com.network.document_service.dto.response.PageResponse;
import com.network.document_service.service.DocumentService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DocumentController.class)
class DocumentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DocumentService documentService;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clear();
    }

    @Test
    void uploadDocument_unauthenticated_shouldReturn401() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "doc.pdf", "application/pdf", "%PDF-1.4 test".getBytes());

        mockMvc.perform(multipart("/api/documents")
                        .file(file)
                        .param("title", "Test Title"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void uploadDocument_authenticated_shouldReturn201() throws Exception {
        UUID userId = UUID.randomUUID();
        MockMultipartFile file = new MockMultipartFile("file", "doc.pdf", "application/pdf", "%PDF-1.4 test".getBytes());
        DocumentDetailResponse resp = DocumentDetailResponse.builder()
                .id(UUID.randomUUID())
                .title("Test Title")
                .ipfsCid("QmTest123")
                .build();

        when(documentService.uploadDocument(eq(userId), any())).thenReturn(resp);

        mockMvc.perform(multipart("/api/documents")
                        .file(file)
                        .param("title", "Test Title")
                        .header("X-User-Id", userId.toString()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Test Title"))
                .andExpect(jsonPath("$.data.ipfsCid").value("QmTest123"));
    }

    @Test
    void getDocumentDetail_shouldReturn200() throws Exception {
        UUID docId = UUID.randomUUID();
        DocumentDetailResponse resp = DocumentDetailResponse.builder()
                .id(docId)
                .title("Sample Doc")
                .build();

        when(documentService.getDocumentDetail(eq(docId), any())).thenReturn(resp);

        mockMvc.perform(get("/api/documents/" + docId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Sample Doc"));
    }

    @Test
    void getDocumentsFeed_shouldReturn200() throws Exception {
        PageResponse<DocumentFeedResponse> feed = PageResponse.<DocumentFeedResponse>builder()
                .content(List.of(DocumentFeedResponse.builder().id(UUID.randomUUID()).title("Feed Item").build()))
                .build();

        when(documentService.getDocumentsFeed(any(), any(), any(), any(), any(), any())).thenReturn(feed);

        mockMvc.perform(get("/api/documents"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].title").value("Feed Item"));
    }

    @Test
    void recordView_shouldReturn200() throws Exception {
        UUID docId = UUID.randomUUID();
        mockMvc.perform(post("/api/documents/" + docId + "/view"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void deleteDocument_authenticated_shouldReturn200() throws Exception {
        UUID docId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        mockMvc.perform(delete("/api/documents/" + docId)
                        .header("X-User-Id", userId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(documentService).deleteDocument(docId, userId);
    }
}
