package com.network.document_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportDocumentRequest {

    @NotBlank(message = "Lý do báo cáo không được để trống")
    private String reason;

    private String description;
}
