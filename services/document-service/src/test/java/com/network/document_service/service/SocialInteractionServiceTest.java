package com.network.document_service.service;

import com.network.document_service.client.UserServiceClient;
import com.network.document_service.dto.request.CreateCommentRequest;
import com.network.document_service.dto.request.RateDocumentRequest;
import com.network.document_service.dto.request.ReportDocumentRequest;
import com.network.document_service.dto.request.UnlockDocumentRequest;
import com.network.document_service.dto.response.AuthorSummaryDto;
import com.network.document_service.dto.response.DocumentRatingResponse;
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
    private NotificationService notificationService;
    private DocumentRatingRepository ratingRepo;

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
        notificationService = mock(NotificationService.class);
        ratingRepo = mock(DocumentRatingRepository.class);

        service = new SocialInteractionServiceImpl(
                documentRepo, likeRepo, commentRepo, bookmarkRepo, unlockRepo, reportRepo, eventProducer,
                userServiceClient, notificationService, ratingRepo
        );
    }

    @Test
    void toggleLike_whenNotLiked_shouldAddLike() {
        UUID docId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID authorId = UUID.randomUUID();
        Document doc = Document.builder().id(docId).userId(authorId).title("Tài liệu Giải tích").build();
        when(documentRepo.existsById(docId)).thenReturn(true);
        when(documentRepo.findById(docId)).thenReturn(Optional.of(doc));
        when(likeRepo.findByUserIdAndDocumentId(userId, docId)).thenReturn(Optional.empty());

        boolean isLiked = service.toggleLike(docId, userId);

        assertTrue(isLiked);
        verify(likeRepo).save(any(DocumentLike.class));
        verify(documentRepo).updateLikeCount(docId, 1);
        verify(eventProducer).sendDocumentInteracted(any());
        verify(notificationService).createNotification(eq(authorId), eq(userId), eq(docId), eq("DOCUMENT_LIKED"), anyString(), anyString());
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
        UUID authorId = UUID.randomUUID();
        Document doc = Document.builder().id(docId).userId(authorId).title("Tài liệu Xác suất").build();
        when(documentRepo.existsById(docId)).thenReturn(true);
        when(documentRepo.findById(docId)).thenReturn(Optional.of(doc));
        when(bookmarkRepo.findByUserIdAndDocumentId(userId, docId)).thenReturn(Optional.empty());

        boolean bookmarked = service.toggleBookmark(docId, userId, null);
        assertTrue(bookmarked);
        verify(bookmarkRepo).save(any(DocumentBookmark.class));
        verify(documentRepo).updateBookmarkCount(docId, 1);
        verify(notificationService).createNotification(eq(authorId), eq(userId), eq(docId), eq("DOCUMENT_BOOKMARKED"), anyString(), anyString());
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
        // Reserve-then-charge: bản ghi unlock được lưu (saveAndFlush) trước khi trừ điểm
        verify(unlockRepo).saveAndFlush(any(UserUnlockedDocument.class));
        verify(userServiceClient).deductPoints(eq(userId), eq(15), any());
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

    @Test
    void getUsersWhoLiked_shouldReturnList() {
        UUID docId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        when(documentRepo.existsById(docId)).thenReturn(true);
        when(likeRepo.findByDocumentId(docId)).thenReturn(List.of(DocumentLike.builder().userId(userId).build()));
        when(userServiceClient.getAuthorsBatch(List.of(userId)))
                .thenReturn(Map.of(userId, com.network.document_service.dto.response.AuthorSummaryDto.builder().id(userId).fullName("User 1").build()));

        var list = service.getUsersWhoLiked(docId);
        assertEquals(1, list.size());
        assertEquals("User 1", list.get(0).getFullName());
    }

    @Test
    void deleteComment_byAuthor_shouldDelete() {
        UUID commentId = UUID.randomUUID();
        UUID authorId = UUID.randomUUID();
        UUID docId = UUID.randomUUID();
        DocumentComment c = DocumentComment.builder().id(commentId).userId(authorId).documentId(docId).build();

        when(commentRepo.findById(commentId)).thenReturn(Optional.of(c));
        when(commentRepo.findByParentIdOrderByCreatedAtAsc(commentId)).thenReturn(List.of());

        service.deleteComment(commentId, authorId);
        verify(commentRepo).delete(c);
        verify(documentRepo).updateCommentCount(docId, -1);
    }

    @Test
    void deleteComment_byOther_shouldThrowForbidden() {
        UUID commentId = UUID.randomUUID();
        UUID authorId = UUID.randomUUID();
        UUID otherId = UUID.randomUUID();
        DocumentComment c = DocumentComment.builder().id(commentId).userId(authorId).build();

        when(commentRepo.findById(commentId)).thenReturn(Optional.of(c));

        assertThrows(com.network.document_service.exception.ForbiddenException.class,
                () -> service.deleteComment(commentId, otherId));
    }

    @Test
    void removeBookmark_whenExists_shouldDelete() {
        UUID docId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        DocumentBookmark b = DocumentBookmark.builder().id(UUID.randomUUID()).userId(userId).documentId(docId).build();
        when(bookmarkRepo.findByUserIdAndDocumentId(userId, docId)).thenReturn(Optional.of(b));

        service.removeBookmark(docId, userId);
        verify(bookmarkRepo).delete(b);
        verify(documentRepo).updateBookmarkCount(docId, -1);
    }

    @Test
    void checkUnlockStatus_forAuthor_shouldBeTrue() {
        UUID docId = UUID.randomUUID();
        UUID authorId = UUID.randomUUID();
        Document doc = Document.builder().id(docId).userId(authorId).build();
        when(documentRepo.findById(docId)).thenReturn(Optional.of(doc));

        var status = service.checkUnlockStatus(docId, authorId);
        assertTrue(status.isUnlocked());
        assertEquals("Tác giả sở hữu tài liệu", status.getReason());
    }

    @Test
    void checkUnlockStatus_whenUnlockedByPoints_shouldBeTrue() {
        UUID docId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        Document doc = Document.builder().id(docId).userId(UUID.randomUUID()).build();
        when(documentRepo.findById(docId)).thenReturn(Optional.of(doc));
        when(unlockRepo.existsByUserIdAndDocumentId(userId, docId)).thenReturn(true);

        var status = service.checkUnlockStatus(docId, userId);
        assertTrue(status.isUnlocked());
    }

    @Test
    void getMyUnlockedDocuments_shouldReturnPage() {
        UUID userId = UUID.randomUUID();
        UUID docId = UUID.randomUUID();
        UserUnlockedDocument unlock = UserUnlockedDocument.builder().documentId(docId).userId(userId).build();
        Document doc = Document.builder().id(docId).title("Doc Unlocked").userId(UUID.randomUUID()).build();

        when(unlockRepo.findByUserIdOrderByCreatedAtDesc(eq(userId), any()))
                .thenReturn(new PageImpl<>(List.of(unlock)));
        when(documentRepo.findByIdIn(List.of(docId))).thenReturn(List.of(doc));
        when(userServiceClient.getAuthorsBatch(any())).thenReturn(Map.of());

        var page = service.getMyUnlockedDocuments(userId, PageRequest.of(0, 10));
        assertNotNull(page);
        assertEquals(1, page.getContent().size());
        assertEquals("Doc Unlocked", page.getContent().get(0).getTitle());
    }

    @Test
    void getAdminReports_shouldReturnList() {
        DocumentReport report = DocumentReport.builder().id(UUID.randomUUID()).reason("Spam").build();
        when(reportRepo.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(report));

        var list = service.getAdminReports();
        assertEquals(1, list.size());
        assertEquals("Spam", list.get(0).getReason());
    }

    @Test
    void moderateDocument_shouldUpdateStatusAndResolveReports() {
        UUID docId = UUID.randomUUID();
        Document doc = Document.builder().id(docId).status("PENDING").build();
        DocumentReport report = DocumentReport.builder().id(UUID.randomUUID()).documentId(docId).status("PENDING").build();

        when(documentRepo.findById(docId)).thenReturn(Optional.of(doc));
        when(reportRepo.findByDocumentId(docId)).thenReturn(List.of(report));

        service.moderateDocument(docId, "REJECTED", "Vi phạm bản quyền");

        assertEquals("REJECTED", doc.getStatus());
        assertEquals("RESOLVED", report.getStatus());
        verify(documentRepo).save(doc);
        verify(reportRepo).saveAll(any());
    }

    @Test
    void rateDocument_newFiveStarRating_shouldSaveUpdateDocAndRewardAuthor() {
        UUID docId = UUID.randomUUID();
        UUID authorId = UUID.randomUUID();
        UUID raterId = UUID.randomUUID();
        Document doc = Document.builder().id(docId).userId(authorId).title("Giải tích 1").ratingAvg(0.0).ratingCount(0).build();
        DocumentRating r1 = DocumentRating.builder().documentId(docId).userId(UUID.randomUUID()).rating(5).build();
        DocumentRating r2 = DocumentRating.builder().documentId(docId).userId(raterId).rating(5).build();

        when(documentRepo.findById(docId)).thenReturn(Optional.of(doc));
        when(ratingRepo.findByUserIdAndDocumentId(raterId, docId)).thenReturn(Optional.empty());
        when(ratingRepo.findByDocumentIdOrderByCreatedAtDesc(docId)).thenReturn(List.of(r1, r2));
        when(userServiceClient.getAuthorSummary(raterId))
                .thenReturn(AuthorSummaryDto.builder().id(raterId).fullName("Nguyễn Văn B").build());

        DocumentRatingResponse res = service.rateDocument(docId, raterId, RateDocumentRequest.builder().rating(5).review("Rất hữu ích").build());

        assertNotNull(res);
        assertEquals(docId, res.getDocumentId());
        assertEquals(5.0, res.getRatingAvg());
        assertEquals(2, res.getRatingCount());
        assertEquals(5, res.getUserRating());
        verify(ratingRepo).save(any(DocumentRating.class));
        verify(documentRepo).save(doc);
        verify(eventProducer).sendReputationEvent(eq(authorId), eq("RATE_5_STAR"), eq(docId.toString()), anyString());
        verify(notificationService).createNotification(
                eq(authorId), eq(raterId), eq(docId), eq("DOCUMENT_APPROVED"), contains("5 ⭐"), anyString()
        );
    }

    @Test
    void rateDocument_updateExistingFourStarRating_shouldUpdateAndRewardThreePoints() {
        UUID docId = UUID.randomUUID();
        UUID authorId = UUID.randomUUID();
        UUID raterId = UUID.randomUUID();
        Document doc = Document.builder().id(docId).userId(authorId).title("Giải tích 2").ratingAvg(3.0).ratingCount(1).build();
        DocumentRating existing = DocumentRating.builder().id(UUID.randomUUID()).documentId(docId).userId(raterId).rating(3).build();

        when(documentRepo.findById(docId)).thenReturn(Optional.of(doc));
        when(ratingRepo.findByUserIdAndDocumentId(raterId, docId)).thenReturn(Optional.of(existing));
        when(ratingRepo.findByDocumentIdOrderByCreatedAtDesc(docId)).thenReturn(List.of(existing));

        DocumentRatingResponse res = service.rateDocument(docId, raterId, RateDocumentRequest.builder().rating(4).build());

        assertEquals(4, existing.getRating());
        assertEquals(4.0, res.getRatingAvg());
        assertEquals(1, res.getRatingCount());
        assertEquals(4, res.getUserRating());
        verify(eventProducer).sendReputationEvent(eq(authorId), eq("RATE_4_STAR"), eq(docId.toString()), anyString());
        verifyNoInteractions(notificationService);

        // Nếu gửi lại đúng 4 sao y hệt thì trả về ngay không lưu lặp lại
        clearInvocations(ratingRepo);
        DocumentRatingResponse sameRes = service.rateDocument(docId, raterId, RateDocumentRequest.builder().rating(4).build());
        assertEquals(4, sameRes.getUserRating());
        verify(ratingRepo, never()).save(any());
    }

    @Test
    void rateDocument_invalidRating_shouldThrowBadRequest() {
        UUID docId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        assertThrows(BadRequestException.class,
                () -> service.rateDocument(docId, userId, RateDocumentRequest.builder().rating(0).build()));
        assertThrows(BadRequestException.class,
                () -> service.rateDocument(docId, userId, RateDocumentRequest.builder().rating(6).build()));
        assertThrows(BadRequestException.class,
                () -> service.rateDocument(docId, userId, null));
    }

    @Test
    void rateDocument_docNotFound_shouldThrowNotFound() {
        UUID docId = UUID.randomUUID();
        when(documentRepo.findById(docId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> service.rateDocument(docId, UUID.randomUUID(), RateDocumentRequest.builder().rating(5).build()));
    }

    @Test
    void rateDocument_byAuthor_shouldThrowBadRequest() {
        UUID docId = UUID.randomUUID();
        UUID authorId = UUID.randomUUID();
        Document doc = Document.builder().id(docId).userId(authorId).ratingAvg(0.0).ratingCount(0).build();
        when(documentRepo.findById(docId)).thenReturn(Optional.of(doc));

        assertThrows(BadRequestException.class,
                () -> service.rateDocument(docId, authorId, RateDocumentRequest.builder().rating(5).build()));
    }

    @Test
    void rateDocument_whenRatingRepoNull_shouldFallbackGracefully() {
        SocialInteractionServiceImpl fallbackService = new SocialInteractionServiceImpl(
                documentRepo, likeRepo, commentRepo, bookmarkRepo, unlockRepo, reportRepo, eventProducer,
                userServiceClient, notificationService
        );
        UUID docId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        Document doc = Document.builder().id(docId).userId(UUID.randomUUID()).ratingAvg(4.0).ratingCount(1).build();
        when(documentRepo.findById(docId)).thenReturn(Optional.of(doc));

        DocumentRatingResponse res = fallbackService.rateDocument(docId, userId, RateDocumentRequest.builder().rating(5).build());
        assertEquals(4.5, res.getRatingAvg());
        assertEquals(2, res.getRatingCount());
        assertEquals(5, res.getUserRating());
    }

    @Test
    void getDocumentRatingSummary_shouldReturnSummaryWithUserRating() {
        UUID docId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        Document doc = Document.builder().id(docId).ratingAvg(4.6).ratingCount(10).build();
        DocumentRating userRating = DocumentRating.builder().documentId(docId).userId(userId).rating(5).build();

        when(documentRepo.findById(docId)).thenReturn(Optional.of(doc));
        when(ratingRepo.findByUserIdAndDocumentId(userId, docId)).thenReturn(Optional.of(userRating));

        DocumentRatingResponse res = service.getDocumentRatingSummary(docId, userId);
        assertEquals(docId, res.getDocumentId());
        assertEquals(4.6, res.getRatingAvg());
        assertEquals(10, res.getRatingCount());
        assertEquals(5, res.getUserRating());
    }

    @Test
    void getDocumentRatingSummary_notFound_shouldThrow() {
        UUID docId = UUID.randomUUID();
        when(documentRepo.findById(docId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> service.getDocumentRatingSummary(docId, UUID.randomUUID()));
    }

    @Test
    void likeComment_valid_shouldIncrementLikeCount() {
        UUID commentId = UUID.randomUUID();
        UUID commentAuthorId = UUID.randomUUID();
        UUID likerId = UUID.randomUUID();
        UUID docId = UUID.randomUUID();
        DocumentComment comment = DocumentComment.builder()
                .id(commentId)
                .documentId(docId)
                .userId(commentAuthorId)
                .content("Bình luận rất tâm huyết")
                .likeCount(2)
                .build();

        when(commentRepo.findById(commentId)).thenReturn(Optional.of(comment));

        int newLikes = service.likeComment(commentId, likerId);

        assertEquals(3, newLikes);
        verify(commentRepo).save(comment);
    }

    @Test
    void likeComment_notFound_shouldThrow() {
        UUID commentId = UUID.randomUUID();
        when(commentRepo.findById(commentId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> service.likeComment(commentId, UUID.randomUUID()));
    }

    @Test
    void addComment_withParentId_shouldNotifyParentCommentAuthorAndDocAuthor() {
        UUID docId = UUID.randomUUID();
        UUID docAuthorId = UUID.randomUUID();
        UUID parentCommentId = UUID.randomUUID();
        UUID parentAuthorId = UUID.randomUUID();
        UUID replierId = UUID.randomUUID();

        Document doc = Document.builder().id(docId).userId(docAuthorId).title("Cấu trúc dữ liệu").build();
        DocumentComment parentComment = DocumentComment.builder().id(parentCommentId).documentId(docId).userId(parentAuthorId).content("Câu hỏi chương 1").build();

        when(documentRepo.existsById(docId)).thenReturn(true);
        when(documentRepo.findById(docId)).thenReturn(Optional.of(doc));
        when(commentRepo.findById(parentCommentId)).thenReturn(Optional.of(parentComment));
        when(commentRepo.save(any(DocumentComment.class))).thenAnswer(i -> {
            DocumentComment c = i.getArgument(0);
            c.setId(UUID.randomUUID());
            return c;
        });
        when(userServiceClient.getAuthorSummary(replierId))
                .thenReturn(AuthorSummaryDto.builder().id(replierId).fullName("Lê Văn D").build());

        CreateCommentRequest req = CreateCommentRequest.builder()
                .content("Mình trả lời câu hỏi chương 1 nhé")
                .parentId(parentCommentId)
                .build();

        var res = service.addComment(docId, replierId, req);

        assertNotNull(res);
        assertEquals(parentCommentId, res.getParentId());
        verify(notificationService).createNotification(
                eq(parentAuthorId), eq(replierId), eq(docId), eq("COMMENT_REPLIED"), anyString(), anyString()
        );
        verify(notificationService).createNotification(
                eq(docAuthorId), eq(replierId), eq(docId), eq("DOCUMENT_COMMENTED"), anyString(), anyString()
        );
    }

    @Test
    void deleteComment_withReplies_shouldDeleteRepliesAndDecrementTotalCount() {
        UUID commentId = UUID.randomUUID();
        UUID authorId = UUID.randomUUID();
        UUID docId = UUID.randomUUID();
        DocumentComment root = DocumentComment.builder().id(commentId).userId(authorId).documentId(docId).build();
        DocumentComment r1 = DocumentComment.builder().id(UUID.randomUUID()).parentId(commentId).documentId(docId).build();
        DocumentComment r2 = DocumentComment.builder().id(UUID.randomUUID()).parentId(commentId).documentId(docId).build();

        when(commentRepo.findById(commentId)).thenReturn(Optional.of(root));
        when(commentRepo.findByParentIdOrderByCreatedAtAsc(commentId)).thenReturn(List.of(r1, r2));

        service.deleteComment(commentId, authorId);

        verify(commentRepo).deleteAll(List.of(r1, r2));
        verify(commentRepo).delete(root);
        verify(documentRepo).updateCommentCount(docId, -3);
    }
}
