package com.network.document_service.repository;

import com.network.document_service.entity.Document;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentRepository extends JpaRepository<Document, UUID>, JpaSpecificationExecutor<Document> {

    Page<Document> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    Page<Document> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    List<Document> findByIdIn(List<UUID> ids);

    int countByCourseId(UUID courseId);

    List<Document> findByCourseIdOrderByCreatedAtDesc(UUID courseId, Pageable pageable);

    @Query("SELECT d FROM Document d WHERE d.status = 'PUBLISHED' " +
           "ORDER BY (COALESCE(d.bookmarkCount, 0) * 5 + COALESCE(d.commentCount, 0) * 4 + COALESCE(d.likeCount, 0) * 3 + COALESCE(d.downloadCount, 0) * 2 + COALESCE(d.viewCount, 0) * 1) DESC, d.createdAt DESC")
    List<Document> findTrendingDocuments(Pageable pageable);

    @Query("SELECT d FROM Document d WHERE d.status = 'PUBLISHED' AND " +
           "(LOWER(d.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(d.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Document> searchByKeyword(@Param("query") String query, Pageable pageable);

    @Modifying
    @Query("UPDATE Document d SET d.likeCount = GREATEST(d.likeCount + :delta, 0) WHERE d.id = :id")
    int updateLikeCount(@Param("id") UUID id, @Param("delta") int delta);

    @Modifying
    @Query("UPDATE Document d SET d.viewCount = d.viewCount + 1 WHERE d.id = :id")
    int incrementViewCount(@Param("id") UUID id);

    @Modifying
    @Query("UPDATE Document d SET d.commentCount = GREATEST(d.commentCount + :delta, 0) WHERE d.id = :id")
    int updateCommentCount(@Param("id") UUID id, @Param("delta") int delta);

    @Modifying
    @Query("UPDATE Document d SET d.bookmarkCount = GREATEST(d.bookmarkCount + :delta, 0) WHERE d.id = :id")
    int updateBookmarkCount(@Param("id") UUID id, @Param("delta") int delta);

    @Modifying
    @Query("UPDATE Document d SET d.downloadCount = d.downloadCount + 1 WHERE d.id = :id")
    int incrementDownloadCount(@Param("id") UUID id);

    List<Document> findByThumbnailUrlIsNullAndIpfsCidIsNotNull(Pageable pageable);
}
