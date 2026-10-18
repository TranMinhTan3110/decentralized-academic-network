package com.network.document_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ModerateDocumentRequest {

    @NotBlank(message = "Trạng thái kiểm duyệt không được để trống")
    private String status; // PUBLISHED hoặc REJECTED

    private String reason;
}
