package com.network.document_service.service;

import com.network.document_service.client.IpfsStorageService;
import com.network.document_service.client.PdfProcessingService;
import com.network.document_service.client.UserServiceClient;
import com.network.document_service.dto.request.DocumentUploadRequest;
import com.network.document_service.dto.response.DocumentDetailResponse;
import com.network.document_service.dto.response.IpfsUploadResult;
import com.network.document_service.entity.Course;
import com.network.document_service.entity.Document;
import com.network.document_service.entity.University;
import com.network.document_service.event.DocumentEventProducer;
import com.network.document_service.exception.BadRequestException;
import com.network.document_service.exception.ForbiddenException;
import com.network.document_service.exception.ResourceNotFoundException;
import com.network.document_service.repository.*;
import com.network.document_service.service.impl.DocumentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class DocumentServiceTest {

    private DocumentRepository docRepo;
    private UniversityRepository uniRepo;
    private CourseRepository courseRepo;
    private DocumentLikeRepository likeRepo;
    private DocumentBookmarkRepository bookmarkRepo;
    private UserUnlockedDocumentRepository unlockRepo;
    private PdfProcessingService pdfService;
    private IpfsStorageService ipfsStorageService;
    private UserServiceClient userServiceClient;
    private DocumentEventProducer eventProducer;

    private DocumentService service;

    @BeforeEach
    void setUp() {
        docRepo = mock(DocumentRepository.class);
        uniRepo = mock(UniversityRepository.class);
        courseRepo = mock(CourseRepository.class);
        likeRepo = mock(DocumentLikeRepository.class);
        bookmarkRepo = mock(DocumentBookmarkRepository.class);
        unlockRepo = mock(UserUnlockedDocumentRepository.class);
        pdfService = mock(PdfProcessingService.class);
        ipfsStorageService = mock(IpfsStorageService.class);
        userServiceClient = mock(UserServiceClient.class);
        eventProducer = mock(DocumentEventProducer.class);

        service = new DocumentServiceImpl(
                docRepo, uniRepo, courseRepo, likeRepo, bookmarkRepo, unlockRepo,
                pdfService, ipfsStorageService, userServiceClient, eventProducer
        );
    }

    @Test
    void uploadDocument_withNullOrEmptyFile_shouldThrowBadRequest() {
        DocumentUploadRequest reqNull = DocumentUploadRequest.builder().title("Doc").file(null).build();
        assertThrows(BadRequestException.class, () -> service.uploadDocument(UUID.randomUUID(), reqNull));

        MockMultipartFile emptyFile = new MockMultipartFile("file", "empty.pdf", "application/pdf", new byte[0]);
        DocumentUploadRequest reqEmpty = DocumentUploadRequest.builder().title("Doc").file(emptyFile).build();
        assertThrows(BadRequestException.class, () -> service.uploadDocument(UUID.randomUUID(), reqEmpty));
    }

    @Test
    void uploadDocument_withNonPdfFile_shouldThrowBadRequest() {
        MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "Hello".getBytes());
        DocumentUploadRequest req = DocumentUploadRequest.builder()
                .title("Test Doc")
                .file(file)
                .build();

        assertThrows(BadRequestException.class, () -> service.uploadDocument(UUID.randomUUID(), req));
    }

    @Test
    void uploadDocument_success_withUniAndCourse() throws IOException {
        byte[] pdfBytes = "%PDF-1.4 sample content".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "doc.pdf", "application/pdf", pdfBytes);
        UUID uniId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();
        DocumentUploadRequest req = DocumentUploadRequest.builder()
                .title("OOP Guide")
                .universityId(uniId)
                .courseId(courseId)
                .unlockPointsRequired(10)
                .file(file)
                .build();

        when(uniRepo.findById(uniId)).thenReturn(Optional.of(University.builder().id(uniId).name("HUST").build()));
        when(courseRepo.findById(courseId)).thenReturn(Optional.of(Course.builder().id(courseId).name("OOP").build()));
        when(pdfService.extractTotalPages(any(byte[].class))).thenReturn(10);
        when(pdfService.generatePreviewPdf(any(), eq(3))).thenReturn("preview".getBytes());
        when(pdfService.generateThumbnailPng(any(byte[].class))).thenReturn("png".getBytes());
        when(ipfsStorageService.uploadFile(any(), any())).thenReturn(
                new IpfsUploadResult("QmHash123", "QmPreview123", true, true, "http://localhost:8080/ipfs/QmHash123")
        );
        when(ipfsStorageService.uploadBytes(any(), any())).thenReturn(
                new IpfsUploadResult("QmPreview123", "QmPreview123", true, true, "http://localhost:8080/ipfs/QmPreview123")
        );
        when(docRepo.save(any(Document.class))).thenAnswer(i -> {
            Document d = i.getArgument(0);
            d.setId(UUID.randomUUID());
            return d;
        });

        DocumentDetailResponse resp = service.uploadDocument(UUID.randomUUID(), req);

        assertNotNull(resp);
        assertEquals("OOP Guide", resp.getTitle());
        assertEquals("QmHash123", resp.getIpfsCid());
        assertEquals(10, resp.getTotalPages());
        verify(eventProducer).sendDocumentUploaded(any());
    }

    @Test
    void uploadDocument_pdfBoxExceptions_handledGracefully() throws IOException {
        byte[] pdfBytes = "%PDF-1.4 sample content".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "doc.pdf", "application/pdf", pdfBytes);
        DocumentUploadRequest req = DocumentUploadRequest.builder()
                .title("OOP Guide")
                .unlockPointsRequired(0)
                .file(file)
                .build();

        when(pdfService.extractTotalPages(any(byte[].class))).thenThrow(new RuntimeException("Extract error"));
        when(pdfService.generatePreviewPdf(any(), eq(3))).thenThrow(new RuntimeException("Preview error"));
        when(pdfService.generateThumbnailPng(any(byte[].class))).thenThrow(new RuntimeException("Thumb error"));
        when(ipfsStorageService.uploadFile(any(), any())).thenReturn(
                new IpfsUploadResult("QmHash123", "QmPreview123", true, false, "http://localhost:8080/ipfs/QmHash123")
        );
        when(docRepo.save(any(Document.class))).thenAnswer(i -> {
            Document d = i.getArgument(0);
            d.setId(UUID.randomUUID());
            return d;
        });

        DocumentDetailResponse resp = service.uploadDocument(UUID.randomUUID(), req);
        assertNotNull(resp);
        assertEquals(1, resp.getTotalPages());
        assertFalse(resp.getIsBlurLocked());
    }

    @Test
    void getDocumentDetail_notFound_shouldThrow() {
        UUID docId = UUID.randomUUID();
        when(docRepo.findById(docId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.getDocumentDetail(docId, UUID.randomUUID()));
    }

    @Test
    void getDocumentDetail_whenLockedAndNotAuthor_masksIpfsCid() {
        UUID docId = UUID.randomUUID();
        UUID authorId = UUID.randomUUID();
        UUID visitorId = UUID.randomUUID();

        Document doc = Document.builder()
                .id(docId)
                .userId(authorId)
                .title("Doc 1")
                .ipfsCid("QmFullSecret")
                .previewIpfsCid("QmPreview")
                .isBlurLocked(true)
                .unlockPointsRequired(10)
                .build();

        when(docRepo.findById(docId)).thenReturn(Optional.of(doc));
        when(unlockRepo.existsByUserIdAndDocumentId(visitorId, docId)).thenReturn(false);

        DocumentDetailResponse resp = service.getDocumentDetail(docId, visitorId);
        assertNotNull(resp);
        assertNull(resp.getIpfsCid());
        assertEquals("QmPreview", resp.getPreviewIpfsCid());
        assertFalse(resp.getHasUnlocked());
    }

    @Test
    void getDocumentDetail_whenAuthor_showsFullIpfsCid() {
        UUID docId = UUID.randomUUID();
        UUID authorId = UUID.randomUUID();

        Document doc = Document.builder()
                .id(docId)
                .userId(authorId)
                .title("Doc 1")
                .ipfsCid("QmFullSecret")
                .previewIpfsCid("QmPreview")
                .isBlurLocked(true)
                .unlockPointsRequired(10)
                .build();

        when(docRepo.findById(docId)).thenReturn(Optional.of(doc));

        DocumentDetailResponse resp = service.getDocumentDetail(docId, authorId);
        assertNotNull(resp);
        assertEquals("QmFullSecret", resp.getIpfsCid());
        assertTrue(resp.getHasUnlocked());
    }

    @Test
    @SuppressWarnings("unchecked")
    void getDocumentsFeed_trendingAndFilters_shouldReturnPage() {
        UUID uniId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();
        Document doc = Document.builder().id(UUID.randomUUID()).title("Doc 1").userId(UUID.randomUUID()).build();
        when(docRepo.findAll(any(Specification.class), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(doc)));

        var feed = service.getDocumentsFeed("trending", uniId, courseId, "2025", UUID.randomUUID(), PageRequest.of(0, 10));
        assertNotNull(feed);
        assertEquals(1, feed.getContent().size());
    }

    @Test
    void recordView_whenExists_incrementsAndEmitsEvent() {
        UUID docId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        when(docRepo.existsById(docId)).thenReturn(true);

        service.recordView(docId, userId);

        verify(docRepo).incrementViewCount(docId);
        verify(eventProducer).sendDocumentInteracted(any());
    }

    @Test
    void recordView_whenNotExists_throws() {
        UUID docId = UUID.randomUUID();
        when(docRepo.existsById(docId)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> service.recordView(docId, null));
    }

    @Test
    void deleteDocument_byAuthor_shouldDelete() {
        UUID docId = UUID.randomUUID();
        UUID authorId = UUID.randomUUID();
        Document doc = Document.builder().id(docId).userId(authorId).build();
        when(docRepo.findById(docId)).thenReturn(Optional.of(doc));

        service.deleteDocument(docId, authorId);
        verify(docRepo).delete(doc);
    }

    @Test
    void deleteDocument_byOther_shouldThrowForbidden() {
        UUID docId = UUID.randomUUID();
        UUID authorId = UUID.randomUUID();
        UUID otherId = UUID.randomUUID();
        Document doc = Document.builder().id(docId).userId(authorId).build();
        when(docRepo.findById(docId)).thenReturn(Optional.of(doc));

        assertThrows(ForbiddenException.class, () -> service.deleteDocument(docId, otherId));
    }
}
