package com.network.document_service.service.impl;

import com.network.document_service.client.UserServiceClient;
import com.network.document_service.config.SecurityContextHolder;
import com.network.document_service.dto.request.CreateCommentRequest;
import com.network.document_service.dto.request.RateDocumentRequest;
import com.network.document_service.dto.request.ReportDocumentRequest;
import com.network.document_service.dto.request.UnlockDocumentRequest;
import com.network.document_service.dto.response.*;
import com.network.document_service.entity.*;
import com.network.document_service.event.DocumentEventProducer;
import com.network.document_service.event.DocumentInteractedEvent;
import com.network.document_service.exception.BadRequestException;
import com.network.document_service.exception.ForbiddenException;
import com.network.document_service.exception.ResourceNotFoundException;
import com.network.document_service.repository.*;
import com.network.document_service.service.SocialInteractionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class SocialInteractionServiceImpl implements SocialInteractionService {

    private final DocumentRepository documentRepository;
    private final DocumentLikeRepository documentLikeRepository;
    private final DocumentCommentRepository documentCommentRepository;
    private final DocumentBookmarkRepository documentBookmarkRepository;
    private final UserUnlockedDocumentRepository userUnlockedDocumentRepository;
    private final DocumentReportRepository documentReportRepository;
    private final DocumentEventProducer documentEventProducer;
    private final UserServiceClient userServiceClient;
    private final com.network.document_service.service.NotificationService notificationService;
    private DocumentRatingRepository documentRatingRepository;

    @Autowired
    public SocialInteractionServiceImpl(DocumentRepository documentRepository,
                                       DocumentLikeRepository documentLikeRepository,
                                       DocumentCommentRepository documentCommentRepository,
                                       DocumentBookmarkRepository documentBookmarkRepository,
                                       UserUnlockedDocumentRepository userUnlockedDocumentRepository,
                                       DocumentReportRepository documentReportRepository,
                                       DocumentEventProducer documentEventProducer,
                                       UserServiceClient userServiceClient,
                                       com.network.document_service.service.NotificationService notificationService,
                                       DocumentRatingRepository documentRatingRepository) {
        this.documentRepository = documentRepository;
        this.documentLikeRepository = documentLikeRepository;
        this.documentCommentRepository = documentCommentRepository;
        this.documentBookmarkRepository = documentBookmarkRepository;
        this.userUnlockedDocumentRepository = userUnlockedDocumentRepository;
        this.documentReportRepository = documentReportRepository;
        this.documentEventProducer = documentEventProducer;
        this.userServiceClient = userServiceClient;
        this.notificationService = notificationService;
        this.documentRatingRepository = documentRatingRepository;
    }

    public SocialInteractionServiceImpl(DocumentRepository documentRepository,
                                       DocumentLikeRepository documentLikeRepository,
                                       DocumentCommentRepository documentCommentRepository,
                                       DocumentBookmarkRepository documentBookmarkRepository,
                                       UserUnlockedDocumentRepository userUnlockedDocumentRepository,
                                       DocumentReportRepository documentReportRepository,
                                       DocumentEventProducer documentEventProducer,
                                       UserServiceClient userServiceClient,
                                       com.network.document_service.service.NotificationService notificationService) {
        this(documentRepository, documentLikeRepository, documentCommentRepository,
                documentBookmarkRepository, userUnlockedDocumentRepository, documentReportRepository,
                documentEventProducer, userServiceClient, notificationService, null);
    }

    public void setDocumentRatingRepository(DocumentRatingRepository documentRatingRepository) {
        this.documentRatingRepository = documentRatingRepository;
    }

    @Override
    public boolean toggleLike(UUID documentId, UUID userId) {
        if (!documentRepository.existsById(documentId)) {
            throw new ResourceNotFoundException("Tài liệu không tồn tại với ID: " + documentId);
        }

        Optional<DocumentLike> existing = documentLikeRepository.findByUserIdAndDocumentId(userId, documentId);
        if (existing.isPresent()) {
            documentLikeRepository.delete(existing.get());
            documentRepository.updateLikeCount(documentId, -1);
            documentEventProducer.sendDocumentInteracted(DocumentInteractedEvent.builder()
                    .documentId(documentId)
                    .actorUserId(userId)
                    .interactionType("UNLIKE")
                    .build());
            return false;
        } else {
            DocumentLike like = DocumentLike.builder()
                    .userId(userId)
                    .documentId(documentId)
                    .reactionType("LIKE")
                    .build();
            documentLikeRepository.save(like);
            documentRepository.updateLikeCount(documentId, 1);
            documentEventProducer.sendDocumentInteracted(DocumentInteractedEvent.builder()
                    .documentId(documentId)
                    .actorUserId(userId)
                    .interactionType("LIKE")
                    .build());

            documentRepository.findById(documentId).ifPresent(doc -> {
                if (doc.getUserId() != null && !doc.getUserId().equals(userId)) {
                    String likeIdempKey = "like-" + documentId + "-" + userId;
                    documentEventProducer.sendReputationEvent(doc.getUserId(), "RECEIVE_LIKE", documentId.toString(), likeIdempKey);
                    userServiceClient.recordReputationEvent(doc.getUserId(), "RECEIVE_LIKE", documentId.toString(), likeIdempKey);
                    String actorName = resolveActorDisplayName(userServiceClient.getAuthorSummary(userId));
                    notificationService.createNotification(
                            doc.getUserId(),
                            userId,
                            documentId,
                            "DOCUMENT_LIKED",
                            "Lượt thích mới trên tài liệu của bạn",
                            actorName + " vừa thả tim tài liệu \"" + doc.getTitle() + "\" của bạn (+2 điểm uy tín)."
                    );
                }
            });
            return true;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuthorSummaryDto> getUsersWhoLiked(UUID documentId) {
        if (!documentRepository.existsById(documentId)) {
            throw new ResourceNotFoundException("Tài liệu không tồn tại với ID: " + documentId);
        }
        List<DocumentLike> likes = documentLikeRepository.findByDocumentId(documentId);
        List<UUID> userIds = likes.stream().map(DocumentLike::getUserId).toList();
        if (userIds.isEmpty()) {
            return Collections.emptyList();
        }
        Map<UUID, AuthorSummaryDto> authors = userServiceClient.getAuthorsBatch(userIds);
        return userIds.stream()
                .map(uid -> authors.getOrDefault(uid, AuthorSummaryDto.anonymous()))
                .toList();
    }

    @Override
    public CommentResponse addComment(UUID documentId, UUID userId, CreateCommentRequest request) {
        if (!documentRepository.existsById(documentId)) {
            throw new ResourceNotFoundException("Tài liệu không tồn tại với ID: " + documentId);
        }
        if (request.getContent() == null || request.getContent().trim().isEmpty()) {
            throw new BadRequestException("Nội dung bình luận không được rỗng");
        }

        DocumentComment comment = DocumentComment.builder()
                .documentId(documentId)
                .userId(userId)
                .parentId(request.getParentId())
                .pageNumber(request.getPageNumber())
                .content(request.getContent().trim())
                .build();
        DocumentComment saved = documentCommentRepository.save(comment);
        documentRepository.updateCommentCount(documentId, 1);

        documentEventProducer.sendDocumentInteracted(DocumentInteractedEvent.builder()
                .documentId(documentId)
                .actorUserId(userId)
                .interactionType("COMMENT")
                .pageNumber(request.getPageNumber())
                .build());

        AuthorSummaryDto author = userServiceClient.getAuthorSummary(userId);
        String actorName = resolveActorDisplayName(author);
        String snippet = truncateSnippet(saved.getContent(), 60);

        documentRepository.findById(documentId).ifPresent(doc -> {
            UUID repliedUserId = null;
            if (request.getParentId() != null) {
                Optional<DocumentComment> parentOpt = documentCommentRepository.findById(request.getParentId());
                if (parentOpt.isPresent()) {
                    DocumentComment parent = parentOpt.get();
                    repliedUserId = parent.getUserId();
                    if (repliedUserId != null && !repliedUserId.equals(userId)) {
                        notificationService.createNotification(
                                repliedUserId,
                                userId,
                                documentId,
                                "COMMENT_REPLIED",
                                "Phản hồi mới cho bình luận của bạn",
                                actorName + " đã trả lời bình luận của bạn trong \"" + doc.getTitle() + "\": \"" + snippet + "\""
                        );
                    }
                }
            }

            if (doc.getUserId() != null && !doc.getUserId().equals(userId) && !doc.getUserId().equals(repliedUserId)) {
                notificationService.createNotification(
                        doc.getUserId(),
                        userId,
                        documentId,
                        "DOCUMENT_COMMENTED",
                        "Bình luận mới trên tài liệu của bạn",
                        actorName + " đã bình luận vào tài liệu \"" + doc.getTitle() + "\": \"" + snippet + "\""
                );
            }
        });

        return CommentResponse.builder()
                .id(saved.getId())
                .documentId(saved.getDocumentId())
                .parentId(saved.getParentId())
                .pageNumber(saved.getPageNumber())
                .content(saved.getContent())
                .likeCount(saved.getLikeCount())
                .author(author)
                .createdAt(saved.getCreatedAt())
                .replies(new ArrayList<>())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CommentResponse> getComments(UUID documentId, Pageable pageable) {
        Page<DocumentComment> page = documentCommentRepository.findByDocumentIdAndParentIdIsNullOrderByCreatedAtDesc(documentId, pageable);
        List<UUID> userIds = page.getContent().stream().map(DocumentComment::getUserId).collect(Collectors.toList());
        Map<UUID, AuthorSummaryDto> authors = userServiceClient.getAuthorsBatch(userIds);

        List<CommentResponse> content = page.getContent().stream().map(c -> {
            List<DocumentComment> replies = documentCommentRepository.findByParentIdOrderByCreatedAtAsc(c.getId());
            List<UUID> replyUserIds = replies.stream().map(DocumentComment::getUserId).collect(Collectors.toList());
            Map<UUID, AuthorSummaryDto> replyAuthors = userServiceClient.getAuthorsBatch(replyUserIds);

            List<CommentResponse> replyResponses = replies.stream().map(r -> CommentResponse.builder()
                    .id(r.getId())
                    .documentId(r.getDocumentId())
                    .parentId(r.getParentId())
                    .pageNumber(r.getPageNumber())
                    .content(r.getContent())
                    .likeCount(r.getLikeCount())
                    .author(replyAuthors.getOrDefault(r.getUserId(), AuthorSummaryDto.anonymous()))
                    .createdAt(r.getCreatedAt())
                    .build()).collect(Collectors.toList());

            return CommentResponse.builder()
                    .id(c.getId())
                    .documentId(c.getDocumentId())
                    .parentId(c.getParentId())
                    .pageNumber(c.getPageNumber())
                    .content(c.getContent())
                    .likeCount(c.getLikeCount())
                    .author(authors.getOrDefault(c.getUserId(), AuthorSummaryDto.anonymous()))
                    .replies(replyResponses)
                    .createdAt(c.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());

        return PageResponse.<CommentResponse>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    @Override
    public void deleteComment(UUID commentId, UUID currentUserId) {
        DocumentComment comment = documentCommentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Bình luận không tồn tại với ID: " + commentId));

        String role = SecurityContextHolder.getRole();
        boolean isAdmin = "ADMIN".equalsIgnoreCase(role);
        if (!comment.getUserId().equals(currentUserId) && !isAdmin) {
            throw new ForbiddenException("Bạn không có quyền xóa bình luận này");
        }

        List<DocumentComment> replies = documentCommentRepository.findByParentIdOrderByCreatedAtAsc(commentId);
        int totalDeleted = 1 + replies.size();

        if (!replies.isEmpty()) {
            documentCommentRepository.deleteAll(replies);
        }
        documentCommentRepository.delete(comment);
        documentRepository.updateCommentCount(comment.getDocumentId(), -totalDeleted);
    }

    @Override
    public int likeComment(UUID commentId, UUID userId) {
        DocumentComment comment = documentCommentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Bình luận không tồn tại với ID: " + commentId));
        int currentLikes = comment.getLikeCount() != null ? comment.getLikeCount() : 0;
        int nextLikes = currentLikes + 1;
        comment.setLikeCount(nextLikes);
        documentCommentRepository.save(comment);
        return nextLikes;
    }

    @Override
    public DocumentRatingResponse rateDocument(UUID documentId, UUID userId, RateDocumentRequest request) {
        if (request == null || request.getRating() == null || request.getRating() < 1 || request.getRating() > 5) {
            throw new BadRequestException("Số sao đánh giá phải nằm trong khoảng từ 1 đến 5");
        }
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài liệu không tồn tại với ID: " + documentId));

        if (doc.getUserId() != null && doc.getUserId().equals(userId)) {
            throw new BadRequestException("Tác giả không thể tự đánh giá tài liệu của chính mình");
        }

        int stars = request.getRating();
        String reviewText = request.getReview() != null && !request.getReview().isBlank() ? request.getReview().trim() : null;
        boolean isNewRating = true;

        if (documentRatingRepository != null) {
            Optional<DocumentRating> existingOpt = documentRatingRepository.findByUserIdAndDocumentId(userId, documentId);
            DocumentRating ratingEntity;
            if (existingOpt.isPresent()) {
                isNewRating = false;
                ratingEntity = existingOpt.get();
                if (ratingEntity.getRating() != null
                        && ratingEntity.getRating() == stars
                        && Objects.equals(ratingEntity.getReview(), reviewText)) {
                    return DocumentRatingResponse.builder()
                            .documentId(documentId)
                            .ratingAvg(doc.getRatingAvg() != null ? doc.getRatingAvg() : (double) stars)
                            .ratingCount(doc.getRatingCount() != null ? doc.getRatingCount() : 1)
                            .userRating(stars)
                            .userReview(reviewText)
                            .build();
                }
                ratingEntity.setRating(stars);
                ratingEntity.setReview(reviewText);
            } else {
                ratingEntity = DocumentRating.builder()
                        .documentId(documentId)
                        .userId(userId)
                        .rating(stars)
                        .review(reviewText)
                        .build();
            }
            documentRatingRepository.save(ratingEntity);

            List<DocumentRating> allRatings = documentRatingRepository.findByDocumentIdOrderByCreatedAtDesc(documentId);
            int count = allRatings.size();
            double avg = count == 0
                    ? stars
                    : Math.round(allRatings.stream().mapToInt(DocumentRating::getRating).average().orElse(stars) * 10.0) / 10.0;
            doc.setRatingAvg(avg);
            doc.setRatingCount(count);
            documentRepository.save(doc);
        } else {
            int prevCount = doc.getRatingCount() != null ? doc.getRatingCount() : 0;
            double prevAvg = doc.getRatingAvg() != null ? doc.getRatingAvg() : 0.0;
            int nextCount = prevCount + 1;
            double nextAvg = Math.round(((prevAvg * prevCount + stars) / nextCount) * 10.0) / 10.0;
            doc.setRatingAvg(nextAvg);
            doc.setRatingCount(nextCount);
            documentRepository.save(doc);
        }

        if (doc.getUserId() != null && !doc.getUserId().equals(userId)) {
            if (stars >= 4) {
                String actionType = stars == 5 ? "RATE_5_STAR" : "RATE_4_STAR";
                String rateIdempKey = "rate-" + documentId + "-" + userId;
                documentEventProducer.sendReputationEvent(doc.getUserId(), actionType, documentId.toString(), rateIdempKey);
                userServiceClient.recordReputationEvent(doc.getUserId(), actionType, documentId.toString(), rateIdempKey);
            }
            // Chỉ bắn thông báo ở lần đánh giá đầu tiên của người dùng cho tài liệu này (tránh spam khi sửa số sao)
            if (isNewRating) {
                String actorName = resolveActorDisplayName(userServiceClient.getAuthorSummary(userId));
                notificationService.createNotification(
                        doc.getUserId(),
                        userId,
                        documentId,
                        "DOCUMENT_APPROVED",
                        "Đánh giá mới (" + stars + " ⭐) trên tài liệu của bạn",
                        actorName + " vừa chấm " + stars + "/5 sao cho tài liệu \"" + doc.getTitle() + "\""
                                + (reviewText != null ? ": \"" + truncateSnippet(reviewText, 60) + "\"" : ".")
                );
            }
        }

        return DocumentRatingResponse.builder()
                .documentId(documentId)
                .ratingAvg(doc.getRatingAvg() != null ? doc.getRatingAvg() : (double) stars)
                .ratingCount(doc.getRatingCount() != null ? doc.getRatingCount() : 1)
                .userRating(stars)
                .userReview(reviewText)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentRatingResponse getDocumentRatingSummary(UUID documentId, UUID currentUserId) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài liệu không tồn tại với ID: " + documentId));

        Integer userRating = null;
        String userReview = null;
        if (currentUserId != null && documentRatingRepository != null) {
            Optional<DocumentRating> existing = documentRatingRepository.findByUserIdAndDocumentId(currentUserId, documentId);
            if (existing.isPresent()) {
                userRating = existing.get().getRating();
                userReview = existing.get().getReview();
            }
        }

        return DocumentRatingResponse.builder()
                .documentId(documentId)
                .ratingAvg(doc.getRatingAvg() != null ? doc.getRatingAvg() : 0.0)
                .ratingCount(doc.getRatingCount() != null ? doc.getRatingCount() : 0)
                .userRating(userRating)
                .userReview(userReview)
                .build();
    }

    @Override
    public boolean toggleBookmark(UUID documentId, UUID userId, String collectionName) {
        if (!documentRepository.existsById(documentId)) {
            throw new ResourceNotFoundException("Tài liệu không tồn tại với ID: " + documentId);
        }
        Optional<DocumentBookmark> existing = documentBookmarkRepository.findByUserIdAndDocumentId(userId, documentId);
        if (existing.isPresent()) {
            documentBookmarkRepository.delete(existing.get());
            documentRepository.updateBookmarkCount(documentId, -1);
            return false;
        } else {
            DocumentBookmark bookmark = DocumentBookmark.builder()
                    .userId(userId)
                    .documentId(documentId)
                    .collectionName(collectionName != null ? collectionName : "Mặc định")
                    .build();
            documentBookmarkRepository.save(bookmark);
            documentRepository.updateBookmarkCount(documentId, 1);
            documentEventProducer.sendDocumentInteracted(DocumentInteractedEvent.builder()
                    .documentId(documentId)
                    .actorUserId(userId)
                    .interactionType("BOOKMARK")
                    .build());

            documentRepository.findById(documentId).ifPresent(doc -> {
                if (doc.getUserId() != null && !doc.getUserId().equals(userId)) {
                    String bmIdempKey = "bookmark-" + documentId + "-" + userId;
                    documentEventProducer.sendReputationEvent(doc.getUserId(), "RECEIVE_BOOKMARK", documentId.toString(), bmIdempKey);
                    userServiceClient.recordReputationEvent(doc.getUserId(), "RECEIVE_BOOKMARK", documentId.toString(), bmIdempKey);
                    String actorName = resolveActorDisplayName(userServiceClient.getAuthorSummary(userId));
                    notificationService.createNotification(
                            doc.getUserId(),
                            userId,
                            documentId,
                            "DOCUMENT_BOOKMARKED",
                            "Tài liệu của bạn vừa được lưu",
                            actorName + " đã lưu tài liệu \"" + doc.getTitle() + "\" vào thư viện cá nhân (+5 điểm uy tín)."
                    );
                }
            });
            return true;
        }
    }

    @Override
    public void removeBookmark(UUID documentId, UUID userId) {
        Optional<DocumentBookmark> existing = documentBookmarkRepository.findByUserIdAndDocumentId(userId, documentId);
        if (existing.isPresent()) {
            documentBookmarkRepository.delete(existing.get());
            documentRepository.updateBookmarkCount(documentId, -1);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<DocumentFeedResponse> getMyBookmarks(UUID userId, Pageable pageable) {
        Page<DocumentBookmark> bookmarks = documentBookmarkRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        List<UUID> docIds = bookmarks.getContent().stream().map(DocumentBookmark::getDocumentId).collect(Collectors.toList());
        List<Document> docs = documentRepository.findByIdIn(docIds);
        Map<UUID, Document> docMap = docs.stream().collect(Collectors.toMap(Document::getId, d -> d, (k1, k2) -> k1));

        List<UUID> authorIds = docs.stream().map(Document::getUserId).collect(Collectors.toList());
        Map<UUID, AuthorSummaryDto> authors = userServiceClient.getAuthorsBatch(authorIds);

        List<DocumentFeedResponse> responses = bookmarks.getContent().stream().map(b -> {
            Document d = docMap.get(b.getDocumentId());
            if (d == null) return null;
            return DocumentFeedResponse.builder()
                    .id(d.getId())
                    .title(d.getTitle())
                    .description(d.getDescription())
                    .docType(d.getDocType())
                    .academicYear(d.getAcademicYear())
                    .semester(d.getSemester())
                    .thumbnailUrl(d.getThumbnailUrl())
                    .totalPages(d.getTotalPages())
                    .freePages(d.getFreePages())
                    .isBlurLocked(d.getIsBlurLocked())
                    .unlockPointsRequired(d.getUnlockPointsRequired())
                    .likeCount(d.getLikeCount())
                    .commentCount(d.getCommentCount())
                    .viewCount(d.getViewCount())
                    .bookmarkCount(d.getBookmarkCount())
                    .universityName(d.getUniversity() != null ? d.getUniversity().getName() : null)
                    .courseName(d.getCourse() != null ? d.getCourse().getName() : null)
                    .author(authors.getOrDefault(d.getUserId(), AuthorSummaryDto.anonymous()))
                    .hasLiked(documentLikeRepository.existsByUserIdAndDocumentId(userId, d.getId()))
                    .hasBookmarked(true)
                    .hasUnlocked(userUnlockedDocumentRepository.existsByUserIdAndDocumentId(userId, d.getId()))
                    .createdAt(d.getCreatedAt())
                    .build();
        }).filter(Objects::nonNull).collect(Collectors.toList());

        return PageResponse.<DocumentFeedResponse>builder()
                .content(responses)
                .pageNumber(bookmarks.getNumber())
                .pageSize(bookmarks.getSize())
                .totalElements(bookmarks.getTotalElements())
                .totalPages(bookmarks.getTotalPages())
                .last(bookmarks.isLast())
                .build();
    }

    @Override
    public boolean unlockDocument(UUID documentId, UUID userId, UnlockDocumentRequest request) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài liệu không tồn tại với ID: " + documentId));

        if (document.getUserId().equals(userId)) {
            return true; // Author automatically has access
        }

        if (userUnlockedDocumentRepository.existsByUserIdAndDocumentId(userId, documentId)) {
            return true; // Idempotent unlock
        }

        int pointsRequired = document.getUnlockPointsRequired() != null ? Math.max(0, document.getUnlockPointsRequired()) : 10;
        UUID idempotencyKey = (request != null && request.getIdempotencyKey() != null) ? request.getIdempotencyKey() : UUID.randomUUID();

        // Đặt chỗ (reserve) bản ghi unlock TRƯỚC khi trừ điểm: unique constraint
        // uq_user_unlocked_doc chặn hai request đồng thời cùng đi tiếp; nếu trừ điểm
        // thất bại thì TX rollback và bản ghi đặt chỗ bị hủy.
        UserUnlockedDocument unlockRecord = UserUnlockedDocument.builder()
                .userId(userId)
                .documentId(documentId)
                .unlockType(request != null && request.getUnlockType() != null ? request.getUnlockType() : "POINTS")
                .pointsSpent(pointsRequired)
                .idempotencyKey(idempotencyKey.toString())
                .build();
        try {
            userUnlockedDocumentRepository.saveAndFlush(unlockRecord);
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            // Request unlock song song đã hoàn tất — coi như đã mở khóa
            return true;
        }

        if (pointsRequired > 0) {
            userServiceClient.deductPoints(userId, pointsRequired, idempotencyKey);
        }

        documentEventProducer.sendDocumentInteracted(DocumentInteractedEvent.builder()
                .documentId(documentId)
                .actorUserId(userId)
                .interactionType("UNLOCK")
                .build());

        String actorName = resolveActorDisplayName(userServiceClient.getAuthorSummary(userId));
        notificationService.createNotification(
                document.getUserId(), userId, documentId,
                "DOCUMENT_UNLOCKED",
                "Tài liệu của bạn vừa được mở khóa",
                actorName + " đã dùng điểm để mở khóa tài liệu \"" + document.getTitle() + "\" của bạn.");

        return true;
    }

    @Override
    @Transactional(readOnly = true)
    public UnlockStatusResponse checkUnlockStatus(UUID documentId, UUID userId) {
        if (userId == null) {
            return UnlockStatusResponse.builder()
                    .documentId(documentId)
                    .unlocked(false)
                    .reason("Chưa đăng nhập")
                    .build();
        }
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài liệu không tồn tại với ID: " + documentId));

        if (doc.getUserId().equals(userId)) {
            return UnlockStatusResponse.builder()
                    .documentId(documentId)
                    .unlocked(true)
                    .reason("Tác giả sở hữu tài liệu")
                    .build();
        }

        boolean exists = userUnlockedDocumentRepository.existsByUserIdAndDocumentId(userId, documentId);
        int userBalance = userServiceClient.getBalance(userId);
        return UnlockStatusResponse.builder()
                .unlockPointsRequired(doc.getUnlockPointsRequired() != null ? doc.getUnlockPointsRequired() : 0)
                .userBalance(userBalance)
                .documentId(documentId)
                .unlocked(exists)
                .reason(exists ? "Đã mở khóa bằng điểm" : "Chưa mở khóa")
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<DocumentFeedResponse> getMyUnlockedDocuments(UUID userId, Pageable pageable) {
        Page<UserUnlockedDocument> page = userUnlockedDocumentRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        List<UUID> docIds = page.getContent().stream().map(UserUnlockedDocument::getDocumentId).toList();
        List<Document> docs = documentRepository.findByIdIn(docIds);
        Map<UUID, Document> docMap = docs.stream().collect(Collectors.toMap(Document::getId, d -> d, (k1, k2) -> k1));

        List<UUID> authorIds = docs.stream().map(Document::getUserId).toList();
        Map<UUID, AuthorSummaryDto> authors = userServiceClient.getAuthorsBatch(authorIds);

        List<DocumentFeedResponse> responses = page.getContent().stream().map(u -> {
            Document d = docMap.get(u.getDocumentId());
            if (d == null) return null;
            return DocumentFeedResponse.builder()
                    .id(d.getId())
                    .title(d.getTitle())
                    .description(d.getDescription())
                    .docType(d.getDocType())
                    .academicYear(d.getAcademicYear())
                    .semester(d.getSemester())
                    .thumbnailUrl(d.getThumbnailUrl())
                    .totalPages(d.getTotalPages())
                    .freePages(d.getFreePages())
                    .isBlurLocked(d.getIsBlurLocked())
                    .unlockPointsRequired(d.getUnlockPointsRequired())
                    .likeCount(d.getLikeCount())
                    .commentCount(d.getCommentCount())
                    .viewCount(d.getViewCount())
                    .bookmarkCount(d.getBookmarkCount())
                    .universityName(d.getUniversity() != null ? d.getUniversity().getName() : null)
                    .courseName(d.getCourse() != null ? d.getCourse().getName() : null)
                    .author(authors.getOrDefault(d.getUserId(), AuthorSummaryDto.anonymous()))
                    .hasLiked(documentLikeRepository.existsByUserIdAndDocumentId(userId, d.getId()))
                    .hasBookmarked(documentBookmarkRepository.existsByUserIdAndDocumentId(userId, d.getId()))
                    .hasUnlocked(true)
                    .createdAt(d.getCreatedAt())
                    .build();
        }).filter(Objects::nonNull).toList();

        return PageResponse.<DocumentFeedResponse>builder()
                .content(responses)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    @Override
    public void reportDocument(UUID documentId, UUID userId, ReportDocumentRequest request) {
        if (!documentRepository.existsById(documentId)) {
            throw new ResourceNotFoundException("Tài liệu không tồn tại với ID: " + documentId);
        }
        if (request.getReason() == null || request.getReason().trim().isEmpty()) {
            throw new BadRequestException("Lý do báo cáo không được để trống");
        }

        DocumentReport report = DocumentReport.builder()
                .reporterUserId(userId)
                .documentId(documentId)
                .reason(request.getReason().trim())
                .description(request.getDescription())
                .status("PENDING")
                .build();
        documentReportRepository.save(report);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentReport> getAdminReports() {
        return documentReportRepository.findAllByOrderByCreatedAtDesc();
    }

    @Override
    public void moderateDocument(UUID documentId, String status, String reason) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài liệu không tồn tại với ID: " + documentId));

        // Chỉ nhận quyết định hợp lệ — trước đây mọi chuỗi đều được chấp nhận
        String normalized = status == null ? "" : status.trim().toUpperCase();
        if (!normalized.equals("PUBLISHED") && !normalized.equals("REJECTED") && !normalized.equals("PENDING")) {
            throw new BadRequestException("Trạng thái kiểm duyệt không hợp lệ: " + status);
        }

        doc.setStatus(normalized);
        documentRepository.save(doc);

        // Chỉ resolve các report còn PENDING của tài liệu này
        List<DocumentReport> reports = documentReportRepository.findByDocumentId(documentId).stream()
                .filter(r -> "PENDING".equalsIgnoreCase(r.getStatus()))
                .toList();
        if (!reports.isEmpty()) {
            UUID adminId = SecurityContextHolder.getUserId();
            OffsetDateTime now = OffsetDateTime.now();
            for (DocumentReport r : reports) {
                r.setStatus("RESOLVED");
                r.setResolvedByAdminId(adminId);
                r.setResolvedAt(now);
            }
            documentReportRepository.saveAll(reports);
        }

        // Thông báo cho chủ sở hữu về quyết định kèm lý do
        String notifType = "PUBLISHED".equals(normalized) ? "DOCUMENT_APPROVED" : "MODERATION";
        String notifTitle = "PUBLISHED".equals(normalized)
                ? "Tài liệu \"" + doc.getTitle() + "\" đã được phê duyệt"
                : "Tài liệu \"" + doc.getTitle() + "\" đã được kiểm duyệt";
        notificationService.createNotification(
                doc.getUserId(), adminIdOrNull(), documentId,
                notifType,
                notifTitle,
                "Trạng thái mới: " + normalized + (reason != null && !reason.isBlank() ? ". Lý do: " + reason : ""));
    }

    private UUID adminIdOrNull() {
        return SecurityContextHolder.getUserId();
    }

    private String resolveActorDisplayName(AuthorSummaryDto actor) {
        if (actor == null) {
            return "Một học giả";
        }
        if (actor.getFullName() != null && !actor.getFullName().isBlank()
                && !"Người dùng ẩn danh".equalsIgnoreCase(actor.getFullName())) {
            return actor.getFullName().trim();
        }
        return "Một học giả";
    }

    private String truncateSnippet(String text, int maxLen) {
        if (text == null) {
            return "";
        }
        String trimmed = text.trim();
        if (trimmed.length() <= maxLen) {
            return trimmed;
        }
        return trimmed.substring(0, maxLen) + "...";
    }
}
