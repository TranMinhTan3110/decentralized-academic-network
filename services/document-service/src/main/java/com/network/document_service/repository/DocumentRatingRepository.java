package com.network.document_service.repository;

import com.network.document_service.entity.DocumentRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentRatingRepository extends JpaRepository<DocumentRating, UUID> {
    Optional<DocumentRating> findByUserIdAndDocumentId(UUID userId, UUID documentId);
    List<DocumentRating> findByDocumentIdOrderByCreatedAtDesc(UUID documentId);
}

