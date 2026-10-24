package com.network.document_service.service;

import com.network.document_service.dto.response.CourseDetailResponse;
import com.network.document_service.entity.Course;
import com.network.document_service.entity.Faculty;
import com.network.document_service.entity.University;

import java.util.List;
import java.util.UUID;

public interface TaxonomyService {
    List<University> getAllUniversities();
    University getUniversityById(UUID id);
    List<Faculty> getFacultiesByUniversity(UUID universityId);
    List<Course> getCourses(String area, UUID facultyId);
    CourseDetailResponse getCourseDetail(UUID courseId);
    List<String> getAreas();
}
