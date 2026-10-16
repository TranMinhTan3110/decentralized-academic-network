package com.network.document_service.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IpfsUploadResult {
    private String cid;
    private String previewCid;
    private boolean pinnedLocal;
    private boolean pinnedRemote;
    private String gatewayUrl;
}
