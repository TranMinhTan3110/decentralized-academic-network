package com.network.document_service.service.impl;

import com.network.document_service.entity.Course;
import com.network.document_service.entity.Faculty;
import com.network.document_service.entity.University;
import com.network.document_service.exception.ResourceNotFoundException;
import com.network.document_service.repository.CourseRepository;
import com.network.document_service.repository.FacultyRepository;
import com.network.document_service.repository.UniversityRepository;
import com.network.document_service.service.TaxonomyService;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class TaxonomyServiceImpl implements TaxonomyService {

    private final UniversityRepository universityRepository;
    private final FacultyRepository facultyRepository;
    private final CourseRepository courseRepository;

    public TaxonomyServiceImpl(UniversityRepository universityRepository,
                               FacultyRepository facultyRepository,
                               CourseRepository courseRepository) {
        this.universityRepository = universityRepository;
        this.facultyRepository = facultyRepository;
        this.courseRepository = courseRepository;
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
}
