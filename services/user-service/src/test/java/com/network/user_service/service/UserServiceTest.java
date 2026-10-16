package com.network.user_service.service;

import com.network.user_service.dto.response.UserResponse;
import com.network.user_service.entity.University;
import com.network.user_service.entity.User;
import com.network.user_service.exception.ResourceNotFoundException;
import com.network.user_service.repository.UserRepository;
import com.network.user_service.service.impl.UserServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserServiceImpl userService;

    @Test
    @DisplayName("Lấy profile thành công khi email tồn tại trong hệ thống")
    void getCurrentUserProfile_ShouldReturnUserResponse_WhenEmailExists() {
        String email = "student01@dedocu.vn";
        University university = University.builder()
                .id(UUID.randomUUID())
                .name("Đại học Bách Khoa")
                .build();

        User user = User.builder()
                .id(UUID.randomUUID())
                .email(email)
                .username("student01")
                .fullName("Nguyen Van A")
                .role("USER")
                .university(university)
                .build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

        UserResponse response = userService.getCurrentUserProfile(email);

        assertThat(response).isNotNull();
        assertThat(response.getEmail()).isEqualTo(email);
        assertThat(response.getUsername()).isEqualTo("student01");
        assertThat(response.getUniversityId()).isEqualTo(university.getId());
    }

    @Test
    @DisplayName("Ném ResourceNotFoundException khi không tìm thấy email")
    void getCurrentUserProfile_ShouldThrowException_WhenEmailNotFound() {
        String email = "notfound@dedocu.vn";
        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getCurrentUserProfile(email))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Không tìm thấy thông tin người dùng");
    }
}
