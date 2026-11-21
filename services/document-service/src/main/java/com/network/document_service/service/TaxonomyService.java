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
    University createUniversity(String code, String name, String city, String description);
    University updateUniversity(UUID id, String code, String name, String city, String description);
    void deleteUniversity(UUID id);

    List<Faculty> getAllFaculties();
    List<Faculty> getFacultiesByUniversity(UUID universityId);
    Faculty createFaculty(String code, String name, String description);
    Faculty updateFaculty(UUID id, String code, String name, String description);
    void deleteFaculty(UUID id);

    List<Course> getCourses(String area, UUID facultyId);
    CourseDetailResponse getCourseDetail(UUID courseId);
    Course createCourse(String code, String name, String area, String description);
    Course updateCourse(UUID id, String code, String name, String area, String description);
    void deleteCourse(UUID id);
    List<String> getAreas();
}
