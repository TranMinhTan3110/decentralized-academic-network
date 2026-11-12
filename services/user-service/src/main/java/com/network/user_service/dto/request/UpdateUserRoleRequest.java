package com.network.user_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRoleRequest {

    @NotBlank(message = "Vai trò người dùng không được để trống")
    private String role;

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public static UpdateUserRoleRequestBuilder builder() {
        return new UpdateUserRoleRequestBuilder();
    }

    public static class UpdateUserRoleRequestBuilder {
        private final UpdateUserRoleRequest req = new UpdateUserRoleRequest();

        public UpdateUserRoleRequestBuilder role(String role) { req.role = role; return this; }

        public UpdateUserRoleRequest build() {
            return req;
        }
    }
}
