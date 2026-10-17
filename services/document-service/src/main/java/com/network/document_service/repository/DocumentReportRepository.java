package com.network.document_service.repository;

import com.network.document_service.entity.DocumentReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentReportRepository extends JpaRepository<DocumentReport, UUID> {
    List<DocumentReport> findByDocumentId(UUID documentId);
    List<DocumentReport> findAllByOrderByCreatedAtDesc();
}
