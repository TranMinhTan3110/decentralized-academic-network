package com.network.document_service.repository;

import com.network.document_service.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CourseRepository extends JpaRepository<Course, UUID> {
    Optional<Course> findByCode(String code);
    List<Course> findByAreaIgnoreCase(String area);
    List<Course> findByFacultyId(UUID facultyId);

    @Query("SELECT DISTINCT c.area FROM Course c WHERE c.area IS NOT NULL")
    List<String> findDistinctAreas();
}
