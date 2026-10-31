package com.network.document_service.repository;

import com.network.document_service.entity.DocumentBookmark;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentBookmarkRepository extends JpaRepository<DocumentBookmark, UUID> {
    Optional<DocumentBookmark> findByUserIdAndDocumentId(UUID userId, UUID documentId);
    boolean existsByUserIdAndDocumentId(UUID userId, UUID documentId);
    void deleteByUserIdAndDocumentId(UUID userId, UUID documentId);
    Page<DocumentBookmark> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
    List<DocumentBookmark> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<DocumentBookmark> findByDocumentIdIn(Collection<UUID> documentIds);
    List<DocumentBookmark> findByUserIdInOrderByCreatedAtDesc(Collection<UUID> userIds);
    long countByDocumentId(UUID documentId);
}
