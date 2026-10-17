package com.network.document_service.repository;

import com.network.document_service.entity.UserUnlockedDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserUnlockedDocumentRepository extends JpaRepository<UserUnlockedDocument, UUID> {
    Optional<UserUnlockedDocument> findByUserIdAndDocumentId(UUID userId, UUID documentId);
    boolean existsByUserIdAndDocumentId(UUID userId, UUID documentId);
    Page<UserUnlockedDocument> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
}
