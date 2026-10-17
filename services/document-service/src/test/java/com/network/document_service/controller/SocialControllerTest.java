package com.network.document_service.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.network.document_service.config.SecurityContextHolder;
import com.network.document_service.dto.request.CreateCommentRequest;
import com.network.document_service.dto.request.ReportDocumentRequest;
import com.network.document_service.dto.response.*;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
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

        mockMvc.perform(post("/api/v1/documents/" + docId + "/like")
                        .header("X-User-Id", userId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.liked").value(true));
    }

    @Test
    void getDocumentLikes_shouldReturnListOfUsers() throws Exception {
        UUID docId = UUID.randomUUID();
        when(socialInteractionService.getUsersWhoLiked(eq(docId)))
                .thenReturn(List.of(AuthorSummaryDto.builder().id(UUID.randomUUID()).fullName("Hoang Minh").build()));

        mockMvc.perform(get("/api/v1/documents/" + docId + "/likes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].fullName").value("Hoang Minh"));
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
    void deleteComment_whenOwner_shouldReturnSuccess() throws Exception {
        UUID commentId = UUID.randomUUID();
        UUID currentUserId = UUID.randomUUID();
        SecurityContextHolder.setContext(currentUserId, "USER");

        mockMvc.perform(delete("/api/v1/documents/comments/" + commentId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Xóa bình luận thành công"));

        verify(socialInteractionService).deleteComment(commentId, currentUserId);
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
    void removeBookmark_shouldReturnSuccess() throws Exception {
        UUID docId = UUID.randomUUID();
        UUID currentUserId = UUID.randomUUID();
        SecurityContextHolder.setContext(currentUserId, "USER");

        mockMvc.perform(delete("/api/v1/documents/" + docId + "/bookmark"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đã bỏ lưu tài liệu"));

        verify(socialInteractionService).removeBookmark(docId, currentUserId);
    }

    @Test
    void getMyBookmarks_meAlias_shouldReturnFeed() throws Exception {
        UUID currentUserId = UUID.randomUUID();
        SecurityContextHolder.setContext(currentUserId, "USER");

        when(socialInteractionService.getMyBookmarks(eq(currentUserId), any()))
                .thenReturn(new PageResponse<>(List.of(), 0, 10, 0, 0, true));

        mockMvc.perform(get("/api/v1/documents/bookmarks/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
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
    void getUnlockStatus_whenAlreadyUnlocked_shouldReturnTrue() throws Exception {
        UUID docId = UUID.randomUUID();
        UUID currentUserId = UUID.randomUUID();
        SecurityContextHolder.setContext(currentUserId, "USER");

        when(socialInteractionService.checkUnlockStatus(eq(docId), eq(currentUserId)))
                .thenReturn(new UnlockStatusResponse(docId, true, "Tài liệu đã được mở khóa"));

        mockMvc.perform(get("/api/v1/documents/" + docId + "/unlock-status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unlocked").value(true));
    }

    @Test
    void getMyUnlockedDocuments_shouldReturnPageResponse() throws Exception {
        UUID currentUserId = UUID.randomUUID();
        SecurityContextHolder.setContext(currentUserId, "USER");

        when(socialInteractionService.getMyUnlockedDocuments(eq(currentUserId), any()))
                .thenReturn(new PageResponse<>(List.of(), 0, 10, 0, 0, true));

        mockMvc.perform(get("/api/v1/documents/unlocked/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
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
