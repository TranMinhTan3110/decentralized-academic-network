package com.network.user_service.repository;

import com.network.user_service.entity.UserFollow;
import com.network.user_service.entity.UserFollowId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserFollowRepository extends JpaRepository<UserFollow, UserFollowId> {

    boolean existsByIdFollowerIdAndIdFollowingId(UUID followerId, UUID followingId);

    Optional<UserFollow> findByIdFollowerIdAndIdFollowingId(UUID followerId, UUID followingId);

    void deleteByIdFollowerIdAndIdFollowingId(UUID followerId, UUID followingId);
}
