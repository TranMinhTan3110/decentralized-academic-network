package com.network.document_service.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentUploadRequest {

    @NotBlank(message = "Tiêu đề tài liệu không được để trống")
    private String title;

    private String description;

    private String caption;

    @Builder.Default
    private String docType = "SLIDE";

    @Builder.Default
    private String academicYear = "2025";

    private String semester;

    private UUID universityId;

    private UUID courseId;

    @Builder.Default
    @Min(value = 0, message = "Điểm mở khóa không được âm")
    private Integer unlockPointsRequired = 10;

    private Integer freePages;

    private Boolean blurLockEnabled;

    @NotNull(message = "File tài liệu không được để trống")
    private MultipartFile file;
}
