package com.network.user_service.repository;

import com.network.user_service.entity.University;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UniversityRepository extends JpaRepository<University, UUID> {
    Optional<University> findByCode(String code);
    Optional<University> findFirstByNameIgnoreCase(String name);
}
