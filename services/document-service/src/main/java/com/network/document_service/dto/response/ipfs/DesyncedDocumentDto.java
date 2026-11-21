package com.network.document_service.dto.response.ipfs;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DesyncedDocumentDto {
    private UUID id;
    private String title;
    private String ipfsCid;
    private String previewIpfsCid;
    private Boolean isPinnedLocal;
    private Boolean isPinnedRemote;
    private Long fileSizeBytes;
    private OffsetDateTime createdAt;
}
