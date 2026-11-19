package com.network.document_service.service.impl;

import com.network.document_service.dto.response.AuthorSummaryDto;
import com.network.document_service.dto.response.CourseDetailResponse;
import com.network.document_service.dto.response.DocumentFeedResponse;
import com.network.document_service.entity.Course;
import com.network.document_service.entity.Document;
import com.network.document_service.entity.Faculty;
import com.network.document_service.entity.University;
import com.network.document_service.exception.BadRequestException;
import com.network.document_service.exception.ResourceNotFoundException;
import com.network.document_service.repository.CourseRepository;
import com.network.document_service.repository.DocumentRepository;
import com.network.document_service.repository.FacultyRepository;
import com.network.document_service.repository.UniversityRepository;
import com.network.document_service.service.TaxonomyService;
import org.springframework.cache.annotation.CacheEvict;
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
    @Transactional
    @CacheEvict(value = "taxonomyCache", allEntries = true)
    public University createUniversity(String code, String name, String city, String description) {
        String cleanCode = code != null ? code.trim().toUpperCase() : "";
        String cleanName = name != null ? name.trim() : "";
        if (cleanCode.isEmpty() || cleanName.isEmpty()) {
            throw new BadRequestException("Mã trường và tên trường không được để trống");
        }
        universityRepository.findByCodeIgnoreCase(cleanCode).ifPresent(existing -> {
            throw new BadRequestException("Mã trường '" + cleanCode + "' đã tồn tại trong hệ thống");
        });
        University uni = University.builder()
                .code(cleanCode)
                .name(cleanName)
                .city(city != null && !city.isBlank() ? city.trim() : "Hà Nội")
                .description(description != null ? description.trim() : null)
                .totalDocumentsCount(0)
                .build();
        return universityRepository.save(uni);
    }

    @Override
    @Transactional
    @CacheEvict(value = "taxonomyCache", allEntries = true)
    public University updateUniversity(UUID id, String code, String name, String city, String description) {
        University uni = getUniversityById(id);
        if (code != null && !code.isBlank()) {
            String cleanCode = code.trim().toUpperCase();
            universityRepository.findByCodeIgnoreCase(cleanCode)
                    .filter(existing -> !existing.getId().equals(id))
                    .ifPresent(existing -> {
                        throw new BadRequestException("Mã trường '" + cleanCode + "' đã được sử dụng bởi trường khác");
                    });
            uni.setCode(cleanCode);
        }
        if (name != null && !name.isBlank()) {
            uni.setName(name.trim());
        }
        if (city != null && !city.isBlank()) {
            uni.setCity(city.trim());
        }
        if (description != null) {
            uni.setDescription(description.trim());
        }
        return universityRepository.save(uni);
    }

    @Override
    @Transactional
    @CacheEvict(value = "taxonomyCache", allEntries = true)
    public void deleteUniversity(UUID id) {
        University uni = getUniversityById(id);
        universityRepository.delete(uni);
    }

    @Override
    @Cacheable(value = "taxonomyCache", key = "'allFaculties'")
    public List<Faculty> getAllFaculties() {
        return facultyRepository.findAll();
    }

    @Override
    @Cacheable(value = "taxonomyCache", key = "'faculties:' + #universityId")
    public List<Faculty> getFacultiesByUniversity(UUID universityId) {
        List<Faculty> byUni = facultyRepository.findByUniversityId(universityId);
        if (byUni != null && !byUni.isEmpty()) {
            return byUni;
        }
        return facultyRepository.findAll();
    }

    @Override
    @Transactional
    @CacheEvict(value = "taxonomyCache", allEntries = true)
    public Faculty createFaculty(String code, String name, String description) {
        String cleanCode = code != null ? code.trim().toUpperCase() : "";
        String cleanName = name != null ? name.trim() : "";
        if (cleanCode.isEmpty() || cleanName.isEmpty()) {
            throw new BadRequestException("Mã khoa / viện và tên khoa / viện không được để trống");
        }
        facultyRepository.findByCodeIgnoreCase(cleanCode).ifPresent(existing -> {
            throw new BadRequestException("Mã khoa / viện '" + cleanCode + "' đã tồn tại trong hệ thống");
        });
        Faculty faculty = Faculty.builder()
                .code(cleanCode)
                .name(cleanName)
                .description(description != null ? description.trim() : null)
                .build();
        return facultyRepository.save(faculty);
    }

    @Override
    @Transactional
    @CacheEvict(value = "taxonomyCache", allEntries = true)
    public Faculty updateFaculty(UUID id, String code, String name, String description) {
        Faculty faculty = facultyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Khoa / Viện không tồn tại với ID: " + id));
        if (code != null && !code.isBlank()) {
            String cleanCode = code.trim().toUpperCase();
            facultyRepository.findByCodeIgnoreCase(cleanCode)
                    .filter(existing -> !existing.getId().equals(id))
                    .ifPresent(existing -> {
                        throw new BadRequestException("Mã khoa / viện '" + cleanCode + "' đã được sử dụng");
                    });
            faculty.setCode(cleanCode);
        }
        if (name != null && !name.isBlank()) {
            faculty.setName(name.trim());
        }
        if (description != null) {
            faculty.setDescription(description.trim());
        }
        return facultyRepository.save(faculty);
    }

    @Override
    @Transactional
    @CacheEvict(value = "taxonomyCache", allEntries = true)
    public void deleteFaculty(UUID id) {
        Faculty faculty = facultyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Khoa / Viện không tồn tại với ID: " + id));
        facultyRepository.delete(faculty);
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
    @Transactional
    @CacheEvict(value = "taxonomyCache", allEntries = true)
    public Course createCourse(String code, String name, String area, String description) {
        String cleanCode = code != null ? code.trim().toUpperCase() : "";
        String cleanName = name != null ? name.trim() : "";
        if (cleanCode.isEmpty() || cleanName.isEmpty()) {
            throw new BadRequestException("Mã môn học và tên môn học không được để trống");
        }
        courseRepository.findByCodeIgnoreCase(cleanCode).ifPresent(existing -> {
            throw new BadRequestException("Mã môn học '" + cleanCode + "' đã tồn tại trong hệ thống");
        });
        Course course = Course.builder()
                .code(cleanCode)
                .name(cleanName)
                .area(area != null && !area.isBlank() ? area.trim() : "Đại cương")
                .description(description != null ? description.trim() : null)
                .build();
        return courseRepository.save(course);
    }

    @Override
    @Transactional
    @CacheEvict(value = "taxonomyCache", allEntries = true)
    public Course updateCourse(UUID id, String code, String name, String area, String description) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Môn học không tồn tại với ID: " + id));
        if (code != null && !code.isBlank()) {
            String cleanCode = code.trim().toUpperCase();
            courseRepository.findByCodeIgnoreCase(cleanCode)
                    .filter(existing -> !existing.getId().equals(id))
                    .ifPresent(existing -> {
                        throw new BadRequestException("Mã môn học '" + cleanCode + "' đã được sử dụng");
                    });
            course.setCode(cleanCode);
        }
        if (name != null && !name.isBlank()) {
            course.setName(name.trim());
        }
        if (area != null && !area.isBlank()) {
            course.setArea(area.trim());
        }
        if (description != null) {
            course.setDescription(description.trim());
        }
        return courseRepository.save(course);
    }

    @Override
    @Transactional
    @CacheEvict(value = "taxonomyCache", allEntries = true)
    public void deleteCourse(UUID id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Môn học không tồn tại với ID: " + id));
        courseRepository.delete(course);
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
