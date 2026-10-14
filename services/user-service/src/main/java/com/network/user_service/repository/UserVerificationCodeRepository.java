package com.network.user_service.repository;

import com.network.user_service.entity.User;
import com.network.user_service.entity.UserVerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserVerificationCodeRepository extends JpaRepository<UserVerificationCode, UUID> {

    Optional<UserVerificationCode> findTopByUserAndCodeAndTypeAndIsUsedFalseOrderByCreatedAtDesc(
            User user,
            String code,
            String type
    );
}
