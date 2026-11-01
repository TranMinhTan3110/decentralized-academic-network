package com.network.user_service.repository;

import com.network.user_service.entity.UserFollow;
import com.network.user_service.entity.UserFollowId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserFollowRepository extends JpaRepository<UserFollow, UserFollowId> {

    boolean existsByIdFollowerIdAndIdFollowingId(UUID followerId, UUID followingId);

    Optional<UserFollow> findByIdFollowerIdAndIdFollowingId(UUID followerId, UUID followingId);

    void deleteByIdFollowerIdAndIdFollowingId(UUID followerId, UUID followingId);

    @Query("SELECT uf.id.followingId FROM UserFollow uf WHERE uf.id.followerId = :followerId ORDER BY uf.createdAt DESC")
    List<UUID> findFollowingIdsByFollowerId(@Param("followerId") UUID followerId);
}
