package com.network.document_service.repository;

import com.network.document_service.entity.DocumentComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentCommentRepository extends JpaRepository<DocumentComment, UUID> {
    Page<DocumentComment> findByDocumentIdAndParentIdIsNullOrderByCreatedAtDesc(UUID documentId, Pageable pageable);
    List<DocumentComment> findByParentIdOrderByCreatedAtAsc(UUID parentId);
    List<DocumentComment> findByDocumentIdAndPageNumber(UUID documentId, Integer pageNumber);
    long countByDocumentId(UUID documentId);
}
