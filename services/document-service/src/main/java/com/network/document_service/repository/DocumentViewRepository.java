package com.network.document_service.repository;

import com.network.document_service.entity.DocumentView;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface DocumentViewRepository extends JpaRepository<DocumentView, UUID> {

    boolean existsByUserIdAndDocumentIdAndViewDate(UUID userId, UUID documentId, java.time.LocalDate viewDate);

    @Query(value = "SELECT v.documentId FROM DocumentView v WHERE v.userId = :userId " +
            "GROUP BY v.documentId ORDER BY MAX(v.viewedAt) DESC",
            countQuery = "SELECT COUNT(DISTINCT v.documentId) FROM DocumentView v WHERE v.userId = :userId")
    Page<UUID> findViewedDocumentIds(@Param("userId") UUID userId, Pageable pageable);
}
