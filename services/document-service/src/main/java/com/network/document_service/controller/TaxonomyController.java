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
    public ResponseEntity<ApiResponse<University>> getUniversityById(@PathVariable("id") UUID id) {
        University uni = taxonomyService.getUniversityById(id);
        return ResponseEntity.ok(ApiResponse.success(uni));
    }

    @PostMapping({"/universities", "/admin/taxonomy/universities"})
    public ResponseEntity<ApiResponse<University>> createUniversity(@RequestBody java.util.Map<String, Object> body) {
        University created = taxonomyService.createUniversity(
                asString(body.get("code")),
                asString(body.get("name")),
                asString(body.get("city")),
                asString(body.get("description"))
        );
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(ApiResponse.success("Đã thêm trường đại học mới", created));
    }

    @PutMapping({"/universities/{id}", "/admin/taxonomy/universities/{id}"})
    public ResponseEntity<ApiResponse<University>> updateUniversity(
            @PathVariable("id") UUID id,
            @RequestBody java.util.Map<String, Object> body) {
        University updated = taxonomyService.updateUniversity(
                id,
                asString(body.get("code")),
                asString(body.get("name")),
                asString(body.get("city")),
                asString(body.get("description"))
        );
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật thông tin trường đại học", updated));
    }

    @DeleteMapping({"/universities/{id}", "/admin/taxonomy/universities/{id}"})
    public ResponseEntity<ApiResponse<Void>> deleteUniversity(@PathVariable("id") UUID id) {
        taxonomyService.deleteUniversity(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa trường đại học khỏi danh mục", null));
    }

    @GetMapping({"/faculties", "/admin/taxonomy/faculties"})
    public ResponseEntity<ApiResponse<List<Faculty>>> getAllFaculties() {
        List<Faculty> list = taxonomyService.getAllFaculties();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/universities/{id}/faculties")
    public ResponseEntity<ApiResponse<List<Faculty>>> getFacultiesByUniversity(@PathVariable("id") UUID id) {
        List<Faculty> list = taxonomyService.getFacultiesByUniversity(id);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping({"/faculties", "/admin/taxonomy/faculties"})
    public ResponseEntity<ApiResponse<Faculty>> createFaculty(@RequestBody java.util.Map<String, Object> body) {
        Faculty created = taxonomyService.createFaculty(
                asString(body.get("code")),
                asString(body.get("name")),
                asString(body.get("description"))
        );
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(ApiResponse.success("Đã thêm Khoa / Viện mới", created));
    }

    @PutMapping({"/faculties/{id}", "/admin/taxonomy/faculties/{id}"})
    public ResponseEntity<ApiResponse<Faculty>> updateFaculty(
            @PathVariable("id") UUID id,
            @RequestBody java.util.Map<String, Object> body) {
        Faculty updated = taxonomyService.updateFaculty(
                id,
                asString(body.get("code")),
                asString(body.get("name")),
                asString(body.get("description"))
        );
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật Khoa / Viện", updated));
    }

    @DeleteMapping({"/faculties/{id}", "/admin/taxonomy/faculties/{id}"})
    public ResponseEntity<ApiResponse<Void>> deleteFaculty(@PathVariable("id") UUID id) {
        taxonomyService.deleteFaculty(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa Khoa / Viện khỏi danh mục", null));
    }

    @GetMapping("/courses")
    public ResponseEntity<ApiResponse<List<Course>>> getCourses(
            @RequestParam(name = "area", required = false) String area,
            @RequestParam(name = "facultyId", required = false) UUID facultyId) {
        List<Course> list = taxonomyService.getCourses(area, facultyId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/courses/{id}")
    public ResponseEntity<ApiResponse<CourseDetailResponse>> getCourseDetail(@PathVariable("id") UUID id) {
        CourseDetailResponse detail = taxonomyService.getCourseDetail(id);
        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    @PostMapping({"/courses", "/admin/taxonomy/courses"})
    public ResponseEntity<ApiResponse<Course>> createCourse(@RequestBody java.util.Map<String, Object> body) {
        Course created = taxonomyService.createCourse(
                asString(body.get("code")),
                asString(body.get("name")),
                asString(body.get("area")),
                asString(body.get("description"))
        );
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(ApiResponse.success("Đã thêm môn học mới", created));
    }

    @PutMapping({"/courses/{id}", "/admin/taxonomy/courses/{id}"})
    public ResponseEntity<ApiResponse<Course>> updateCourse(
            @PathVariable("id") UUID id,
            @RequestBody java.util.Map<String, Object> body) {
        Course updated = taxonomyService.updateCourse(
                id,
                asString(body.get("code")),
                asString(body.get("name")),
                asString(body.get("area")),
                asString(body.get("description"))
        );
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật môn học", updated));
    }

    @DeleteMapping({"/courses/{id}", "/admin/taxonomy/courses/{id}"})
    public ResponseEntity<ApiResponse<Void>> deleteCourse(@PathVariable("id") UUID id) {
        taxonomyService.deleteCourse(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa môn học khỏi danh mục", null));
    }

    @GetMapping({"/taxonomy/areas", "/courses/areas"})
    public ResponseEntity<ApiResponse<List<String>>> getAreas() {
        List<String> areas = taxonomyService.getAreas();
        return ResponseEntity.ok(ApiResponse.success(areas));
    }

    private String asString(Object val) {
        return val != null ? String.valueOf(val) : null;
    }
}
