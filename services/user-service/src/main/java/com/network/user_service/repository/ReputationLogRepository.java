package com.network.user_service.repository;

import com.network.user_service.entity.ReputationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ReputationLogRepository extends JpaRepository<ReputationLog, UUID> {

    boolean existsByIdempotencyKey(String idempotencyKey);

    List<ReputationLog> findByUserIdOrderByCreatedAtDesc(UUID userId);

    @Query("SELECT r.userId, COALESCE(SUM(r.points), 0) FROM ReputationLog r " +
           "WHERE r.createdAt >= :since GROUP BY r.userId")
    List<Object[]> sumPointsByUserSince(@Param("since") OffsetDateTime since);

    @Query("SELECT r.userId, COUNT(r) FROM ReputationLog r " +
           "WHERE r.actionType = :actionType AND r.createdAt >= :since GROUP BY r.userId")
    List<Object[]> countActionsByUserSince(
            @Param("actionType") String actionType,
            @Param("since") OffsetDateTime since);

    @Query("SELECT r.userId, COUNT(r) FROM ReputationLog r " +
           "WHERE r.actionType = :actionType GROUP BY r.userId")
    List<Object[]> countAllTimeActionsByUser(@Param("actionType") String actionType);
}

