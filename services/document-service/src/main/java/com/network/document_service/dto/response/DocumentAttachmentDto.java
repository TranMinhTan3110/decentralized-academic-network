package com.network.document_service.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentAttachmentDto {
    private String fileName;
    private String fileExtension;
    private Long fileSizeBytes;
    private String ipfsCid;
    private String fileUrl;
}
