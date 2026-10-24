package com.network.document_service.controller;

import com.network.document_service.dto.response.ApiResponse;
import com.network.document_service.dto.response.CourseDetailResponse;
import com.network.document_service.entity.Course;
import com.network.document_service.entity.Faculty;
import com.network.document_service.entity.University;
import com.network.document_service.service.TaxonomyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api", "/api/v1"})
public class TaxonomyController {

    private final TaxonomyService taxonomyService;

    public TaxonomyController(TaxonomyService taxonomyService) {
        this.taxonomyService = taxonomyService;
    }

    @GetMapping("/universities")
    public ResponseEntity<ApiResponse<List<University>>> getAllUniversities() {
        List<University> list = taxonomyService.getAllUniversities();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/universities/{id}")
    public ResponseEntity<ApiResponse<University>> getUniversityById(@PathVariable UUID id) {
        University uni = taxonomyService.getUniversityById(id);
        return ResponseEntity.ok(ApiResponse.success(uni));
    }

    @GetMapping("/universities/{id}/faculties")
    public ResponseEntity<ApiResponse<List<Faculty>>> getFacultiesByUniversity(@PathVariable UUID id) {
        List<Faculty> list = taxonomyService.getFacultiesByUniversity(id);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/courses")
    public ResponseEntity<ApiResponse<List<Course>>> getCourses(
            @RequestParam(required = false) String area,
            @RequestParam(required = false) UUID facultyId) {
        List<Course> list = taxonomyService.getCourses(area, facultyId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/courses/{id}")
    public ResponseEntity<ApiResponse<CourseDetailResponse>> getCourseDetail(@PathVariable UUID id) {
        CourseDetailResponse detail = taxonomyService.getCourseDetail(id);
        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    @GetMapping({"/taxonomy/areas", "/courses/areas"})
    public ResponseEntity<ApiResponse<List<String>>> getAreas() {
        List<String> areas = taxonomyService.getAreas();
        return ResponseEntity.ok(ApiResponse.success(areas));
    }
}
