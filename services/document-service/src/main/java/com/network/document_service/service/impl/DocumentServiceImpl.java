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

        boolean isMyUploads = "my-uploads".equalsIgnoreCase(filter);
        if (isMyUploads && currentUserId == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để xem tài liệu của bạn");
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
                    Sort.by(Sort.Direction.DESC, "likeCount", "viewCount"));
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
}
