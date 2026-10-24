package com.network.document_service.repository;

import com.network.document_service.entity.Faculty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FacultyRepository extends JpaRepository<Faculty, UUID> {
    List<Faculty> findByUniversityId(UUID universityId);
}
