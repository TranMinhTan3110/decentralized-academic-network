package com.network.document_service.service.impl;

import com.network.document_service.dto.response.AuthorSummaryDto;
import com.network.document_service.dto.response.CourseDetailResponse;
import com.network.document_service.dto.response.DocumentFeedResponse;
import com.network.document_service.entity.Course;
import com.network.document_service.entity.Document;
import com.network.document_service.entity.Faculty;
import com.network.document_service.entity.University;
import com.network.document_service.exception.ResourceNotFoundException;
import com.network.document_service.repository.CourseRepository;
import com.network.document_service.repository.DocumentRepository;
import com.network.document_service.repository.FacultyRepository;
import com.network.document_service.repository.UniversityRepository;
import com.network.document_service.service.TaxonomyService;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class TaxonomyServiceImpl implements TaxonomyService {

    private final UniversityRepository universityRepository;
    private final FacultyRepository facultyRepository;
    private final CourseRepository courseRepository;
    private final DocumentRepository documentRepository;

    public TaxonomyServiceImpl(UniversityRepository universityRepository,
                               FacultyRepository facultyRepository,
                               CourseRepository courseRepository,
                               DocumentRepository documentRepository) {
        this.universityRepository = universityRepository;
        this.facultyRepository = facultyRepository;
        this.courseRepository = courseRepository;
        this.documentRepository = documentRepository;
    }

    @Override
    @Cacheable(value = "taxonomyCache", key = "'allUniversities'")
    public List<University> getAllUniversities() {
        return universityRepository.findAll();
    }

    @Override
    public University getUniversityById(UUID id) {
        return universityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trường đại học không tồn tại với ID: " + id));
    }

    @Override
    @Cacheable(value = "taxonomyCache", key = "'faculties:' + #universityId")
    public List<Faculty> getFacultiesByUniversity(UUID universityId) {
        return facultyRepository.findByUniversityId(universityId);
    }

    @Override
    public List<Course> getCourses(String area, UUID facultyId) {
        if (facultyId != null) {
            return courseRepository.findByFacultyId(facultyId);
        }
        if (area != null && !area.isBlank()) {
            return courseRepository.findByAreaIgnoreCase(area.trim());
        }
        return courseRepository.findAll();
    }

    @Override
    public CourseDetailResponse getCourseDetail(UUID courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Môn học không tồn tại với ID: " + courseId));

        int docCount = documentRepository.countByCourseId(courseId);
        Pageable top5 = PageRequest.of(0, 5);
        List<Document> documents = documentRepository.findByCourseIdOrderByCreatedAtDesc(courseId, top5);

        List<DocumentFeedResponse> recentDocs = documents != null ? documents.stream()
                .map(doc -> DocumentFeedResponse.builder()
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
                        .courseName(course.getName())
                        .author(AuthorSummaryDto.anonymous())
                        .createdAt(doc.getCreatedAt())
                        .build())
                .toList() : Collections.emptyList();

        return CourseDetailResponse.builder()
                .id(course.getId())
                .name(course.getName())
                .code(course.getCode())
                .area(course.getArea())
                .credits(null)
                .documentCount(docCount)
                .recentDocuments(recentDocs)
                .build();
    }

    @Override
    public List<String> getAreas() {
        return courseRepository.findDistinctAreas();
    }
}
