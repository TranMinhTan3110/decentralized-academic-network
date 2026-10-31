package com.network.document_service.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.network.document_service.config.SecurityContextHolder;
import com.network.document_service.dto.request.DocumentUpdateRequest;
import com.network.document_service.dto.response.*;
import com.network.document_service.service.DocumentService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DocumentController.class)
class DocumentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

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
    void uploadDocument_withUploadRouteAlias_shouldReturn201() throws Exception {
        UUID userId = UUID.randomUUID();
        MockMultipartFile file = new MockMultipartFile("file", "doc.pdf", "application/pdf", "%PDF-1.4 test".getBytes());
        DocumentDetailResponse resp = DocumentDetailResponse.builder()
                .id(UUID.randomUUID())
                .title("Test Title Upload Alias")
                .ipfsCid("QmTestUploadAlias")
                .build();

        when(documentService.uploadDocument(eq(userId), any())).thenReturn(resp);

        mockMvc.perform(multipart("/api/v1/documents/upload")
                        .file(file)
                        .param("title", "Test Title Upload Alias")
                        .header("X-User-Id", userId.toString()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Test Title Upload Alias"));
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

        when(documentService.getDocumentsFeed(any(), any(), any(), any(), any(), any(), any())).thenReturn(feed);

        mockMvc.perform(get("/api/documents"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].title").value("Feed Item"));
    }

    @Test
    void searchDocuments_withKeyword_shouldReturnMatchingFeed() throws Exception {
        PageResponse<DocumentFeedResponse> feed = PageResponse.<DocumentFeedResponse>builder()
                .content(List.of(DocumentFeedResponse.builder().id(UUID.randomUUID()).title("Kinh te vi mo").build()))
                .build();

        when(documentService.searchDocuments(eq("kinh te vi mo"), any(), any()))
                .thenReturn(feed);

        mockMvc.perform(get("/api/v1/documents/search")
                        .param("q", "kinh te vi mo"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].title").value("Kinh te vi mo"));
    }

    @Test
    void getTrendingDocuments_shouldReturnTopScoredList() throws Exception {
        List<DocumentFeedResponse> trending = List.of(
                DocumentFeedResponse.builder().id(UUID.randomUUID()).title("Trending Doc 1").build()
        );

        when(documentService.getTrendingDocuments(anyInt(), any()))
                .thenReturn(trending);

        mockMvc.perform(get("/api/v1/documents/trending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].title").value("Trending Doc 1"));
    }

    @Test
    void updateDocument_asAuthor_shouldReturnUpdatedDetail() throws Exception {
        UUID docId = UUID.randomUUID();
        UUID authorId = UUID.randomUUID();

        DocumentUpdateRequest req = new DocumentUpdateRequest();
        req.setTitle("Tiêu đề đã sửa");
        req.setDescription("Mô tả mới");

        when(documentService.updateDocument(eq(docId), eq(authorId), any()))
                .thenReturn(DocumentDetailResponse.builder().id(docId).title("Tiêu đề đã sửa").build());

        mockMvc.perform(put("/api/v1/documents/" + docId)
                        .header("X-User-Id", authorId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Tiêu đề đã sửa"));
    }

    @Test
    void getDocumentPreview_shouldReturnThreePagesSafeData() throws Exception {
        UUID docId = UUID.randomUUID();
        DocumentPreviewResponse preview = DocumentPreviewResponse.builder()
                .documentId(docId)
                .title("Giao trinh")
                .freePages(3)
                .totalPages(45)
                .isBlurLocked(true)
                .thumbnailUrl("http://cdn/thumb.png")
                .previewPages(List.of("http://cdn/p1.webp", "http://cdn/p2.webp", "http://cdn/p3.webp"))
                .build();

        when(documentService.getDocumentPreview(eq(docId))).thenReturn(preview);

        mockMvc.perform(get("/api/v1/documents/" + docId + "/preview"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.freePages").value(3))
                .andExpect(jsonPath("$.data.previewPages.length()").value(3));
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
