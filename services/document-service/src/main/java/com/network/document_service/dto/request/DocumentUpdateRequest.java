package com.network.document_service.dto.request;

import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentUpdateRequest {
    @Size(min = 3, max = 255, message = "Tiêu đề phải từ 3 đến 255 ký tự")
    private String title;
    private String description;
    private String caption;
    private String docType;
    private UUID courseId;
    private String academicYear;
    private String semester;
}
