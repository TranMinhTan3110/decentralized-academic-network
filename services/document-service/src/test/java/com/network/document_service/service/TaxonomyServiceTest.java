package com.network.document_service.service;

import com.network.document_service.entity.Course;
import com.network.document_service.entity.Faculty;
import com.network.document_service.entity.University;
import com.network.document_service.exception.ResourceNotFoundException;
import com.network.document_service.repository.CourseRepository;
import com.network.document_service.repository.FacultyRepository;
import com.network.document_service.repository.UniversityRepository;
import com.network.document_service.service.impl.TaxonomyServiceImpl;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class TaxonomyServiceTest {

    private final UniversityRepository universityRepo = mock(UniversityRepository.class);
    private final FacultyRepository facultyRepo = mock(FacultyRepository.class);
    private final CourseRepository courseRepo = mock(CourseRepository.class);
    private final com.network.document_service.repository.DocumentRepository documentRepo = mock(com.network.document_service.repository.DocumentRepository.class);

    private final TaxonomyService taxonomyService = new TaxonomyServiceImpl(universityRepo, facultyRepo, courseRepo, documentRepo);

    @Test
    void getCourseDetail_shouldReturnDetailWithCount() {
        UUID courseId = UUID.randomUUID();
        when(courseRepo.findById(courseId)).thenReturn(Optional.of(Course.builder().id(courseId).name("CS101").code("CS101").build()));
        when(documentRepo.countByCourseId(courseId)).thenReturn(7);
        when(documentRepo.findByCourseIdOrderByCreatedAtDesc(eq(courseId), any())).thenReturn(List.of());

        var detail = taxonomyService.getCourseDetail(courseId);
        assertNotNull(detail);
        assertEquals("CS101", detail.getName());
        assertEquals(7, detail.getDocumentCount());
    }

    @Test
    void getAllUniversities_shouldReturnList() {
        when(universityRepo.findAll()).thenReturn(List.of(University.builder().name("ĐH Bách Khoa").build()));

        var result = taxonomyService.getAllUniversities();
        assertEquals(1, result.size());
        assertEquals("ĐH Bách Khoa", result.get(0).getName());
    }

    @Test
    void getUniversityById_found_shouldReturn() {
        UUID id = UUID.randomUUID();
        when(universityRepo.findById(id)).thenReturn(Optional.of(University.builder().id(id).name("NEU").build()));

        University uni = taxonomyService.getUniversityById(id);
        assertNotNull(uni);
        assertEquals("NEU", uni.getName());
    }

    @Test
    void getUniversityById_notFound_shouldThrow() {
        UUID id = UUID.randomUUID();
        when(universityRepo.findById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> taxonomyService.getUniversityById(id));
    }

    @Test
    void getFacultiesByUniversity_shouldReturnList() {
        UUID uniId = UUID.randomUUID();
        when(facultyRepo.findByUniversityId(uniId)).thenReturn(List.of(Faculty.builder().name("CNTT").build()));

        var list = taxonomyService.getFacultiesByUniversity(uniId);
        assertEquals(1, list.size());
    }

    @Test
    void getCourses_withFacultyId_shouldFilterByFaculty() {
        UUID fId = UUID.randomUUID();
        when(courseRepo.findByFacultyId(fId)).thenReturn(List.of(Course.builder().name("Java").build()));

        var list = taxonomyService.getCourses(null, fId);
        assertEquals(1, list.size());
    }

    @Test
    void getCourses_withArea_shouldFilterByArea() {
        when(courseRepo.findByAreaIgnoreCase("Toan")).thenReturn(List.of(Course.builder().name("Giai tich").build()));

        var list = taxonomyService.getCourses("Toan", null);
        assertEquals(1, list.size());
    }

    @Test
    void getCourses_withoutFilter_shouldReturnAll() {
        when(courseRepo.findAll()).thenReturn(List.of(Course.builder().name("General").build()));

        var list = taxonomyService.getCourses(null, null);
        assertEquals(1, list.size());
    }

    @Test
    void getAreas_shouldReturnDistinctAreas() {
        when(courseRepo.findDistinctAreas()).thenReturn(List.of("IT", "Finance"));

        var list = taxonomyService.getAreas();
        assertEquals(2, list.size());
        assertEquals("IT", list.get(0));
    }
}
