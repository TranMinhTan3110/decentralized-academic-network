package com.network.document_service.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class DocumentAttachmentDto {
    private String fileName;
    private String fileExtension;
    private Long fileSizeBytes;
    private String ipfsCid;
    private String previewIpfsCid;
    private String fileUrl;
    private Integer totalPages;
}
