package com.network.document_service.controller;

import com.network.document_service.config.SecurityContextHolder;
import com.network.document_service.dto.request.CreateCommentRequest;
import com.network.document_service.dto.request.ReportDocumentRequest;
import com.network.document_service.dto.response.CommentResponse;
import com.network.document_service.dto.response.PageResponse;
import com.network.document_service.service.SocialInteractionService;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SocialController.class)
class SocialControllerTest {

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
    void toggleLike_unauthenticated_shouldReturn401() throws Exception {
        UUID docId = UUID.randomUUID();
        mockMvc.perform(post("/api/documents/" + docId + "/likes"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void toggleLike_authenticated_shouldReturn200() throws Exception {
        UUID docId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        when(socialInteractionService.toggleLike(eq(docId), eq(userId))).thenReturn(true);

        mockMvc.perform(post("/api/documents/" + docId + "/likes")
                        .header("X-User-Id", userId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.liked").value(true));
    }

    @Test
    void addComment_authenticated_shouldReturn201() throws Exception {
        UUID docId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        CreateCommentRequest req = CreateCommentRequest.builder().content("Bình luận hay").pageNumber(1).build();
        CommentResponse resp = CommentResponse.builder().id(UUID.randomUUID()).content("Bình luận hay").build();

        when(socialInteractionService.addComment(eq(docId), eq(userId), any())).thenReturn(resp);

        mockMvc.perform(post("/api/documents/" + docId + "/comments")
                        .header("X-User-Id", userId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.content").value("Bình luận hay"));
    }

    @Test
    void getComments_shouldReturn200() throws Exception {
        UUID docId = UUID.randomUUID();
        PageResponse<CommentResponse> pageResp = PageResponse.<CommentResponse>builder()
                .content(List.of(CommentResponse.builder().id(UUID.randomUUID()).content("C1").build()))
                .build();

        when(socialInteractionService.getComments(eq(docId), any())).thenReturn(pageResp);

        mockMvc.perform(get("/api/documents/" + docId + "/comments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].content").value("C1"));
    }

    @Test
    void toggleBookmark_shouldReturn200() throws Exception {
        UUID docId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        when(socialInteractionService.toggleBookmark(eq(docId), eq(userId), any())).thenReturn(true);

        mockMvc.perform(post("/api/documents/" + docId + "/bookmarks")
                        .header("X-User-Id", userId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.bookmarked").value(true));
    }

    @Test
    void unlockDocument_shouldReturn200() throws Exception {
        UUID docId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        when(socialInteractionService.unlockDocument(eq(docId), eq(userId), any())).thenReturn(true);

        mockMvc.perform(post("/api/documents/" + docId + "/unlock")
                        .header("X-User-Id", userId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unlocked").value(true));
    }

    @Test
    void reportDocument_shouldReturn200() throws Exception {
        UUID docId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        ReportDocumentRequest req = ReportDocumentRequest.builder().reason("Spam").description("Desc").build();

        mockMvc.perform(post("/api/documents/" + docId + "/reports")
                        .header("X-User-Id", userId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
