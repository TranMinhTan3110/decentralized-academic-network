package com.network.document_service.service;

import com.network.document_service.client.UserServiceClient;
import com.network.document_service.dto.request.CreateCommentRequest;
import com.network.document_service.dto.request.ReportDocumentRequest;
import com.network.document_service.dto.request.UnlockDocumentRequest;
import com.network.document_service.entity.*;
import com.network.document_service.event.DocumentEventProducer;
import com.network.document_service.exception.BadRequestException;
import com.network.document_service.exception.ResourceNotFoundException;
import com.network.document_service.repository.*;
import com.network.document_service.service.impl.SocialInteractionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SocialInteractionServiceTest {

    private DocumentRepository documentRepo;
    private DocumentLikeRepository likeRepo;
    private DocumentCommentRepository commentRepo;
    private DocumentBookmarkRepository bookmarkRepo;
    private UserUnlockedDocumentRepository unlockRepo;
    private DocumentReportRepository reportRepo;
    private DocumentEventProducer eventProducer;
    private UserServiceClient userServiceClient;

    private SocialInteractionService service;

    @BeforeEach
    void setUp() {
        documentRepo = mock(DocumentRepository.class);
        likeRepo = mock(DocumentLikeRepository.class);
        commentRepo = mock(DocumentCommentRepository.class);
        bookmarkRepo = mock(DocumentBookmarkRepository.class);
        unlockRepo = mock(UserUnlockedDocumentRepository.class);
        reportRepo = mock(DocumentReportRepository.class);
        eventProducer = mock(DocumentEventProducer.class);
        userServiceClient = mock(UserServiceClient.class);

        service = new SocialInteractionServiceImpl(
                documentRepo, likeRepo, commentRepo, bookmarkRepo, unlockRepo, reportRepo, eventProducer, userServiceClient
        );
    }

    @Test
    void toggleLike_whenNotLiked_shouldAddLike() {
        UUID docId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        when(documentRepo.existsById(docId)).thenReturn(true);
        when(likeRepo.findByUserIdAndDocumentId(userId, docId)).thenReturn(Optional.empty());

        boolean isLiked = service.toggleLike(docId, userId);

        assertTrue(isLiked);
        verify(likeRepo).save(any(DocumentLike.class));
        verify(documentRepo).updateLikeCount(docId, 1);
        verify(eventProducer).sendDocumentInteracted(any());
    }

    @Test
    void toggleLike_whenAlreadyLiked_shouldRemoveLike() {
        UUID docId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        DocumentLike existing = DocumentLike.builder().userId(userId).documentId(docId).build();
        when(documentRepo.existsById(docId)).thenReturn(true);
        when(likeRepo.findByUserIdAndDocumentId(userId, docId)).thenReturn(Optional.of(existing));

        boolean isLiked = service.toggleLike(docId, userId);

        assertFalse(isLiked);
        verify(likeRepo).delete(existing);
        verify(documentRepo).updateLikeCount(docId, -1);
    }

    @Test
    void toggleLike_whenDocNotExists_shouldThrow() {
        UUID docId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        when(documentRepo.existsById(docId)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> service.toggleLike(docId, userId));
    }

    @Test
    void addComment_valid_shouldSaveAndReturn() {
        UUID docId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        CreateCommentRequest req = CreateCommentRequest.builder().content("Hay quá").pageNumber(1).build();

        when(documentRepo.existsById(docId)).thenReturn(true);
        when(commentRepo.save(any(DocumentComment.class))).thenAnswer(i -> {
            DocumentComment c = i.getArgument(0);
            c.setId(UUID.randomUUID());
            return c;
        });

        var res = service.addComment(docId, userId, req);
        assertNotNull(res);
        assertEquals("Hay quá", res.getContent());
        verify(documentRepo).updateCommentCount(docId, 1);
    }

    @Test
    void addComment_notExists_shouldThrow() {
        UUID docId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        CreateCommentRequest req = CreateCommentRequest.builder().content("Hay quá").build();
        when(documentRepo.existsById(docId)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> service.addComment(docId, userId, req));
    }

    @Test
    void addComment_blankContent_shouldThrow() {
        UUID docId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        CreateCommentRequest req = CreateCommentRequest.builder().content("  ").build();
        when(documentRepo.existsById(docId)).thenReturn(true);

        assertThrows(BadRequestException.class, () -> service.addComment(docId, userId, req));
    }

    @Test
    void getComments_shouldReturnPage() {
        UUID docId = UUID.randomUUID();
        UUID cId = UUID.randomUUID();
        DocumentComment c = DocumentComment.builder().id(cId).documentId(docId).content("C1").userId(UUID.randomUUID()).build();
        DocumentComment reply = DocumentComment.builder().id(UUID.randomUUID()).parentId(cId).documentId(docId).content("R1").userId(UUID.randomUUID()).build();

        when(commentRepo.findByDocumentIdAndParentIdIsNullOrderByCreatedAtDesc(eq(docId), any()))
                .thenReturn(new PageImpl<>(List.of(c)));
        when(commentRepo.findByParentIdOrderByCreatedAtAsc(cId)).thenReturn(List.of(reply));

        var page = service.getComments(docId, PageRequest.of(0, 10));
        assertEquals(1, page.getContent().size());
        assertEquals(1, page.getContent().get(0).getReplies().size());
    }

    @Test
    void toggleBookmark_whenNew_shouldSave() {
        UUID docId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        when(documentRepo.existsById(docId)).thenReturn(true);
        when(bookmarkRepo.findByUserIdAndDocumentId(userId, docId)).thenReturn(Optional.empty());

        boolean bookmarked = service.toggleBookmark(docId, userId, null);
        assertTrue(bookmarked);
        verify(bookmarkRepo).save(any(DocumentBookmark.class));
        verify(documentRepo).updateBookmarkCount(docId, 1);
    }

    @Test
    void toggleBookmark_whenExists_shouldDelete() {
        UUID docId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        DocumentBookmark b = DocumentBookmark.builder().id(UUID.randomUUID()).userId(userId).documentId(docId).build();
        when(documentRepo.existsById(docId)).thenReturn(true);
        when(bookmarkRepo.findByUserIdAndDocumentId(userId, docId)).thenReturn(Optional.of(b));

        boolean bookmarked = service.toggleBookmark(docId, userId, "Favorite");
        assertFalse(bookmarked);
        verify(bookmarkRepo).delete(b);
        verify(documentRepo).updateBookmarkCount(docId, -1);
    }

    @Test
    void toggleBookmark_notExists_shouldThrow() {
        UUID docId = UUID.randomUUID();
        when(documentRepo.existsById(docId)).thenReturn(false);
        assertThrows(ResourceNotFoundException.class, () -> service.toggleBookmark(docId, UUID.randomUUID(), "Fav"));
    }

    @Test
    void getMyBookmarks_shouldReturnPage() {
        UUID userId = UUID.randomUUID();
        UUID docId = UUID.randomUUID();
        DocumentBookmark b = DocumentBookmark.builder().documentId(docId).userId(userId).build();
        Document d = Document.builder().id(docId).title("Doc1").userId(UUID.randomUUID()).build();

        when(bookmarkRepo.findByUserIdOrderByCreatedAtDesc(eq(userId), any())).thenReturn(new PageImpl<>(List.of(b)));
        when(documentRepo.findByIdIn(List.of(docId))).thenReturn(List.of(d));
        when(userServiceClient.getAuthorsBatch(any())).thenReturn(Map.of());

        var page = service.getMyBookmarks(userId, PageRequest.of(0, 10));
        assertEquals(1, page.getContent().size());
        assertEquals("Doc1", page.getContent().get(0).getTitle());
    }

    @Test
    void unlockDocument_author_shouldReturnTrueImmediately() {
        UUID docId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        Document doc = Document.builder().id(docId).userId(userId).build();
        when(documentRepo.findById(docId)).thenReturn(Optional.of(doc));

        boolean res = service.unlockDocument(docId, userId, new UnlockDocumentRequest());
        assertTrue(res);
        verifyNoInteractions(userServiceClient);
    }

    @Test
    void unlockDocument_alreadyUnlocked_shouldReturnTrueImmediately() {
        UUID docId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        Document doc = Document.builder().id(docId).userId(UUID.randomUUID()).build();
        when(documentRepo.findById(docId)).thenReturn(Optional.of(doc));
        when(unlockRepo.existsByUserIdAndDocumentId(userId, docId)).thenReturn(true);

        boolean res = service.unlockDocument(docId, userId, new UnlockDocumentRequest());
        assertTrue(res);
        verifyNoInteractions(userServiceClient);
    }

    @Test
    void unlockDocument_notFound_shouldThrow() {
        UUID docId = UUID.randomUUID();
        when(documentRepo.findById(docId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.unlockDocument(docId, UUID.randomUUID(), null));
    }

    @Test
    void unlockDocument_nonAuthor_shouldDeductPointsAndSave() {
        UUID docId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        Document doc = Document.builder().id(docId).userId(UUID.randomUUID()).unlockPointsRequired(15).build();
        when(documentRepo.findById(docId)).thenReturn(Optional.of(doc));
        when(unlockRepo.existsByUserIdAndDocumentId(userId, docId)).thenReturn(false);

        boolean res = service.unlockDocument(docId, userId, UnlockDocumentRequest.builder().idempotencyKey(UUID.randomUUID()).build());
        assertTrue(res);
        verify(userServiceClient).deductPoints(eq(userId), eq(15), any());
        verify(unlockRepo).save(any(UserUnlockedDocument.class));
    }

    @Test
    void reportDocument_valid_shouldSave() {
        UUID docId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        when(documentRepo.existsById(docId)).thenReturn(true);

        ReportDocumentRequest req = ReportDocumentRequest.builder().reason("Spam").description("Quang cao").build();
        service.reportDocument(docId, userId, req);

        verify(reportRepo).save(any(DocumentReport.class));
    }

    @Test
    void reportDocument_docNotExists_shouldThrow() {
        UUID docId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        when(documentRepo.existsById(docId)).thenReturn(false);

        ReportDocumentRequest req = ReportDocumentRequest.builder().reason("Spam").build();
        assertThrows(ResourceNotFoundException.class, () -> service.reportDocument(docId, userId, req));
    }

    @Test
    void reportDocument_blankReason_shouldThrow() {
        UUID docId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        when(documentRepo.existsById(docId)).thenReturn(true);

        ReportDocumentRequest req = ReportDocumentRequest.builder().reason(" ").build();
        assertThrows(BadRequestException.class, () -> service.reportDocument(docId, userId, req));
    }
}
