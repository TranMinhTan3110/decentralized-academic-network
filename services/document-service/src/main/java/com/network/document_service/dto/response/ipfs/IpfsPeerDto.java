package com.network.document_service.dto.response.ipfs;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IpfsPeerDto {
    private String peerId;
    private String address;
    private String latency;
    private String direction;
    private String location;
}
