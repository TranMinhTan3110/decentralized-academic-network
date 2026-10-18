package com.network.document_service.service.impl;

import com.network.document_service.client.IpfsStorageService;
import com.network.document_service.client.PdfProcessingService;
import com.network.document_service.client.UserServiceClient;
import com.network.document_service.dto.request.DocumentUpdateRequest;
import com.network.document_service.dto.request.DocumentUploadRequest;
import com.network.document_service.dto.response.DocumentPreviewResponse;
import com.network.document_service.dto.response.*;
import com.network.document_service.entity.*;
import com.network.document_service.event.DocumentEventProducer;
import com.network.document_service.event.DocumentInteractedEvent;
import com.network.document_service.event.DocumentUploadedEvent;
import com.network.document_service.exception.BadRequestException;
import com.network.document_service.exception.ForbiddenException;
import com.network.document_service.exception.ResourceNotFoundException;
import com.network.document_service.repository.*;
import com.network.document_service.service.DocumentService;
import jakarta.persistence.criteria.Predicate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class DocumentServiceImpl implements DocumentService {

    private static final Logger log = LoggerFactory.getLogger(DocumentServiceImpl.class);

    private final DocumentRepository documentRepository;
    private final UniversityRepository universityRepository;
    private final CourseRepository courseRepository;
    private final DocumentLikeRepository documentLikeRepository;
    private final DocumentBookmarkRepository documentBookmarkRepository;
    private final UserUnlockedDocumentRepository userUnlockedDocumentRepository;
    private final PdfProcessingService pdfProcessingService;
    private final IpfsStorageService ipfsStorageService;
    private final UserServiceClient userServiceClient;
    private final DocumentEventProducer documentEventProducer;

    public DocumentServiceImpl(DocumentRepository documentRepository,
                               UniversityRepository universityRepository,
                               CourseRepository courseRepository,
                               DocumentLikeRepository documentLikeRepository,
                               DocumentBookmarkRepository documentBookmarkRepository,
                               UserUnlockedDocumentRepository userUnlockedDocumentRepository,
                               PdfProcessingService pdfProcessingService,
                               IpfsStorageService ipfsStorageService,
                               UserServiceClient userServiceClient,
                               DocumentEventProducer documentEventProducer) {
        this.documentRepository = documentRepository;
        this.universityRepository = universityRepository;
        this.courseRepository = courseRepository;
        this.documentLikeRepository = documentLikeRepository;
        this.documentBookmarkRepository = documentBookmarkRepository;
        this.userUnlockedDocumentRepository = userUnlockedDocumentRepository;
        this.pdfProcessingService = pdfProcessingService;
        this.ipfsStorageService = ipfsStorageService;
        this.userServiceClient = userServiceClient;
        this.documentEventProducer = documentEventProducer;
    }

    @Override
    public DocumentDetailResponse uploadDocument(UUID userId, DocumentUploadRequest request) {
        MultipartFile file = request.getFile();
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File PDF không được để trống");
        }

        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (IOException e) {
            throw new BadRequestException("Không thể đọc nội dung file tải lên");
        }

        // Validate PDF signature %PDF-
        if (fileBytes.length < 5 || fileBytes[0] != '%' || fileBytes[1] != 'P' || fileBytes[2] != 'D' || fileBytes[3] != 'F' || fileBytes[4] != '-') {
            throw new BadRequestException("Tệp tải lên không phải là định dạng PDF hợp lệ (thiếu chữ ký %PDF-)");
        }

        int totalPages = 1;
        try {
            totalPages = pdfProcessingService.extractTotalPages(fileBytes);
        } catch (Exception ex) {
            log.warn("Could not extract pages via PDFBox, fallback to 1: {}", ex.getMessage());
        }

        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document.pdf";
        Resource fileResource = new ByteArrayResource(fileBytes) {
            @Override
            public String getFilename() {
                return filename;
            }
        };

        // 1. Upload original to Hybrid IPFS
        IpfsUploadResult mainUpload = ipfsStorageService.uploadFile(fileResource, filename);

        // 2. Extract 3 preview pages and upload preview
        String previewCid = mainUpload.getCid();
        try {
            byte[] previewBytes = pdfProcessingService.generatePreviewPdf(fileBytes, 3);
            if (previewBytes != null && previewBytes.length > 0) {
                IpfsUploadResult previewUpload = ipfsStorageService.uploadBytes(previewBytes, "preview_" + filename);
                if (previewUpload != null && previewUpload.getCid() != null) {
                    previewCid = previewUpload.getCid();
                }
            }
        } catch (Exception ex) {
            log.warn("Could not generate 3-page preview, fallback to full CID: {}", ex.getMessage());
        }

        // 3. Generate thumbnail PNG
        String thumbnailUrl = null;
        try {
            byte[] thumbnailPng = pdfProcessingService.generateThumbnailPng(fileBytes);
            if (thumbnailPng != null && thumbnailPng.length > 0) {
                IpfsUploadResult thumbUpload = ipfsStorageService.uploadBytes(thumbnailPng, "thumb_" + filename + ".png");
                if (thumbUpload != null) {
                    thumbnailUrl = thumbUpload.getGatewayUrl();
                }
            }
        } catch (Exception ex) {
            log.warn("Could not generate thumbnail PNG: {}", ex.getMessage());
        }

        University university = null;
        if (request.getUniversityId() != null) {
            university = universityRepository.findById(request.getUniversityId()).orElse(null);
        }

        Course course = null;
        if (request.getCourseId() != null) {
            course = courseRepository.findById(request.getCourseId()).orElse(null);
        }

        int unlockPoints = request.getUnlockPointsRequired() != null ? request.getUnlockPointsRequired() : 10;
        boolean isLocked = unlockPoints > 0;

        Document doc = Document.builder()
                .userId(userId)
                .university(university)
                .course(course)
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .caption(request.getCaption())
                .docType(request.getDocType() != null ? request.getDocType() : "SLIDE")
                .academicYear(request.getAcademicYear() != null ? request.getAcademicYear() : "2025")
                .semester(request.getSemester())
                .ipfsCid(mainUpload.getCid())
                .previewIpfsCid(previewCid)
                .fileSizeBytes((long) fileBytes.length)
                .fileExtension("pdf")
                .thumbnailUrl(thumbnailUrl)
                .totalPages(totalPages)
                .freePages(Math.min(3, totalPages))
                .isBlurLocked(isLocked)
                .unlockPointsRequired(unlockPoints)
                .status("PUBLISHED")
                .isPinnedLocal(mainUpload.isPinnedLocal())
                .isPinnedRemote(mainUpload.isPinnedRemote())
                .fileUrl(mainUpload.getGatewayUrl())
                .build();

        Document saved = documentRepository.save(doc);

        // Send Kafka event
        documentEventProducer.sendDocumentUploaded(DocumentUploadedEvent.builder()
                .documentId(saved.getId())
                .userId(userId)
                .title(saved.getTitle())
                .ipfsCid(saved.getIpfsCid())
                .previewIpfsCid(saved.getPreviewIpfsCid())
                .totalPages(saved.getTotalPages())
                .universityId(university != null ? university.getId() : null)
                .courseId(course != null ? course.getId() : null)
                .build());

        AuthorSummaryDto author = userServiceClient.getAuthorSummary(userId);

        return mapToDetail(saved, author, false, false, true, true);
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentDetailResponse getDocumentDetail(UUID id, UUID currentUserId) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tài liệu không tồn tại với ID: " + id));

        boolean isAuthor = currentUserId != null && currentUserId.equals(doc.getUserId());
        boolean hasUnlocked = isAuthor || (currentUserId != null && userUnlockedDocumentRepository.existsByUserIdAndDocumentId(currentUserId, id));
        boolean hasLiked = currentUserId != null && documentLikeRepository.existsByUserIdAndDocumentId(currentUserId, id);
        boolean hasBookmarked = currentUserId != null && documentBookmarkRepository.existsByUserIdAndDocumentId(currentUserId, id);

        AuthorSummaryDto author = userServiceClient.getAuthorSummary(doc.getUserId());

        // Anti-bypass Freemium: If not unlocked and locked, mask full ipfsCid
        return mapToDetail(doc, author, hasLiked, hasBookmarked, hasUnlocked, isAuthor);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<DocumentFeedResponse> getDocumentsFeed(
            String filter,
            UUID universityId,
            UUID courseId,
            String academicYear,
            UUID currentUserId,
            Pageable pageable) {

        Specification<Document> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("status"), "PUBLISHED"));

            if (universityId != null) {
                predicates.add(cb.equal(root.get("university").get("id"), universityId));
            }
            if (courseId != null) {
                predicates.add(cb.equal(root.get("course").get("id"), courseId));
            }
            if (academicYear != null && !academicYear.isBlank()) {
                predicates.add(cb.equal(root.get("academicYear"), academicYear.trim()));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        // Handle sorting filters
        Pageable effectivePageable = pageable;
        if ("trending".equalsIgnoreCase(filter) || "top-rated".equalsIgnoreCase(filter)) {
            effectivePageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                    Sort.by(Sort.Direction.DESC, "likeCount", "viewCount"));
        } else {
            effectivePageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                    Sort.by(Sort.Direction.DESC, "createdAt"));
        }

        Page<Document> page = documentRepository.findAll(spec, effectivePageable);
        List<UUID> authorIds = page.getContent().stream().map(Document::getUserId).collect(Collectors.toList());
        Map<UUID, AuthorSummaryDto> authors = userServiceClient.getAuthorsBatch(authorIds);

        List<DocumentFeedResponse> content = page.getContent().stream().map(doc -> {
            boolean hasLiked = currentUserId != null && documentLikeRepository.existsByUserIdAndDocumentId(currentUserId, doc.getId());
            boolean hasBookmarked = currentUserId != null && documentBookmarkRepository.existsByUserIdAndDocumentId(currentUserId, doc.getId());
            boolean hasUnlocked = (currentUserId != null && currentUserId.equals(doc.getUserId())) ||
                    (currentUserId != null && userUnlockedDocumentRepository.existsByUserIdAndDocumentId(currentUserId, doc.getId()));

            return DocumentFeedResponse.builder()
                    .id(doc.getId())
                    .title(doc.getTitle())
                    .description(doc.getDescription())
                    .docType(doc.getDocType())
                    .academicYear(doc.getAcademicYear())
                    .semester(doc.getSemester())
                    .thumbnailUrl(doc.getThumbnailUrl())
                    .totalPages(doc.getTotalPages())
                    .freePages(doc.getFreePages())
                    .isBlurLocked(doc.getIsBlurLocked())
                    .unlockPointsRequired(doc.getUnlockPointsRequired())
                    .likeCount(doc.getLikeCount())
                    .commentCount(doc.getCommentCount())
                    .viewCount(doc.getViewCount())
                    .bookmarkCount(doc.getBookmarkCount())
                    .universityName(doc.getUniversity() != null ? doc.getUniversity().getName() : null)
                    .courseName(doc.getCourse() != null ? doc.getCourse().getName() : null)
                    .author(authors.getOrDefault(doc.getUserId(), AuthorSummaryDto.anonymous()))
                    .hasLiked(hasLiked)
                    .hasBookmarked(hasBookmarked)
                    .hasUnlocked(hasUnlocked)
                    .createdAt(doc.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());

        return PageResponse.<DocumentFeedResponse>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    @Override
    public void recordView(UUID documentId, UUID currentUserId) {
        if (!documentRepository.existsById(documentId)) {
            throw new ResourceNotFoundException("Tài liệu không tồn tại với ID: " + documentId);
        }
        documentRepository.incrementViewCount(documentId);
        documentEventProducer.sendDocumentInteracted(DocumentInteractedEvent.builder()
                .documentId(documentId)
                .actorUserId(currentUserId)
                .interactionType("VIEW")
                .build());
    }

    @Override
    public void deleteDocument(UUID documentId, UUID currentUserId) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài liệu không tồn tại với ID: " + documentId));

        if (!doc.getUserId().equals(currentUserId)) {
            throw new ForbiddenException("Bạn không có quyền xóa tài liệu của người khác");
        }
        documentRepository.delete(doc);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<DocumentFeedResponse> searchDocuments(String query, UUID currentUserId, Pageable pageable) {
        Page<Document> page = documentRepository.searchByKeyword(query != null ? query.trim() : "", pageable);
        return mapPageToFeedResponse(page, currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentFeedResponse> getTrendingDocuments(int limit, UUID currentUserId) {
        Pageable pageable = PageRequest.of(0, Math.min(limit, 20));
        List<Document> list = documentRepository.findTrendingDocuments(pageable);
        List<UUID> authorIds = list.stream().map(Document::getUserId).collect(Collectors.toList());
        Map<UUID, AuthorSummaryDto> authors = userServiceClient.getAuthorsBatch(authorIds);

        return list.stream().map(doc -> {
            boolean hasLiked = currentUserId != null && documentLikeRepository.existsByUserIdAndDocumentId(currentUserId, doc.getId());
            boolean hasBookmarked = currentUserId != null && documentBookmarkRepository.existsByUserIdAndDocumentId(currentUserId, doc.getId());
            boolean hasUnlocked = (currentUserId != null && currentUserId.equals(doc.getUserId())) ||
                    (currentUserId != null && userUnlockedDocumentRepository.existsByUserIdAndDocumentId(currentUserId, doc.getId()));

            return DocumentFeedResponse.builder()
                    .id(doc.getId())
                    .title(doc.getTitle())
                    .description(doc.getDescription())
                    .docType(doc.getDocType())
                    .academicYear(doc.getAcademicYear())
                    .semester(doc.getSemester())
                    .thumbnailUrl(doc.getThumbnailUrl())
                    .totalPages(doc.getTotalPages())
                    .freePages(doc.getFreePages())
                    .isBlurLocked(doc.getIsBlurLocked())
                    .unlockPointsRequired(doc.getUnlockPointsRequired())
                    .likeCount(doc.getLikeCount())
                    .commentCount(doc.getCommentCount())
                    .viewCount(doc.getViewCount())
                    .bookmarkCount(doc.getBookmarkCount())
                    .universityName(doc.getUniversity() != null ? doc.getUniversity().getName() : null)
                    .courseName(doc.getCourse() != null ? doc.getCourse().getName() : null)
                    .author(authors.getOrDefault(doc.getUserId(), AuthorSummaryDto.anonymous()))
                    .hasLiked(hasLiked)
                    .hasBookmarked(hasBookmarked)
                    .hasUnlocked(hasUnlocked)
                    .createdAt(doc.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    public DocumentDetailResponse updateDocument(UUID documentId, UUID currentUserId, DocumentUpdateRequest request) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài liệu không tồn tại với ID: " + documentId));

        if (!doc.getUserId().equals(currentUserId)) {
            throw new ForbiddenException("Bạn không có quyền chỉnh sửa tài liệu của người khác");
        }

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            doc.setTitle(request.getTitle().trim());
        }
        if (request.getDescription() != null) {
            doc.setDescription(request.getDescription().trim());
        }
        if (request.getCaption() != null) {
            doc.setCaption(request.getCaption().trim());
        }
        if (request.getDocType() != null && !request.getDocType().isBlank()) {
            doc.setDocType(request.getDocType().trim());
        }
        if (request.getAcademicYear() != null) {
            doc.setAcademicYear(request.getAcademicYear());
        }
        if (request.getSemester() != null) {
            doc.setSemester(request.getSemester());
        }
        if (request.getCourseId() != null) {
            Course course = courseRepository.findById(request.getCourseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Môn học không tồn tại với ID: " + request.getCourseId()));
            doc.setCourse(course);
        }

        Document saved = documentRepository.save(doc);
        Document updated = saved != null ? saved : doc;
        AuthorSummaryDto author = userServiceClient.getAuthorSummary(updated.getUserId());
        return mapToDetail(updated, author, false, false, true, true);
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentPreviewResponse getDocumentPreview(UUID documentId) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài liệu không tồn tại với ID: " + documentId));

        int freePages = doc.getFreePages() != null ? doc.getFreePages() : 3;
        int totalPages = doc.getTotalPages() != null ? doc.getTotalPages() : 1;

        List<String> previewPages = new ArrayList<>();
        if (doc.getThumbnailUrl() != null && !doc.getThumbnailUrl().isBlank()) {
            previewPages.add(doc.getThumbnailUrl());
        }

        return DocumentPreviewResponse.builder()
                .documentId(doc.getId())
                .title(doc.getTitle())
                .freePages(freePages)
                .totalPages(totalPages)
                .isBlurLocked(Boolean.TRUE.equals(doc.getIsBlurLocked()))
                .thumbnailUrl(doc.getThumbnailUrl())
                .previewIpfsCid(doc.getPreviewIpfsCid())
                .previewPages(previewPages)
                .build();
    }

    private PageResponse<DocumentFeedResponse> mapPageToFeedResponse(Page<Document> page, UUID currentUserId) {
        List<UUID> authorIds = page.getContent().stream().map(Document::getUserId).collect(Collectors.toList());
        Map<UUID, AuthorSummaryDto> authors = userServiceClient.getAuthorsBatch(authorIds);

        List<DocumentFeedResponse> content = page.getContent().stream().map(doc -> {
            boolean hasLiked = currentUserId != null && documentLikeRepository.existsByUserIdAndDocumentId(currentUserId, doc.getId());
            boolean hasBookmarked = currentUserId != null && documentBookmarkRepository.existsByUserIdAndDocumentId(currentUserId, doc.getId());
            boolean hasUnlocked = (currentUserId != null && currentUserId.equals(doc.getUserId())) ||
                    (currentUserId != null && userUnlockedDocumentRepository.existsByUserIdAndDocumentId(currentUserId, doc.getId()));

            return DocumentFeedResponse.builder()
                    .id(doc.getId())
                    .title(doc.getTitle())
                    .description(doc.getDescription())
                    .docType(doc.getDocType())
                    .academicYear(doc.getAcademicYear())
                    .semester(doc.getSemester())
                    .thumbnailUrl(doc.getThumbnailUrl())
                    .totalPages(doc.getTotalPages())
                    .freePages(doc.getFreePages())
                    .isBlurLocked(doc.getIsBlurLocked())
                    .unlockPointsRequired(doc.getUnlockPointsRequired())
                    .likeCount(doc.getLikeCount())
                    .commentCount(doc.getCommentCount())
                    .viewCount(doc.getViewCount())
                    .bookmarkCount(doc.getBookmarkCount())
                    .universityName(doc.getUniversity() != null ? doc.getUniversity().getName() : null)
                    .courseName(doc.getCourse() != null ? doc.getCourse().getName() : null)
                    .author(authors.getOrDefault(doc.getUserId(), AuthorSummaryDto.anonymous()))
                    .hasLiked(hasLiked)
                    .hasBookmarked(hasBookmarked)
                    .hasUnlocked(hasUnlocked)
                    .createdAt(doc.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());

        return PageResponse.<DocumentFeedResponse>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    private DocumentDetailResponse mapToDetail(Document doc, AuthorSummaryDto author,
                                               boolean hasLiked, boolean hasBookmarked,
                                               boolean hasUnlocked, boolean isAuthor) {
        // Anti-bypass Freemium: mask full ipfsCid if locked and not author and not unlocked
        boolean canViewFull = hasUnlocked || isAuthor || !Boolean.TRUE.equals(doc.getIsBlurLocked());
        String effectiveIpfsCid = canViewFull ? doc.getIpfsCid() : null;

        return DocumentDetailResponse.builder()
                .id(doc.getId())
                .title(doc.getTitle())
                .description(doc.getDescription())
                .caption(doc.getCaption())
                .docType(doc.getDocType())
                .academicYear(doc.getAcademicYear())
                .semester(doc.getSemester())
                .ipfsCid(effectiveIpfsCid)
                .previewIpfsCid(doc.getPreviewIpfsCid())
                .fileUrl(canViewFull ? doc.getFileUrl() : null)
                .fileSizeBytes(doc.getFileSizeBytes())
                .fileExtension(doc.getFileExtension())
                .thumbnailUrl(doc.getThumbnailUrl())
                .totalPages(doc.getTotalPages())
                .freePages(doc.getFreePages())
                .isBlurLocked(doc.getIsBlurLocked())
                .unlockPointsRequired(doc.getUnlockPointsRequired())
                .status(doc.getStatus())
                .likeCount(doc.getLikeCount())
                .commentCount(doc.getCommentCount())
                .viewCount(doc.getViewCount())
                .downloadCount(doc.getDownloadCount())
                .bookmarkCount(doc.getBookmarkCount())
                .universityId(doc.getUniversity() != null ? doc.getUniversity().getId() : null)
                .universityName(doc.getUniversity() != null ? doc.getUniversity().getName() : null)
                .courseId(doc.getCourse() != null ? doc.getCourse().getId() : null)
                .courseName(doc.getCourse() != null ? doc.getCourse().getName() : null)
                .author(author)
                .hasLiked(hasLiked)
                .hasBookmarked(hasBookmarked)
                .hasUnlocked(canViewFull)
                .createdAt(doc.getCreatedAt())
                .updatedAt(doc.getUpdatedAt())
                .build();
    }
}
