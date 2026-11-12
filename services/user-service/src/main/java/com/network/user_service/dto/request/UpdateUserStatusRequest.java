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
public class UpdateUserStatusRequest {

    @NotBlank(message = "Trạng thái người dùng không được để trống")
    private String status;

    private String reason;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public static UpdateUserStatusRequestBuilder builder() {
        return new UpdateUserStatusRequestBuilder();
    }

    public static class UpdateUserStatusRequestBuilder {
        private final UpdateUserStatusRequest req = new UpdateUserStatusRequest();

        public UpdateUserStatusRequestBuilder status(String status) { req.status = status; return this; }
        public UpdateUserStatusRequestBuilder reason(String reason) { req.reason = reason; return this; }

        public UpdateUserStatusRequest build() {
            return req;
        }
    }
}
