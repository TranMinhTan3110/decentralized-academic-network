package com.network.document_service.repository;

import com.network.document_service.entity.DocumentLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentLikeRepository extends JpaRepository<DocumentLike, UUID> {
    Optional<DocumentLike> findByUserIdAndDocumentId(UUID userId, UUID documentId);
    boolean existsByUserIdAndDocumentId(UUID userId, UUID documentId);
    void deleteByUserIdAndDocumentId(UUID userId, UUID documentId);
    long countByDocumentId(UUID documentId);
}
