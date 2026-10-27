package com.network.document_service.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import com.network.document_service.exception.UnauthorizedException;
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

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "pdf", "docx", "xlsx", "pptx", "csv", "txt", "png", "jpg", "jpeg", "webp"
    );
    private static final Set<String> IMAGE_EXTENSIONS = Set.of(
            "png", "jpg", "jpeg", "webp"
    );
    private static final Set<String> OFFICE_EXTENSIONS = Set.of(
            "docx", "xlsx", "pptx"
    );
    private static final int MAX_FILES_PER_UPLOAD = 5;
    private static final long MAX_TOTAL_BYTES = 50L * 1024 * 1024;

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
    private final DocumentViewRepository documentViewRepository;
    private final org.springframework.web.reactive.function.client.WebClient.Builder webClientBuilder;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private DocumentCommentRepository documentCommentRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public DocumentServiceImpl(DocumentRepository documentRepository,
                               UniversityRepository universityRepository,
                               CourseRepository courseRepository,
                               DocumentLikeRepository documentLikeRepository,
                               DocumentBookmarkRepository documentBookmarkRepository,
                               UserUnlockedDocumentRepository userUnlockedDocumentRepository,
                               PdfProcessingService pdfProcessingService,
                               IpfsStorageService ipfsStorageService,
                               UserServiceClient userServiceClient,
                               DocumentEventProducer documentEventProducer,
                               DocumentViewRepository documentViewRepository,
                               org.springframework.web.reactive.function.client.WebClient.Builder webClientBuilder) {
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
        this.documentViewRepository = documentViewRepository;
        this.webClientBuilder = webClientBuilder;
    }

    private String extractExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "pdf";
        }
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT).trim();
    }

    private void validateFileSignature(byte[] fileBytes, String filename, String ext) {
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new BadRequestException("Định dạng tệp '." + ext + "' không được hỗ trợ (" + filename + ")");
        }
        if (fileBytes == null || fileBytes.length < 4) {
            throw new BadRequestException("Tệp tải lên bị rỗng hoặc hư hỏng (" + filename + ")");
        }

        if ("pdf".equals(ext)) {
            if (fileBytes.length < 5 || fileBytes[0] != '%' || fileBytes[1] != 'P' || fileBytes[2] != 'D' || fileBytes[3] != 'F' || fileBytes[4] != '-') {
                throw new BadRequestException("Tệp tải lên không phải là định dạng PDF hợp lệ (thiếu chữ ký %PDF-)");
            }
        } else if (OFFICE_EXTENSIONS.contains(ext)) {
            if (fileBytes[0] != 'P' || fileBytes[1] != 'K' || fileBytes[2] != 0x03 || fileBytes[3] != 0x04) {
                throw new BadRequestException("Tệp ." + ext + " không đúng cấu trúc gói OpenXML chuẩn (" + filename + ")");
            }
        } else if ("png".equals(ext)) {
            if ((fileBytes[0] & 0xFF) != 0x89 || fileBytes[1] != 'P' || fileBytes[2] != 'N' || fileBytes[3] != 'G') {
                throw new BadRequestException("Tệp .png không chứa chữ ký ảnh PNG hợp lệ (" + filename + ")");
            }
        } else if ("jpg".equals(ext) || "jpeg".equals(ext)) {
            if ((fileBytes[0] & 0xFF) != 0xFF || (fileBytes[1] & 0xFF) != 0xD8 || (fileBytes[2] & 0xFF) != 0xFF) {
                throw new BadRequestException("Tệp ." + ext + " không chứa chữ ký ảnh JPEG hợp lệ (" + filename + ")");
            }
        } else if ("webp".equals(ext)) {
            if (fileBytes.length < 12 || fileBytes[0] != 'R' || fileBytes[1] != 'I' || fileBytes[2] != 'F' || fileBytes[3] != 'F'
                    || fileBytes[8] != 'W' || fileBytes[9] != 'E' || fileBytes[10] != 'B' || fileBytes[11] != 'P') {
                throw new BadRequestException("Tệp .webp không chứa chữ ký RIFF/WEBP hợp lệ (" + filename + ")");
            }
        } else if ("txt".equals(ext) || "csv".equals(ext)) {
            if (fileBytes.length < 10) {
                throw new BadRequestException("Tệp văn bản quá ngắn hoặc không chứa nội dung học thuật hợp lệ (" + filename + ")");
            }
        }
    }

    @Override
    public DocumentDetailResponse uploadDocument(UUID userId, DocumentUploadRequest request) {
        List<MultipartFile> uploadedFiles = new ArrayList<>();
        if (request.getFiles() != null && !request.getFiles().isEmpty()) {
            for (MultipartFile mf : request.getFiles()) {
                if (mf != null && !mf.isEmpty()) {
                    uploadedFiles.add(mf);
                }
            }
        }
        if (uploadedFiles.isEmpty() && request.getFile() != null && !request.getFile().isEmpty()) {
            uploadedFiles.add(request.getFile());
        }
        if (uploadedFiles.isEmpty()) {
            throw new BadRequestException("File PDF không được để trống");
        }
        if (uploadedFiles.size() > MAX_FILES_PER_UPLOAD) {
            throw new BadRequestException("Vượt quá giới hạn cho phép: Tối đa " + MAX_FILES_PER_UPLOAD + " tệp / lần đăng");
        }

        List<byte[]> allBytes = new ArrayList<>();
        List<String> allFilenames = new ArrayList<>();
        List<String> allExtensions = new ArrayList<>();
        long totalBytesCount = 0L;
        boolean allImages = true;

        for (MultipartFile mf : uploadedFiles) {
            byte[] bytes;
            try {
                bytes = mf.getBytes();
            } catch (IOException e) {
                throw new BadRequestException("Không thể đọc nội dung file tải lên");
            }
            String fname = mf.getOriginalFilename() != null ? mf.getOriginalFilename() : "document.pdf";
            String ext = extractExtension(fname);
            validateFileSignature(bytes, fname, ext);

            totalBytesCount += bytes.length;
            if (totalBytesCount > MAX_TOTAL_BYTES) {
                throw new BadRequestException("Tổng dung lượng các tệp vượt quá giới hạn 50 MB");
            }
            if (!IMAGE_EXTENSIONS.contains(ext)) {
                allImages = false;
            }
            allBytes.add(bytes);
            allFilenames.add(fname);
            allExtensions.add(ext);
        }

        int requestedFreePages = request.getFreePages() != null ? request.getFreePages() : 3;
        List<DocumentAttachmentDto> attachmentDtos = new ArrayList<>();
        IpfsUploadResult mainUpload;
        String previewCid;
        String thumbnailUrl = null;
        int totalPages = 1;
        int effectiveFreePages = 1;
        String finalExtension;
        long finalFileSizeBytes = totalBytesCount;

        if (allImages) {
            // Phương án B (Hybrid): Tất cả tệp tải lên là hình ảnh -> Tự động gộp thành 1 tệp PDF đa trang
            byte[] mergedPdfBytes;
            try {
                mergedPdfBytes = pdfProcessingService.mergeImagesToPdf(allBytes);
            } catch (Exception ex) {
                throw new BadRequestException("Không thể gộp các tệp hình ảnh thành PDF: " + ex.getMessage());
            }

            totalPages = Math.max(1, allBytes.size());
            effectiveFreePages = Math.max(1, Math.min(requestedFreePages, totalPages));
            String mergedFilename = request.getTitle() != null
                    ? request.getTitle().trim().replaceAll("[^\\p{L}\\p{N}._-]", "_") + ".pdf"
                    : "merged_images.pdf";
            finalExtension = "pdf";
            finalFileSizeBytes = mergedPdfBytes.length;

            Resource mergedResource = new ByteArrayResource(mergedPdfBytes) {
                @Override
                public String getFilename() {
                    return mergedFilename;
                }
            };
            mainUpload = ipfsStorageService.uploadFile(mergedResource, mergedFilename);
            previewCid = mainUpload.getCid();

            try {
                byte[] previewBytes = pdfProcessingService.generatePreviewPdf(mergedPdfBytes, effectiveFreePages);
                if (previewBytes != null && previewBytes.length > 0) {
                    IpfsUploadResult previewUpload = ipfsStorageService.uploadBytes(previewBytes, "preview_" + mergedFilename);
                    if (previewUpload != null && previewUpload.getCid() != null) {
                        previewCid = previewUpload.getCid();
                    }
                }
            } catch (Exception ex) {
                log.warn("Could not generate preview for merged image PDF: {}", ex.getMessage());
            }

            try {
                byte[] thumbnailPng = pdfProcessingService.generateThumbnailPng(mergedPdfBytes);
                if (thumbnailPng != null && thumbnailPng.length > 0) {
                    IpfsUploadResult thumbUpload = ipfsStorageService.uploadBytes(thumbnailPng, "thumb_" + mergedFilename + ".png");
                    if (thumbUpload != null) {
                        thumbnailUrl = thumbUpload.getGatewayUrl();
                    }
                }
            } catch (Exception ex) {
                log.warn("Could not generate thumbnail for merged image PDF: {}", ex.getMessage());
            }

            attachmentDtos.add(DocumentAttachmentDto.builder()
                    .fileName(mergedFilename)
                    .fileExtension("pdf")
                    .fileSizeBytes((long) mergedPdfBytes.length)
                    .ipfsCid(mainUpload.getCid())
                    .fileUrl(mainUpload.getGatewayUrl())
                    .build());
        } else {
            // Phương án A (Hybrid): Tệp đơn hoặc Đa tệp hỗn hợp (PDF, Word, Excel, PPT, CSV, TXT, Ảnh)
            IpfsUploadResult firstUpload = null;
            for (int i = 0; i < uploadedFiles.size(); i++) {
                byte[] fBytes = allBytes.get(i);
                String fName = allFilenames.get(i);
                String fExt = allExtensions.get(i);

                Resource fileResource = new ByteArrayResource(fBytes) {
                    @Override
                    public String getFilename() {
                        return fName;
                    }
                };
                IpfsUploadResult up = ipfsStorageService.uploadFile(fileResource, fName);
                if (i == 0) {
                    firstUpload = up;
                }
                if (up != null) {
                    attachmentDtos.add(DocumentAttachmentDto.builder()
                            .fileName(fName)
                            .fileExtension(fExt)
                            .fileSizeBytes((long) fBytes.length)
                            .ipfsCid(up.getCid())
                            .fileUrl(up.getGatewayUrl())
                            .build());
                }
            }

            mainUpload = firstUpload;
            byte[] primaryBytes = allBytes.get(0);
            String primaryFilename = allFilenames.get(0);
            finalExtension = allExtensions.get(0);
            previewCid = mainUpload != null ? mainUpload.getCid() : null;

            if ("pdf".equals(finalExtension)) {
                try {
                    totalPages = pdfProcessingService.extractTotalPages(primaryBytes);
                } catch (Exception ex) {
                    log.warn("Could not extract pages via PDFBox, fallback to 1: {}", ex.getMessage());
                }
                effectiveFreePages = Math.max(1, Math.min(requestedFreePages, Math.max(1, totalPages)));
                try {
                    byte[] previewBytes = pdfProcessingService.generatePreviewPdf(primaryBytes, effectiveFreePages);
                    if (previewBytes != null && previewBytes.length > 0) {
                        IpfsUploadResult previewUpload = ipfsStorageService.uploadBytes(previewBytes, "preview_" + primaryFilename);
                        if (previewUpload != null && previewUpload.getCid() != null) {
                            previewCid = previewUpload.getCid();
                        }
                    }
                } catch (Exception ex) {
                    log.warn("Could not generate {}-page preview, fallback to full CID: {}", effectiveFreePages, ex.getMessage());
                }
                try {
                    byte[] thumbnailPng = pdfProcessingService.generateThumbnailPng(primaryBytes);
                    if (thumbnailPng != null && thumbnailPng.length > 0) {
                        IpfsUploadResult thumbUpload = ipfsStorageService.uploadBytes(thumbnailPng, "thumb_" + primaryFilename + ".png");
                        if (thumbUpload != null) {
                            thumbnailUrl = thumbUpload.getGatewayUrl();
                        }
                    }
                } catch (Exception ex) {
                    log.warn("Could not generate thumbnail PNG: {}", ex.getMessage());
                }
            } else {
                // Tạo bản PDF xem trước & Thumbnail cho tệp Office (.docx, .xlsx, .pptx) hoặc Text (.csv, .txt)
                effectiveFreePages = Math.max(1, Math.min(requestedFreePages, 3));
                try {
                    byte[] previewPdfBytes = pdfProcessingService.generateOfficeOrTextPreviewPdf(
                            request.getTitle(), finalExtension, primaryBytes, effectiveFreePages
                    );
                    if (previewPdfBytes != null && previewPdfBytes.length > 0) {
                        totalPages = Math.max(1, pdfProcessingService.extractTotalPages(previewPdfBytes));
                        IpfsUploadResult previewUpload = ipfsStorageService.uploadBytes(
                                previewPdfBytes, "preview_" + primaryFilename + ".pdf"
                        );
                        if (previewUpload != null && previewUpload.getCid() != null) {
                            previewCid = previewUpload.getCid();
                        }
                        byte[] thumbnailPng = pdfProcessingService.generateThumbnailPng(previewPdfBytes);
                        if (thumbnailPng != null && thumbnailPng.length > 0) {
                            IpfsUploadResult thumbUpload = ipfsStorageService.uploadBytes(
                                    thumbnailPng, "thumb_" + primaryFilename + ".png"
                            );
                            if (thumbUpload != null) {
                                thumbnailUrl = thumbUpload.getGatewayUrl();
                            }
                        }
                    }
                } catch (Exception ex) {
                    log.warn("Could not generate Office/Text preview PDF for {}: {}", primaryFilename, ex.getMessage());
                }
            }
        }

        University university = resolveOrCreateUniversity(request.getUniversityId(), request.getUniversityName());
        Course course = resolveOrCreateCourse(request.getCourseId(), request.getCourseName());
        String normalizedAcademicYear = validateAndNormalizeAcademicYear(request.getAcademicYear());

        int unlockPoints = request.getUnlockPointsRequired() != null ? Math.max(0, request.getUnlockPointsRequired()) : 10;
        boolean isLocked = unlockPoints > 0;
        boolean blurLocked = request.getBlurLockEnabled() != null ? request.getBlurLockEnabled() : isLocked;

        String attachmentsJson = null;
        try {
            attachmentsJson = objectMapper.writeValueAsString(attachmentDtos);
        } catch (Exception ex) {
            log.warn("Could not serialize attachmentsJson: {}", ex.getMessage());
        }

        Document doc = Document.builder()
                .userId(userId)
                .university(university)
                .course(course)
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .caption(request.getCaption())
                .docType(request.getDocType() != null ? request.getDocType() : "SLIDE")
                .academicYear(normalizedAcademicYear)
                .semester(request.getSemester())
                .ipfsCid(mainUpload != null ? mainUpload.getCid() : "")
                .previewIpfsCid(previewCid)
                .fileSizeBytes(finalFileSizeBytes)
                .fileExtension(finalExtension)
                .thumbnailUrl(thumbnailUrl)
                .totalPages(totalPages)
                .freePages(effectiveFreePages)
                .isBlurLocked(blurLocked)
                .unlockPointsRequired(unlockPoints)
                .status("PUBLISHED")
                .isPinnedLocal(mainUpload != null && mainUpload.isPinnedLocal())
                .isPinnedRemote(mainUpload != null && mainUpload.isPinnedRemote())
                .fileUrl(mainUpload != null ? mainUpload.getGatewayUrl() : null)
                .attachmentsJson(attachmentsJson)
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

        if (!"PUBLISHED".equals(doc.getStatus()) && !isAuthor) {
            throw new ResourceNotFoundException("Tài liệu không tồn tại hoặc đã bị gỡ");
        }
        boolean hasUnlocked = isAuthor || (currentUserId != null && userUnlockedDocumentRepository.existsByUserIdAndDocumentId(currentUserId, id));
        boolean hasLiked = currentUserId != null && documentLikeRepository.existsByUserIdAndDocumentId(currentUserId, id);
        boolean hasBookmarked = currentUserId != null && documentBookmarkRepository.existsByUserIdAndDocumentId(currentUserId, id);

        AuthorSummaryDto author = userServiceClient.getAuthorSummary(doc.getUserId());

        return mapToDetail(doc, author, hasLiked, hasBookmarked, hasUnlocked, isAuthor);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<DocumentFeedResponse> getDocumentsFeed(
            String filter,
            UUID universityId,
            UUID courseId,
            String academicYear,
            String docType,
            UUID currentUserId,
            Pageable pageable) {
        return getDocumentsFeed(filter, universityId, courseId, academicYear, docType, Collections.emptyList(), currentUserId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<DocumentFeedResponse> getDocumentsFeed(
            String filter,
            UUID universityId,
            UUID courseId,
            String academicYear,
            String docType,
            List<String> recentKeywords,
            UUID currentUserId,
            Pageable pageable) {

        boolean isMyUploads = "my-uploads".equalsIgnoreCase(filter);
        if (isMyUploads && currentUserId == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để xem tài liệu của bạn");
        }

        boolean hasExplicitFilters = universityId != null
                || courseId != null
                || (academicYear != null && !academicYear.isBlank())
                || (docType != null && !docType.isBlank());

        if (!hasExplicitFilters && !isMyUploads) {
            if ("for-you".equalsIgnoreCase(filter)) {
                return buildForYouFeed(currentUserId, recentKeywords, pageable);
            }
            if ("following".equalsIgnoreCase(filter)) {
                return buildFollowingFeed(currentUserId, pageable);
            }
            if ("trending".equalsIgnoreCase(filter)) {
                return buildTrendingFeed(currentUserId, pageable);
            }
        }

        Specification<Document> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (isMyUploads) {
                predicates.add(cb.equal(root.get("userId"), currentUserId));
            } else {
                predicates.add(cb.equal(root.get("status"), "PUBLISHED"));
            }

            if (universityId != null) {
                predicates.add(cb.equal(root.get("university").get("id"), universityId));
            }
            if (courseId != null) {
                predicates.add(cb.equal(root.get("course").get("id"), courseId));
            }
            if (academicYear != null && !academicYear.isBlank()) {
                predicates.add(cb.equal(root.get("academicYear"), academicYear.trim()));
            }
            if (docType != null && !docType.isBlank()) {
                predicates.add(cb.equal(root.get("docType"), docType.trim()));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Pageable effectivePageable = pageable;
        if ("trending".equalsIgnoreCase(filter) || "top-rated".equalsIgnoreCase(filter)) {
            effectivePageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                    Sort.by(Sort.Direction.DESC, "bookmarkCount", "commentCount", "likeCount", "viewCount"));
        } else {
            effectivePageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                    Sort.by(Sort.Direction.DESC, "createdAt"));
        }

        Page<Document> page = documentRepository.findAll(spec, effectivePageable);
        return mapPageToFeedResponse(page, currentUserId);
    }

    @Override
    public void recordView(UUID documentId, UUID currentUserId) {
        if (!documentRepository.existsById(documentId)) {
            throw new ResourceNotFoundException("Tài liệu không tồn tại với ID: " + documentId);
        }

        if (currentUserId != null) {
            java.time.LocalDate today = java.time.LocalDate.now();
            if (documentViewRepository.existsByUserIdAndDocumentIdAndViewDate(currentUserId, documentId, today)) {
                return;
            }
            try {
                documentViewRepository.save(DocumentView.builder()
                        .userId(currentUserId)
                        .documentId(documentId)
                        .viewDate(today)
                        .viewedAt(java.time.OffsetDateTime.now())
                        .build());
            } catch (org.springframework.dao.DataIntegrityViolationException ex) {
                return;
            }
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

        ipfsStorageService.unpin(doc.getIpfsCid());
        ipfsStorageService.unpin(doc.getPreviewIpfsCid());
    }

    @Override
    public com.network.document_service.dto.response.DocumentFileResponse downloadDocument(UUID documentId, UUID currentUserId) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài liệu không tồn tại với ID: " + documentId));

        boolean isAuthor = currentUserId != null && currentUserId.equals(doc.getUserId());
        boolean hasUnlocked = isAuthor
                || (currentUserId != null && userUnlockedDocumentRepository.existsByUserIdAndDocumentId(currentUserId, documentId));
        boolean isFree = doc.getUnlockPointsRequired() == null || doc.getUnlockPointsRequired() <= 0;

        if (!"PUBLISHED".equals(doc.getStatus()) && !isAuthor) {
            throw new ResourceNotFoundException("Tài liệu không tồn tại hoặc đã bị gỡ");
        }
        if (!isAuthor && !hasUnlocked && !isFree) {
            throw new ForbiddenException("Bạn cần mở khóa tài liệu trước khi tải về");
        }

        String cid = doc.getIpfsCid();
        String fileUrl = doc.getFileUrl();
        if (cid == null || cid.isBlank() || fileUrl == null || fileUrl.isBlank()) {
            throw new BadRequestException("Tài liệu chưa có nội dung lưu trữ trên IPFS");
        }

        byte[] content;
        try {
            content = webClientBuilder.build()
                    .get()
                    .uri(fileUrl)
                    .retrieve()
                    .bodyToMono(byte[].class)
                    .timeout(java.time.Duration.ofSeconds(30))
                    .block();
        } catch (Exception ex) {
            log.warn("Failed to download CID {} from gateway {}: {}", cid, fileUrl, ex.getMessage());
            throw new com.network.document_service.exception.ServiceUnavailableException(
                    "Không thể tải nội dung từ mạng lưới IPFS. Vui lòng thử lại sau.");
        }
        if (content == null || content.length == 0) {
            throw new com.network.document_service.exception.ServiceUnavailableException("Nội dung tài liệu không khả dụng trên IPFS");
        }

        documentRepository.incrementDownloadCount(documentId);

        String safeTitle = doc.getTitle() != null
                ? doc.getTitle().replaceAll("[^\\p{L}\\p{N} ._-]", "").trim()
                : "document";
        String ext = doc.getFileExtension() != null && !doc.getFileExtension().isBlank() ? doc.getFileExtension() : "pdf";
        String filename = (safeTitle.isEmpty() ? "document" : safeTitle) + "." + ext;
        return new com.network.document_service.dto.response.DocumentFileResponse(content, filename);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<DocumentFeedResponse> searchDocuments(String query, UUID currentUserId, Pageable pageable) {
        Page<Document> page = documentRepository.searchByKeyword(query != null ? query.trim() : "", pageable);
        return mapPageToFeedResponse(page, currentUserId);
    }

    @Override
    public java.util.Map<String, Integer> backfillThumbnails(int limit) {
        List<Document> missing = documentRepository
                .findByThumbnailUrlIsNullAndIpfsCidIsNotNull(PageRequest.of(0, Math.max(1, limit)));

        int updated = 0;
        int failed = 0;
        for (Document doc : missing) {
            try {
                byte[] pdfBytes = webClientBuilder.build()
                        .get()
                        .uri(doc.getFileUrl())
                        .retrieve()
                        .bodyToMono(byte[].class)
                        .timeout(java.time.Duration.ofSeconds(30))
                        .block();
                if (pdfBytes == null || pdfBytes.length == 0) {
                    failed++;
                    continue;
                }
                byte[] thumbnailPng = pdfProcessingService.generateThumbnailPng(pdfBytes);
                if (thumbnailPng == null || thumbnailPng.length == 0) {
                    failed++;
                    continue;
                }
                IpfsUploadResult thumbUpload = ipfsStorageService.uploadBytes(
                        thumbnailPng, "thumb_backfill_" + doc.getId() + ".png");
                if (thumbUpload == null || thumbUpload.getGatewayUrl() == null) {
                    failed++;
                    continue;
                }
                doc.setThumbnailUrl(thumbUpload.getGatewayUrl());
                documentRepository.save(doc);
                updated++;
            } catch (Exception ex) {
                log.warn("Backfill thumbnail failed for document {}: {}", doc.getId(), ex.getMessage());
                failed++;
            }
        }

        log.info("Thumbnail backfill done: found={}, updated={}, failed={}", missing.size(), updated, failed);
        java.util.Map<String, Integer> summary = new java.util.HashMap<>();
        summary.put("found", missing.size());
        summary.put("updated", updated);
        summary.put("failed", failed);
        return summary;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<DocumentFeedResponse> getMyViewHistory(UUID currentUserId, Pageable pageable) {
        Page<UUID> idPage = documentViewRepository.findViewedDocumentIds(currentUserId, pageable);
        Map<UUID, Document> byId = documentRepository.findAllById(idPage.getContent()).stream()
                .collect(Collectors.toMap(Document::getId, d -> d, (a, b) -> a));
        List<Document> ordered = idPage.getContent().stream().map(byId::get).filter(Objects::nonNull).toList();
        Page<Document> page = new org.springframework.data.domain.PageImpl<>(ordered, pageable, idPage.getTotalElements());
        return mapPageToFeedResponse(page, currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentFeedResponse> getTrendingDocuments(int limit, UUID currentUserId) {
        int safeLimit = Math.max(1, Math.min(limit, 50));
        Pageable pageable = PageRequest.of(0, Math.min(Math.max(safeLimit * 3, 20), 60));
        List<Document> rawList = documentRepository.findTrendingDocuments(pageable);
        if (rawList == null || rawList.isEmpty()) {
            return Collections.emptyList();
        }

        List<ScoredDocument> scored = rawList.stream()
                .map(doc -> {
                    double score = computePureSocialTrendingScore(doc);
                    String reason = buildTrendingReason(doc);
                    return new ScoredDocument(doc, score, reason, false);
                })
                .sorted(Comparator
                        .comparingDouble(ScoredDocument::score).reversed()
                        .thenComparing((ScoredDocument sd) -> computeRawSocialPoints(sd.doc()), Comparator.reverseOrder())
                        .thenComparing(sd -> sd.doc().getCreatedAt() != null ? sd.doc().getCreatedAt() : java.time.OffsetDateTime.MIN, Comparator.reverseOrder()))
                .limit(safeLimit)
                .collect(Collectors.toList());

        return mapScoredListToFeedResponses(scored, currentUserId);
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

        UUID currentUserId = com.network.document_service.config.SecurityContextHolder.getUserId();
        boolean isAuthor = currentUserId != null && currentUserId.equals(doc.getUserId());
        if (!"PUBLISHED".equals(doc.getStatus()) && !isAuthor) {
            throw new ResourceNotFoundException("Tài liệu không tồn tại hoặc đã bị gỡ");
        }

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

    private List<DocumentAttachmentDto> parseAttachments(String json, boolean canViewFull) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            List<DocumentAttachmentDto> list = objectMapper.readValue(json, new TypeReference<List<DocumentAttachmentDto>>() {});
            if (!canViewFull) {
                list.forEach(att -> {
                    att.setIpfsCid(null);
                    att.setFileUrl(null);
                });
            }
            return list;
        } catch (Exception ex) {
            return Collections.emptyList();
        }
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
                    .fileExtension(doc.getFileExtension())
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
                    .attachments(parseAttachments(doc.getAttachmentsJson(), hasUnlocked))
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
                .attachments(parseAttachments(doc.getAttachmentsJson(), canViewFull))
                .createdAt(doc.getCreatedAt())
                .updatedAt(doc.getUpdatedAt())
                .build();
    }

    private University resolveOrCreateUniversity(UUID universityId, String universityName) {
        if (universityId != null) {
            return universityRepository.findById(universityId)
                    .orElseThrow(() -> new BadRequestException("Trường đại học không tồn tại với ID: " + universityId));
        }
        if (universityName != null && !universityName.isBlank()) {
            String cleaned = validateCustomTaxonomyName(universityName, 3, 150, "Tên trường đại học");
            return universityRepository.findFirstByNameIgnoreCase(cleaned)
                    .orElseGet(() -> {
                        String code = generateTaxonomyCode("UNI", cleaned);
                        University newUni = University.builder()
                                .code(code)
                                .name(cleaned)
                                .city("Việt Nam")
                                .description("Trường đại học do thành viên đóng góp")
                                .totalDocumentsCount(0)
                                .build();
                        return universityRepository.save(newUni);
                    });
        }
        return null;
    }

    private Course resolveOrCreateCourse(UUID courseId, String courseName) {
        if (courseId != null) {
            return courseRepository.findById(courseId)
                    .orElseThrow(() -> new BadRequestException("Môn học không tồn tại với ID: " + courseId));
        }
        if (courseName != null && !courseName.isBlank()) {
            String cleaned = validateCustomTaxonomyName(courseName, 2, 150, "Tên môn học");
            return courseRepository.findFirstByNameIgnoreCase(cleaned)
                    .orElseGet(() -> {
                        String code = generateTaxonomyCode("CRS", cleaned);
                        Course newCourse = Course.builder()
                                .code(code)
                                .name(cleaned)
                                .area("Chuyên ngành")
                                .description("Môn học do thành viên đóng góp")
                                .build();
                        return courseRepository.save(newCourse);
                    });
        }
        return null;
    }

    private String validateCustomTaxonomyName(String rawValue, int minLen, int maxLen, String fieldLabel) {
        String trimmed = rawValue.trim().replaceAll("\\s+", " ");
        if (trimmed.length() < minLen || trimmed.length() > maxLen) {
            throw new BadRequestException(fieldLabel + " phải có độ dài từ " + minLen + " đến " + maxLen + " ký tự.");
        }
        long letterCount = trimmed.codePoints().filter(Character::isLetter).count();
        if (letterCount < 2) {
            throw new BadRequestException(fieldLabel + " không hợp lệ (phải chứa ít nhất 2 chữ cái, không chỉ gồm số hoặc ký tự đặc biệt).");
        }
        if (trimmed.matches("^(.)\\1{3,}$")) {
            throw new BadRequestException(fieldLabel + " không hợp lệ (chứa ký tự lặp vô nghĩa).");
        }
        return trimmed;
    }

    private String validateAndNormalizeAcademicYear(String rawYear) {
        if (rawYear == null || rawYear.isBlank()) {
            return "2025";
        }
        String cleaned = rawYear.trim().replaceAll("\\s+", "");
        int maxAllowedYear = java.time.Year.now().getValue() + 1;
        if (cleaned.matches("^\\d{4}$")) {
            int y = Integer.parseInt(cleaned);
            if (y < 1990 || y > maxAllowedYear) {
                throw new BadRequestException("Năm học phải nằm trong khoảng từ 1990 đến " + maxAllowedYear + ".");
            }
            return String.valueOf(y);
        }
        if (cleaned.matches("^\\d{4}[-/]\\d{4}$")) {
            String[] parts = cleaned.split("[-/]");
            int start = Integer.parseInt(parts[0]);
            int end = Integer.parseInt(parts[1]);
            if (start < 1990 || end > maxAllowedYear || end < start || (end - start) > 6) {
                throw new BadRequestException("Niên khóa không hợp lệ (VD hợp lệ: 2024-2025, trong khoảng 1990–" + maxAllowedYear + ").");
            }
            return start + "-" + end;
        }
        throw new BadRequestException("Định dạng năm học không hợp lệ. Vui lòng nhập năm (VD: 2026) hoặc niên khóa (VD: 2025-2026).");
    }

    private String generateTaxonomyCode(String prefix, String name) {
        String ascii = java.text.Normalizer.normalize(name, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .replaceAll("[đĐ]", "D")
                .toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9]+", "_");
        if (ascii.startsWith("_")) ascii = ascii.substring(1);
        if (ascii.endsWith("_")) ascii = ascii.substring(0, ascii.length() - 1);
        if (ascii.length() > 16) ascii = ascii.substring(0, 16);
        String suffix = UUID.randomUUID().toString().substring(0, 6).toUpperCase(Locale.ROOT);
        return prefix + "_" + (ascii.isEmpty() ? "CUSTOM" : ascii) + "_" + suffix;
    }

    // =========================================================================
    // 3 LUỒNG THUẬT TOÁN TRANG CHỦ: DÀNH CHO BẠN, ĐANG THEO DÕI, ĐANG THỊNH HÀNH
    // =========================================================================

    private record ScoredDocument(Document doc, double score, String reason, boolean exploration) {}

    private List<Document> fetchCandidatePublishedDocuments(int maxCandidates) {
        Page<Document> page = documentRepository.findByStatusOrderByCreatedAtDesc(
                "PUBLISHED", PageRequest.of(0, Math.max(20, maxCandidates))
        );
        if (page != null && page.getContent() != null && !page.getContent().isEmpty()) {
            return new ArrayList<>(page.getContent());
        }
        Specification<Document> publishedSpec = (root, query, cb) -> cb.equal(root.get("status"), "PUBLISHED");
        Page<Document> fallback = documentRepository.findAll(
                publishedSpec, PageRequest.of(0, Math.max(20, maxCandidates), Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        return fallback != null && fallback.getContent() != null ? new ArrayList<>(fallback.getContent()) : new ArrayList<>();
    }

    /**
     * TAB 3: ĐANG THỊNH HÀNH (TRENDING) — Thuần tương tác xã hội (Bỏ điểm AI):
     * TrendingScore(d) = (5.0 * Saves + 4.0 * Comments + 3.0 * Likes + 2.0 * Downloads + 0.2 * Views) / sqrt(AgeInDays + 1)
     */
    private double computeRawSocialPoints(Document doc) {
        int saves = doc.getBookmarkCount() != null ? Math.max(0, doc.getBookmarkCount()) : 0;
        int comments = doc.getCommentCount() != null ? Math.max(0, doc.getCommentCount()) : 0;
        int likes = doc.getLikeCount() != null ? Math.max(0, doc.getLikeCount()) : 0;
        int downloads = doc.getDownloadCount() != null ? Math.max(0, doc.getDownloadCount()) : 0;
        int views = doc.getViewCount() != null ? Math.max(0, doc.getViewCount()) : 0;
        return (5.0 * saves) + (4.0 * comments) + (3.0 * likes) + (2.0 * downloads) + (0.2 * views);
    }

    private double computePureSocialTrendingScore(Document doc) {
        double rawPoints = computeRawSocialPoints(doc);
        double ageInDays = 0.0;
        if (doc.getCreatedAt() != null) {
            long hours = Math.max(0L, java.time.Duration.between(doc.getCreatedAt(), java.time.OffsetDateTime.now()).toHours());
            ageInDays = hours / 24.0;
        }
        double timeDecay = Math.sqrt(ageInDays + 1.0);
        return Math.round((rawPoints / timeDecay) * 100.0) / 100.0;
    }

    private String buildTrendingReason(Document doc) {
        int saves = doc.getBookmarkCount() != null ? Math.max(0, doc.getBookmarkCount()) : 0;
        int comments = doc.getCommentCount() != null ? Math.max(0, doc.getCommentCount()) : 0;
        int likes = doc.getLikeCount() != null ? Math.max(0, doc.getLikeCount()) : 0;
        if (saves > 0 && (likes > 0 || comments > 0)) {
            return "Thịnh hành • Được lưu và thảo luận sôi nổi";
        }
        if (comments > 0) {
            return "Thịnh hành • Nhiều bình luận học thuật";
        }
        if (likes > 0) {
            return "Thịnh hành • Được sinh viên yêu thích";
        }
        if (saves > 0) {
            return "Thịnh hành • Được nhiều sinh viên lưu trữ";
        }
        return "Học liệu mới đang được quan tâm";
    }

    private PageResponse<DocumentFeedResponse> buildTrendingFeed(UUID currentUserId, Pageable pageable) {
        List<Document> candidates = fetchCandidatePublishedDocuments(200);
        List<ScoredDocument> ranked = candidates.stream()
                .map(doc -> new ScoredDocument(doc, computePureSocialTrendingScore(doc), buildTrendingReason(doc), false))
                .sorted(Comparator
                        .comparingDouble(ScoredDocument::score).reversed()
                        .thenComparing((ScoredDocument sd) -> computeRawSocialPoints(sd.doc()), Comparator.reverseOrder())
                        .thenComparing(sd -> sd.doc().getCreatedAt() != null ? sd.doc().getCreatedAt() : java.time.OffsetDateTime.MIN, Comparator.reverseOrder()))
                .collect(Collectors.toList());

        return paginateScoredDocuments(ranked, currentUserId, pageable);
    }

    /**
     * TAB 1: DÀNH CHO BẠN (FOR YOU) — Thuật toán Đa tín hiệu + Cân bằng 80/20 Khai thác & Khám phá
     */
    private PageResponse<DocumentFeedResponse> buildForYouFeed(
            UUID currentUserId,
            List<String> recentKeywords,
            Pageable pageable) {

        List<Document> candidates = fetchCandidatePublishedDocuments(250);
        if (candidates.isEmpty()) {
            return PageResponse.<DocumentFeedResponse>builder()
                    .content(Collections.emptyList())
                    .pageNumber(pageable.getPageNumber())
                    .pageSize(pageable.getPageSize())
                    .totalElements(0)
                    .totalPages(0)
                    .last(true)
                    .build();
        }

        Map<UUID, Document> candidateById = candidates.stream()
                .filter(d -> d.getId() != null)
                .collect(Collectors.toMap(Document::getId, d -> d, (a, b) -> a));

        Map<UUID, Double> courseAffinity = new HashMap<>();
        Map<UUID, Double> universityAffinity = new HashMap<>();
        Map<String, Double> docTypeAffinity = new HashMap<>();
        Map<UUID, Double> authorAffinity = new HashMap<>();
        Set<String> interestTokens = new HashSet<>();
        Set<UUID> seenOrInteractedDocIds = new HashSet<>();
        Set<UUID> positiveSeedDocIds = new HashSet<>();
        Set<UUID> followingIds = new HashSet<>();
        Map<UUID, Double> collaborativeDocScores = new HashMap<>();

        if (currentUserId != null) {
            followingIds.addAll(userServiceClient.getFollowingIds(currentUserId));

            Map<UUID, Double> userDocWeights = new LinkedHashMap<>();

            // 1. Lưu tài liệu (Bookmark): +5.0 điểm
            try {
                List<DocumentBookmark> bookmarks = documentBookmarkRepository.findByUserIdOrderByCreatedAtDesc(currentUserId);
                if (bookmarks != null) {
                    for (DocumentBookmark bm : bookmarks) {
                        if (bm.getDocumentId() != null) {
                            userDocWeights.merge(bm.getDocumentId(), 5.0, Double::max);
                            seenOrInteractedDocIds.add(bm.getDocumentId());
                            positiveSeedDocIds.add(bm.getDocumentId());
                        }
                    }
                }
            } catch (Exception ignored) {}

            // 2. Mở khóa tài liệu (Unlock): +5.0 điểm
            try {
                Page<UserUnlockedDocument> unlockedPage = userUnlockedDocumentRepository
                        .findByUserIdOrderByCreatedAtDesc(currentUserId, PageRequest.of(0, 50));
                if (unlockedPage != null && unlockedPage.getContent() != null) {
                    for (UserUnlockedDocument ul : unlockedPage.getContent()) {
                        if (ul.getDocumentId() != null) {
                            userDocWeights.merge(ul.getDocumentId(), 5.0, Double::max);
                            seenOrInteractedDocIds.add(ul.getDocumentId());
                            positiveSeedDocIds.add(ul.getDocumentId());
                        }
                    }
                }
            } catch (Exception ignored) {}

            // 3. Bình luận (Comment): +4.0 điểm
            try {
                if (documentCommentRepository != null) {
                    List<DocumentComment> comments = documentCommentRepository.findByUserIdOrderByCreatedAtDesc(currentUserId);
                    if (comments != null) {
                        for (DocumentComment cm : comments) {
                            if (cm.getDocumentId() != null) {
                                userDocWeights.merge(cm.getDocumentId(), 4.0, Double::max);
                                seenOrInteractedDocIds.add(cm.getDocumentId());
                                positiveSeedDocIds.add(cm.getDocumentId());
                            }
                        }
                    }
                }
            } catch (Exception ignored) {}

            // 4. Thích tài liệu (Like): +3.0 điểm
            try {
                List<DocumentLike> likes = documentLikeRepository.findByUserIdOrderByCreatedAtDesc(currentUserId);
                if (likes != null) {
                    for (DocumentLike lk : likes) {
                        if (lk.getDocumentId() != null) {
                            userDocWeights.merge(lk.getDocumentId(), 3.0, Double::max);
                            seenOrInteractedDocIds.add(lk.getDocumentId());
                            positiveSeedDocIds.add(lk.getDocumentId());
                        }
                    }
                }
            } catch (Exception ignored) {}

            // 5. Lịch sử xem (View): +1.5 điểm
            try {
                Page<UUID> viewedIds = documentViewRepository.findViewedDocumentIds(currentUserId, PageRequest.of(0, 50));
                if (viewedIds != null && viewedIds.getContent() != null) {
                    for (UUID vDocId : viewedIds.getContent()) {
                        if (vDocId != null) {
                            userDocWeights.merge(vDocId, 1.5, Double::max);
                            seenOrInteractedDocIds.add(vDocId);
                        }
                    }
                }
            } catch (Exception ignored) {}

            // Trích xuất Hồ sơ sở thích từ các bài người dùng đã tương tác
            if (!userDocWeights.isEmpty()) {
                List<UUID> missingIds = userDocWeights.keySet().stream()
                        .filter(id -> !candidateById.containsKey(id))
                        .collect(Collectors.toList());
                if (!missingIds.isEmpty()) {
                    try {
                        List<Document> extraDocs = documentRepository.findByIdIn(missingIds);
                        if (extraDocs != null) {
                            extraDocs.forEach(d -> {
                                if (d.getId() != null) candidateById.put(d.getId(), d);
                            });
                        }
                    } catch (Exception ignored) {}
                }

                for (Map.Entry<UUID, Double> entry : userDocWeights.entrySet()) {
                    Document histDoc = candidateById.get(entry.getKey());
                    if (histDoc == null) continue;
                    double w = entry.getValue();
                    if (histDoc.getCourse() != null && histDoc.getCourse().getId() != null) {
                        courseAffinity.merge(histDoc.getCourse().getId(), w, Double::sum);
                    }
                    if (histDoc.getUniversity() != null && histDoc.getUniversity().getId() != null) {
                        universityAffinity.merge(histDoc.getUniversity().getId(), w * 0.7, Double::sum);
                    }
                    if (histDoc.getDocType() != null && !histDoc.getDocType().isBlank()) {
                        docTypeAffinity.merge(histDoc.getDocType().toUpperCase(Locale.ROOT), w * 0.4, Double::sum);
                    }
                    if (histDoc.getUserId() != null && !histDoc.getUserId().equals(currentUserId)) {
                        authorAffinity.merge(histDoc.getUserId(), w * 0.8, Double::sum);
                    }
                    interestTokens.addAll(extractSignificantTokens(histDoc.getTitle()));
                }
            }

            // Collaborative Filtering: Tìm những người dùng khác cũng Thích/Lưu các bài giống bạn
            if (!positiveSeedDocIds.isEmpty()) {
                try {
                    Set<UUID> similarUserIds = new HashSet<>();
                    List<DocumentLike> coLikes = documentLikeRepository.findByDocumentIdIn(positiveSeedDocIds);
                    if (coLikes != null) {
                        for (DocumentLike lk : coLikes) {
                            if (lk.getUserId() != null && !lk.getUserId().equals(currentUserId)) {
                                similarUserIds.add(lk.getUserId());
                            }
                        }
                    }
                    List<DocumentBookmark> coBookmarks = documentBookmarkRepository.findByDocumentIdIn(positiveSeedDocIds);
                    if (coBookmarks != null) {
                        for (DocumentBookmark bm : coBookmarks) {
                            if (bm.getUserId() != null && !bm.getUserId().equals(currentUserId)) {
                                similarUserIds.add(bm.getUserId());
                            }
                        }
                    }
                    if (!similarUserIds.isEmpty()) {
                        List<DocumentBookmark> peerBookmarks = documentBookmarkRepository.findByUserIdInOrderByCreatedAtDesc(similarUserIds);
                        if (peerBookmarks != null) {
                            for (DocumentBookmark pb : peerBookmarks) {
                                if (pb.getDocumentId() != null && !positiveSeedDocIds.contains(pb.getDocumentId())) {
                                    collaborativeDocScores.merge(pb.getDocumentId(), 1.5, Double::sum);
                                }
                            }
                        }
                        List<DocumentLike> peerLikes = documentLikeRepository.findByUserIdInOrderByCreatedAtDesc(similarUserIds);
                        if (peerLikes != null) {
                            for (DocumentLike pl : peerLikes) {
                                if (pl.getDocumentId() != null && !positiveSeedDocIds.contains(pl.getDocumentId())) {
                                    collaborativeDocScores.merge(pl.getDocumentId(), 1.0, Double::sum);
                                }
                            }
                        }
                    }
                } catch (Exception ignored) {}
            }
        }

        List<String> cleanedKeywords = new ArrayList<>();
        if (recentKeywords != null) {
            for (String kw : recentKeywords) {
                if (kw != null && !kw.isBlank()) {
                    cleanedKeywords.add(kw.trim().toLowerCase(Locale.ROOT));
                }
            }
        }

        List<ScoredDocument> exploitationPool = new ArrayList<>();
        List<ScoredDocument> explorationPool = new ArrayList<>();

        for (Document doc : candidates) {
            UUID docCourseId = doc.getCourse() != null ? doc.getCourse().getId() : null;
            UUID docUniId = doc.getUniversity() != null ? doc.getUniversity().getId() : null;
            String docTypeKey = doc.getDocType() != null ? doc.getDocType().toUpperCase(Locale.ROOT) : "";

            // 1. InterestMatch (0 - 45 điểm)
            double courseScore = docCourseId != null && courseAffinity.containsKey(docCourseId)
                    ? Math.min(22.0, 12.0 + courseAffinity.get(docCourseId) * 2.0)
                    : 0.0;

            String searchableText = ((doc.getTitle() != null ? doc.getTitle() : "") + " "
                    + (doc.getDescription() != null ? doc.getDescription() : "") + " "
                    + (doc.getCourse() != null && doc.getCourse().getName() != null ? doc.getCourse().getName() : "") + " "
                    + (doc.getUniversity() != null && doc.getUniversity().getName() != null ? doc.getUniversity().getName() : ""))
                    .toLowerCase(Locale.ROOT);

            String matchedSearchKeyword = null;
            for (String kw : cleanedKeywords) {
                if (kw.length() >= 2 && searchableText.contains(kw)) {
                    matchedSearchKeyword = kw;
                    break;
                }
            }
            double searchMatchScore = matchedSearchKeyword != null ? 16.0 : 0.0;

            Set<String> docTokens = extractSignificantTokens(doc.getTitle());
            long overlappingTokens = docTokens.stream().filter(interestTokens::contains).count();
            double tokenMatchScore = overlappingTokens > 0 ? Math.min(8.0, overlappingTokens * 3.0) : 0.0;

            double uniScore = docUniId != null && universityAffinity.containsKey(docUniId)
                    ? Math.min(10.0, 4.0 + universityAffinity.get(docUniId))
                    : 0.0;

            double docTypeScore = !docTypeKey.isEmpty() && docTypeAffinity.containsKey(docTypeKey)
                    ? Math.min(5.0, docTypeAffinity.get(docTypeKey))
                    : 0.0;

            double interestMatch = Math.min(45.0, courseScore + searchMatchScore + tokenMatchScore + uniScore + docTypeScore);

            // 2. SocialGraphBoost (0 - 25 điểm)
            boolean isFollowedAuthor = doc.getUserId() != null && followingIds.contains(doc.getUserId());
            double followScore = isFollowedAuthor
                    ? 18.0
                    : (doc.getUserId() != null && authorAffinity.containsKey(doc.getUserId())
                            ? Math.min(9.0, authorAffinity.get(doc.getUserId()) * 1.5)
                            : 0.0);

            double collabScore = doc.getId() != null && collaborativeDocScores.containsKey(doc.getId())
                    ? Math.min(10.0, collaborativeDocScores.get(doc.getId()) * 3.5)
                    : 0.0;

            double socialGraphBoost = Math.min(25.0, followScore + collabScore);

            // 3. EngagementQuality (0 - 15 điểm)
            double rawSocial = computeRawSocialPoints(doc);
            double engagementQuality = Math.min(15.0, Math.log1p(rawSocial) * 3.5);

            // 4. FreshnessBoost (0 - 15 điểm)
            double freshnessBoost = 2.0;
            if (doc.getCreatedAt() != null) {
                long hoursOld = Math.max(0L, java.time.Duration.between(doc.getCreatedAt(), java.time.OffsetDateTime.now()).toHours());
                if (hoursOld <= 24) {
                    freshnessBoost = 15.0;
                } else if (hoursOld <= 72) {
                    freshnessBoost = 10.0;
                } else if (hoursOld <= 168) {
                    freshnessBoost = 5.0;
                }
            }

            // 5. SeenPenalty (Chống lặp bài đã xem/tương tác: -12 điểm)
            boolean alreadySeen = doc.getId() != null && seenOrInteractedDocIds.contains(doc.getId());
            double seenPenalty = alreadySeen ? 12.0 : 0.0;

            double totalForYouScore = Math.round((interestMatch + socialGraphBoost + engagementQuality + freshnessBoost - seenPenalty) * 100.0) / 100.0;

            // Xác định nhãn lý do gợi ý (Explainable Recommendation Badge)
            String reason;
            boolean hasPersonalSignal = interestMatch > 0.0 || socialGraphBoost > 0.0;
            if (matchedSearchKeyword != null) {
                reason = "Phù hợp với từ khóa bạn vừa tìm kiếm";
            } else if (isFollowedAuthor) {
                reason = "Từ học giả bạn đang theo dõi";
            } else if (courseScore > 0.0 && doc.getCourse() != null && doc.getCourse().getName() != null) {
                reason = "Vì bạn quan tâm môn " + doc.getCourse().getName();
            } else if (collabScore > 0.0) {
                reason = "Sinh viên có cùng sở thích cũng đã lưu";
            } else if (uniScore > 0.0 && doc.getUniversity() != null && doc.getUniversity().getName() != null) {
                reason = "Phổ biến tại " + doc.getUniversity().getName();
            } else if (tokenMatchScore > 0.0) {
                reason = "Tương tự học liệu bạn đã lưu hoặc thích";
            } else if (rawSocial >= 5.0) {
                reason = "Đang được cộng đồng sinh viên quan tâm";
            } else {
                reason = "Đề xuất mới dành cho bạn";
            }

            if (hasPersonalSignal) {
                exploitationPool.add(new ScoredDocument(doc, totalForYouScore, reason, false));
            } else {
                double exploreScore = Math.round((engagementQuality * 1.2 + freshnessBoost - seenPenalty) * 100.0) / 100.0;
                String exploreReason = rawSocial >= 5.0
                        ? "Khám phá • Học liệu nổi bật trong cộng đồng"
                        : "Khám phá chủ đề học thuật mới";
                explorationPool.add(new ScoredDocument(doc, exploreScore, exploreReason, true));
            }
        }

        Comparator<ScoredDocument> comparator = Comparator
                .comparingDouble(ScoredDocument::score).reversed()
                .thenComparing(sd -> sd.doc().getCreatedAt() != null ? sd.doc().getCreatedAt() : java.time.OffsetDateTime.MIN, Comparator.reverseOrder());

        exploitationPool.sort(comparator);
        explorationPool.sort(comparator);

        // Kết hợp theo tỉ lệ 80% Khai thác sở thích (Exploitation) + 20% Khám phá mới (Exploration)
        List<ScoredDocument> blended = new ArrayList<>();
        if (exploitationPool.isEmpty()) {
            blended.addAll(explorationPool);
        } else {
            int expIdx = 0;
            int exploreIdx = 0;
            while (expIdx < exploitationPool.size() || exploreIdx < explorationPool.size()) {
                for (int i = 0; i < 4 && expIdx < exploitationPool.size(); i++) {
                    blended.add(exploitationPool.get(expIdx++));
                }
                if (exploreIdx < explorationPool.size()) {
                    blended.add(explorationPool.get(exploreIdx++));
                }
            }
        }

        List<ScoredDocument> diversified = applyAuthorDiversityCap(blended, 2);
        return paginateScoredDocuments(diversified, currentUserId, pageable);
    }

    /**
     * TAB 2: ĐANG THEO DÕI (FOLLOWING) — 80% Người đang theo dõi (Mới + Nổi bật, tối đa 2 bài liên tiếp/tác giả)
     * + 20% Luồng Đổi mới (Bài người theo dõi vừa thích/lưu hoặc cùng chuyên ngành) + Xử lý người mới chưa theo dõi ai.
     */
    private PageResponse<DocumentFeedResponse> buildFollowingFeed(UUID currentUserId, Pageable pageable) {
        List<Document> candidates = fetchCandidatePublishedDocuments(250);
        if (candidates.isEmpty()) {
            return PageResponse.<DocumentFeedResponse>builder()
                    .content(Collections.emptyList())
                    .pageNumber(pageable.getPageNumber())
                    .pageSize(pageable.getPageSize())
                    .totalElements(0)
                    .totalPages(0)
                    .last(true)
                    .build();
        }

        Set<UUID> followingIds = currentUserId != null
                ? new HashSet<>(userServiceClient.getFollowingIds(currentUserId))
                : Collections.emptySet();

        Set<UUID> seenDocIds = new HashSet<>();
        if (currentUserId != null) {
            try {
                Page<UUID> viewed = documentViewRepository.findViewedDocumentIds(currentUserId, PageRequest.of(0, 50));
                if (viewed != null && viewed.getContent() != null) {
                    seenDocIds.addAll(viewed.getContent());
                }
            } catch (Exception ignored) {}
        }

        // TRƯỜNG HỢP 1: Người dùng mới CHƯA theo dõi ai (hoặc chưa đăng nhập)
        // Trả về các bài viết tiêu biểu nhất từ các học giả hàng đầu để người dùng khám phá ngay dưới khung Gợi ý theo dõi
        if (followingIds.isEmpty()) {
            List<ScoredDocument> onboardingDocs = candidates.stream()
                    .filter(doc -> currentUserId == null || !currentUserId.equals(doc.getUserId()))
                    .map(doc -> {
                        double score = computePureSocialTrendingScore(doc) + computeFreshnessPoints(doc) * 0.5;
                        return new ScoredDocument(doc, score, "Gợi ý từ học giả tiêu biểu trong cộng đồng", true);
                    })
                    .sorted(Comparator
                            .comparingDouble(ScoredDocument::score).reversed()
                            .thenComparing(sd -> sd.doc().getCreatedAt() != null ? sd.doc().getCreatedAt() : java.time.OffsetDateTime.MIN, Comparator.reverseOrder()))
                    .collect(Collectors.toList());

            List<ScoredDocument> diversified = applyAuthorDiversityCap(onboardingDocs, 2);
            return paginateScoredDocuments(diversified, currentUserId, pageable);
        }

        // TRƯỜNG HỢP 2: Người dùng ĐÃ theo dõi >= 1 tác giả
        Set<UUID> followedAuthorCourses = new HashSet<>();
        Set<UUID> docsLikedOrSavedByFollowed = new HashSet<>();
        try {
            List<DocumentLike> followedLikes = documentLikeRepository.findByUserIdInOrderByCreatedAtDesc(followingIds);
            if (followedLikes != null) {
                for (DocumentLike lk : followedLikes) {
                    if (lk.getDocumentId() != null) docsLikedOrSavedByFollowed.add(lk.getDocumentId());
                }
            }
            List<DocumentBookmark> followedSaves = documentBookmarkRepository.findByUserIdInOrderByCreatedAtDesc(followingIds);
            if (followedSaves != null) {
                for (DocumentBookmark bm : followedSaves) {
                    if (bm.getDocumentId() != null) docsLikedOrSavedByFollowed.add(bm.getDocumentId());
                }
            }
        } catch (Exception ignored) {}

        List<ScoredDocument> followedPool = new ArrayList<>();
        List<ScoredDocument> discoveryPool = new ArrayList<>();

        for (Document doc : candidates) {
            if (doc.getUserId() != null && followingIds.contains(doc.getUserId())) {
                if (doc.getCourse() != null && doc.getCourse().getId() != null) {
                    followedAuthorCourses.add(doc.getCourse().getId());
                }
                double recency = computeFreshnessPoints(doc);
                double rawSocial = computeRawSocialPoints(doc);
                double engagement = Math.min(25.0, rawSocial * 1.5);
                double seenPenalty = (doc.getId() != null && seenDocIds.contains(doc.getId())) ? 8.0 : 0.0;
                double followingScore = Math.round(((recency * 0.6) + (engagement * 0.4) - seenPenalty) * 100.0) / 100.0;

                String reason = rawSocial >= 6.0
                        ? "Bài viết nổi bật từ học giả bạn đang theo dõi"
                        : "Từ học giả bạn đang theo dõi";
                followedPool.add(new ScoredDocument(doc, followingScore, reason, false));
            }
        }

        for (Document doc : candidates) {
            if (doc.getUserId() == null
                    || followingIds.contains(doc.getUserId())
                    || (currentUserId != null && currentUserId.equals(doc.getUserId()))) {
                continue;
            }
            boolean endorsedByFollowed = doc.getId() != null && docsLikedOrSavedByFollowed.contains(doc.getId());
            boolean sameCourseAsFollowed = doc.getCourse() != null
                    && doc.getCourse().getId() != null
                    && followedAuthorCourses.contains(doc.getCourse().getId());

            double baseTrending = computePureSocialTrendingScore(doc) + computeFreshnessPoints(doc) * 0.3;
            double seenPenalty = (doc.getId() != null && seenDocIds.contains(doc.getId())) ? 8.0 : 0.0;

            if (endorsedByFollowed) {
                discoveryPool.add(new ScoredDocument(
                        doc,
                        baseTrending + 20.0 - seenPenalty,
                        "Đổi mới • Người bạn theo dõi cũng thích tài liệu này",
                        true
                ));
            } else if (sameCourseAsFollowed) {
                discoveryPool.add(new ScoredDocument(
                        doc,
                        baseTrending + 12.0 - seenPenalty,
                        "Đổi mới • Cùng môn học với người bạn theo dõi",
                        true
                ));
            } else if (computeRawSocialPoints(doc) > 0) {
                discoveryPool.add(new ScoredDocument(
                        doc,
                        baseTrending - seenPenalty,
                        "Đổi mới • Gợi ý từ tác giả nổi bật khác",
                        true
                ));
            }
        }

        Comparator<ScoredDocument> comparator = Comparator
                .comparingDouble(ScoredDocument::score).reversed()
                .thenComparing(sd -> sd.doc().getCreatedAt() != null ? sd.doc().getCreatedAt() : java.time.OffsetDateTime.MIN, Comparator.reverseOrder());

        followedPool.sort(comparator);
        discoveryPool.sort(comparator);

        List<ScoredDocument> diversifiedFollowed = applyAuthorDiversityCap(followedPool, 2);
        List<ScoredDocument> diversifiedDiscovery = applyAuthorDiversityCap(discoveryPool, 1);

        // Đan xen 80% Bài của người đang theo dõi (4 bài) + 20% Bài đổi mới (1 bài)
        List<ScoredDocument> combined = new ArrayList<>();
        int fIdx = 0;
        int dIdx = 0;
        while (fIdx < diversifiedFollowed.size() || dIdx < diversifiedDiscovery.size()) {
            for (int i = 0; i < 4 && fIdx < diversifiedFollowed.size(); i++) {
                combined.add(diversifiedFollowed.get(fIdx++));
            }
            if (dIdx < diversifiedDiscovery.size()) {
                combined.add(diversifiedDiscovery.get(dIdx++));
            } else if (fIdx >= diversifiedFollowed.size()) {
                break;
            }
        }

        return paginateScoredDocuments(combined, currentUserId, pageable);
    }

    private double computeFreshnessPoints(Document doc) {
        if (doc.getCreatedAt() == null) {
            return 2.0;
        }
        long hoursOld = Math.max(0L, java.time.Duration.between(doc.getCreatedAt(), java.time.OffsetDateTime.now()).toHours());
        if (hoursOld <= 12) return 25.0;
        if (hoursOld <= 24) return 20.0;
        if (hoursOld <= 72) return 14.0;
        if (hoursOld <= 168) return 8.0;
        return Math.max(1.0, 6.0 - (hoursOld / 168.0));
    }

    private Set<String> extractSignificantTokens(String text) {
        if (text == null || text.isBlank()) {
            return Collections.emptySet();
        }
        String normalized = text.toLowerCase(Locale.ROOT)
                .replaceAll("[^\\p{L}\\p{N}\\s]", " ")
                .trim();
        Set<String> stopWords = Set.of(
                "của", "và", "các", "cho", "trong", "với", "một", "những", "được", "tài", "liệu", "môn", "học", "bài", "tập", "giáo", "trình"
        );
        Set<String> tokens = new HashSet<>();
        for (String part : normalized.split("\\s+")) {
            if (part.length() >= 3 && !stopWords.contains(part)) {
                tokens.add(part);
            }
        }
        return tokens;
    }

    /**
     * Giới hạn tối đa maxConsecutive bài liên tiếp từ cùng 1 tác giả để dòng thời gian luôn đa dạng.
     */
    private List<ScoredDocument> applyAuthorDiversityCap(List<ScoredDocument> input, int maxConsecutive) {
        if (input == null || input.size() <= maxConsecutive) {
            return input != null ? input : Collections.emptyList();
        }
        List<ScoredDocument> remaining = new ArrayList<>(input);
        List<ScoredDocument> result = new ArrayList<>(input.size());
        UUID lastAuthor = null;
        int consecutiveCount = 0;

        while (!remaining.isEmpty()) {
            int chosenIdx = -1;
            for (int i = 0; i < remaining.size(); i++) {
                UUID candidateAuthor = remaining.get(i).doc().getUserId();
                if (candidateAuthor == null || !candidateAuthor.equals(lastAuthor) || consecutiveCount < maxConsecutive) {
                    chosenIdx = i;
                    break;
                }
            }
            if (chosenIdx == -1) {
                chosenIdx = 0;
            }
            ScoredDocument picked = remaining.remove(chosenIdx);
            UUID pickedAuthor = picked.doc().getUserId();
            if (pickedAuthor != null && pickedAuthor.equals(lastAuthor)) {
                consecutiveCount++;
            } else {
                lastAuthor = pickedAuthor;
                consecutiveCount = 1;
            }
            result.add(picked);
        }
        return result;
    }

    private PageResponse<DocumentFeedResponse> paginateScoredDocuments(
            List<ScoredDocument> ranked,
            UUID currentUserId,
            Pageable pageable) {
        int totalElements = ranked.size();
        int pageSize = Math.max(1, pageable.getPageSize());
        int pageNumber = Math.max(0, pageable.getPageNumber());
        int fromIndex = pageNumber * pageSize;

        List<ScoredDocument> pageSlice = fromIndex >= totalElements
                ? Collections.emptyList()
                : ranked.subList(fromIndex, Math.min(fromIndex + pageSize, totalElements));

        List<DocumentFeedResponse> content = mapScoredListToFeedResponses(pageSlice, currentUserId);
        int totalPages = (int) Math.ceil((double) totalElements / pageSize);
        boolean isLast = (fromIndex + pageSize) >= totalElements;

        return PageResponse.<DocumentFeedResponse>builder()
                .content(content)
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .last(isLast)
                .build();
    }

    private List<DocumentFeedResponse> mapScoredListToFeedResponses(
            List<ScoredDocument> scoredList,
            UUID currentUserId) {
        if (scoredList == null || scoredList.isEmpty()) {
            return Collections.emptyList();
        }
        List<UUID> authorIds = scoredList.stream()
                .map(sd -> sd.doc().getUserId())
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        Map<UUID, AuthorSummaryDto> authors = userServiceClient.getAuthorsBatch(authorIds);

        return scoredList.stream().map(sd -> {
            Document doc = sd.doc();
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
                    .fileExtension(doc.getFileExtension())
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
                    .attachments(parseAttachments(doc.getAttachmentsJson(), hasUnlocked))
                    .recommendationReason(sd.reason())
                    .recommendationScore(sd.score())
                    .createdAt(doc.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());
    }
}
