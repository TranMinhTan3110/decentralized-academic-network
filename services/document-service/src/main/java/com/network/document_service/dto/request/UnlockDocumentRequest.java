package com.network.document_service.dto.request;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UnlockDocumentRequest {
    @Builder.Default
    private String unlockType = "POINTS";

    private UUID idempotencyKey;
}
