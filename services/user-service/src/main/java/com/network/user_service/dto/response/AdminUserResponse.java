package com.network.user_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserResponse {

    private UUID id;
    private String username;
    private String fullName;
    private String email;
    private String avatarUrl;
    private String universityName;
    private String major;
    private String role;
    private String status;
    private Integer totalUploads;
    private Integer reputationPoints;
    private String scholarTitle;
    private OffsetDateTime createdAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public String getUniversityName() { return universityName; }
    public void setUniversityName(String universityName) { this.universityName = universityName; }
    public String getMajor() { return major; }
    public void setMajor(String major) { this.major = major; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getTotalUploads() { return totalUploads; }
    public void setTotalUploads(Integer totalUploads) { this.totalUploads = totalUploads; }
    public Integer getReputationPoints() { return reputationPoints; }
    public void setReputationPoints(Integer reputationPoints) { this.reputationPoints = reputationPoints; }
    public String getScholarTitle() { return scholarTitle; }
    public void setScholarTitle(String scholarTitle) { this.scholarTitle = scholarTitle; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public static AdminUserResponseBuilder builder() {
        return new AdminUserResponseBuilder();
    }

    public static class AdminUserResponseBuilder {
        private final AdminUserResponse res = new AdminUserResponse();

        public AdminUserResponseBuilder id(UUID id) { res.id = id; return this; }
        public AdminUserResponseBuilder username(String username) { res.username = username; return this; }
        public AdminUserResponseBuilder fullName(String fullName) { res.fullName = fullName; return this; }
        public AdminUserResponseBuilder email(String email) { res.email = email; return this; }
        public AdminUserResponseBuilder avatarUrl(String avatarUrl) { res.avatarUrl = avatarUrl; return this; }
        public AdminUserResponseBuilder universityName(String universityName) { res.universityName = universityName; return this; }
        public AdminUserResponseBuilder major(String major) { res.major = major; return this; }
        public AdminUserResponseBuilder role(String role) { res.role = role; return this; }
        public AdminUserResponseBuilder status(String status) { res.status = status; return this; }
        public AdminUserResponseBuilder totalUploads(Integer totalUploads) { res.totalUploads = totalUploads; return this; }
        public AdminUserResponseBuilder reputationPoints(Integer reputationPoints) { res.reputationPoints = reputationPoints; return this; }
        public AdminUserResponseBuilder scholarTitle(String scholarTitle) { res.scholarTitle = scholarTitle; return this; }
        public AdminUserResponseBuilder createdAt(OffsetDateTime createdAt) { res.createdAt = createdAt; return this; }

        public AdminUserResponse build() {
            return res;
        }
    }
}
