package com.network.document_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateCommentRequest {
    private UUID parentId;
    private Integer pageNumber;

    @NotBlank(message = "Nội dung bình luận không được để trống")
    private String content;
}
