package com.network.document_service.repository;

import com.network.document_service.entity.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class RepositoryTests {

    @Autowired private DocumentRepository documentRepository;
    @Autowired private DocumentLikeRepository documentLikeRepository;
    @Autowired private DocumentBookmarkRepository documentBookmarkRepository;
    @Autowired private CourseRepository courseRepository;
    @Autowired private UniversityRepository universityRepository;

    @Test
    void testSaveAndFindDocument() {
        Document doc = Document.builder()
                .userId(UUID.randomUUID())
                .title("Tài liệu test")
                .ipfsCid("QmTest123")
                .totalPages(10)
                .build();
        Document saved = documentRepository.save(doc);

        assertNotNull(saved.getId());
        Optional<Document> found = documentRepository.findById(saved.getId());
        assertTrue(found.isPresent());
        assertEquals("Tài liệu test", found.get().getTitle());
    }

    @Test
    void testSaveAndCheckLike() {
        UUID userId = UUID.randomUUID();
        Document doc = documentRepository.save(Document.builder()
                .userId(UUID.randomUUID())
                .title("Doc for like")
                .ipfsCid("QmLike")
                .build());

        DocumentLike like = DocumentLike.builder()
                .userId(userId)
                .documentId(doc.getId())
                .reactionType("LIKE")
                .build();
        documentLikeRepository.save(like);

        assertTrue(documentLikeRepository.findByUserIdAndDocumentId(userId, doc.getId()).isPresent());
    }

    @Test
    void testSaveAndCheckBookmark() {
        UUID userId = UUID.randomUUID();
        Document doc = documentRepository.save(Document.builder()
                .userId(UUID.randomUUID())
                .title("Doc for bookmark")
                .ipfsCid("QmBookmark")
                .build());

        DocumentBookmark bookmark = DocumentBookmark.builder()
                .userId(userId)
                .documentId(doc.getId())
                .build();
        documentBookmarkRepository.save(bookmark);

        assertTrue(documentBookmarkRepository.findByUserIdAndDocumentId(userId, doc.getId()).isPresent());
    }

    @Test
    void searchDocumentsForAdminIncludingAuthors_matchesDocumentsOwnedByAuthorId() {
        UUID authorId = UUID.randomUUID();
        Document mine = documentRepository.save(Document.builder()
                .userId(authorId)
                .title("Ôn Midterm TACN")
                .ipfsCid("QmAdminAuthorMine")
                .build());
        documentRepository.save(Document.builder()
                .userId(UUID.randomUUID())
                .title("Đề ôn thi môn trí tuệ nhân tạo")
                .ipfsCid("QmAdminAuthorOther")
                .build());

        var page = documentRepository.searchDocumentsForAdminIncludingAuthors(
                "Huy Phát", List.of(authorId), null, PageRequest.of(0, 10));

        assertEquals(1, page.getTotalElements());
        assertEquals(mine.getId(), page.getContent().get(0).getId());
    }

    @Test
    void searchByKeyword_matchesCaptionCourseAndUniversity() {
        University university = universityRepository.save(University.builder()
                .code("UNI-" + UUID.randomUUID().toString().substring(0, 8))
                .name("Đại học Bách Khoa Hà Nội")
                .build());
        Course course = courseRepository.save(Course.builder()
                .code("XSTK-" + UUID.randomUUID().toString().substring(0, 8))
                .name("Xác suất thống kê")
                .build());

        Document matching = documentRepository.save(Document.builder()
                .userId(UUID.randomUUID())
                .university(university)
                .course(course)
                .title("Slide Chương 3")
                .caption("Biến ngẫu nhiên và phân phối xác suất")
                .ipfsCid("QmSearchMatching")
                .build());
        Document unrelated = documentRepository.save(Document.builder()
                .userId(UUID.randomUUID())
                .title("Giáo trình Vật lý đại cương")
                .docType("THESIS")
                .ipfsCid("QmSearchUnrelated")
                .build());

        var byCourse = documentRepository.searchByKeyword("xác suất", PageRequest.of(0, 10));
        var byUniversity = documentRepository.searchByKeyword("bách khoa", PageRequest.of(0, 10));
        var byCaption = documentRepository.searchByKeyword("phân phối", PageRequest.of(0, 10));
        var byDocType = documentRepository.searchByKeyword("slide", PageRequest.of(0, 10));

        assertEquals(1, byCourse.getTotalElements());
        assertEquals(matching.getId(), byCourse.getContent().get(0).getId());
        assertEquals(1, byUniversity.getTotalElements());
        assertEquals(matching.getId(), byUniversity.getContent().get(0).getId());
        assertEquals(1, byCaption.getTotalElements());
        assertEquals(matching.getId(), byCaption.getContent().get(0).getId());
        assertEquals(1, byDocType.getTotalElements());
        assertTrue(documentRepository.searchByKeyword("vật lý", PageRequest.of(0, 10))
                .getContent()
                .stream()
                .anyMatch(doc -> doc.getId().equals(unrelated.getId())));
    }
}
