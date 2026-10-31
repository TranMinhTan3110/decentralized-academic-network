package com.network.user_service.repository;

import com.network.user_service.entity.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    Optional<User> findByUsernameOrEmail(String username, String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.id = :id")
    Optional<User> findByIdForUpdate(@Param("id") UUID id);

    @Query("SELECT u FROM User u WHERE u.status = 'ACTIVE' AND u.role <> 'ADMIN' " +
           "ORDER BY u.reputationPoints DESC, u.followerCount DESC, u.totalUploads DESC")
    List<User> findTopSuggestedUsers(Pageable pageable);

    @Query("SELECT u FROM User u LEFT JOIN u.university uni " +
           "WHERE u.status = 'ACTIVE' AND u.role <> 'ADMIN' " +
           "AND u.id <> :currentUserId " +
           "AND NOT EXISTS (SELECT 1 FROM UserFollow uf WHERE uf.id.followerId = :currentUserId AND uf.id.followingId = u.id) " +
           "ORDER BY (CASE WHEN :universityId IS NOT NULL AND uni.id = :universityId THEN 0 ELSE 1 END) ASC, " +
           "u.reputationPoints DESC, u.followerCount DESC, u.totalUploads DESC")
    List<User> findSuggestedUsersForUser(
            @Param("currentUserId") UUID currentUserId,
            @Param("universityId") UUID universityId,
            Pageable pageable);
}
