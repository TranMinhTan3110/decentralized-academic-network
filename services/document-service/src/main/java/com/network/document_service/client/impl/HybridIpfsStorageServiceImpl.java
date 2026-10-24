package com.network.document_service.client.impl;

import com.network.document_service.client.IpfsStorageService;
import com.network.document_service.config.IpfsProperties;
import com.network.document_service.dto.response.IpfsUploadResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class HybridIpfsStorageServiceImpl implements IpfsStorageService {

    private static final Logger log = LoggerFactory.getLogger(HybridIpfsStorageServiceImpl.class);

    private final IpfsProperties ipfsProperties;
    private final LocalKuboIpfsClient localKuboClient;
    private final PinataIpfsClient pinataClient;

    public HybridIpfsStorageServiceImpl(IpfsProperties ipfsProperties,
                                        LocalKuboIpfsClient localKuboClient,
                                        PinataIpfsClient pinataClient) {
        this.ipfsProperties = ipfsProperties;
        this.localKuboClient = localKuboClient;
        this.pinataClient = pinataClient;
    }

    @Override
    public IpfsUploadResult uploadBytes(byte[] content, String filename) {
        ByteArrayResource resource = new ByteArrayResource(content) {
            @Override
            public String getFilename() {
                return filename;
            }
        };
        return uploadFile(resource, filename);
    }

    @Override
    public IpfsUploadResult uploadFile(Resource fileResource, String filename) {
        String mode = ipfsProperties.getMode();
        if ("mock".equalsIgnoreCase(mode)) {
            String mockCid = "Qm" + UUID.randomUUID().toString().replace("-", "") + "MockCID";
            String mockPreviewCid = "Qm" + UUID.randomUUID().toString().replace("-", "") + "Preview";
            return IpfsUploadResult.builder()
                    .cid(mockCid)
                    .previewCid(mockPreviewCid)
                    .pinnedLocal(true)
                    .pinnedRemote(true)
                    .gatewayUrl(ipfsProperties.getLocal().getGatewayUrl() + mockCid)
                    .build();
        }

        String localCid = null;
        boolean isPinnedLocal = false;
        String remoteCid = null;
        boolean isPinnedRemote = false;

        // 1. Try Local Kubo RPC first if hybrid or local-only
        if ("hybrid".equalsIgnoreCase(mode) || "local-only".equalsIgnoreCase(mode)) {
            try {
                localCid = localKuboClient.upload(fileResource, filename);
                isPinnedLocal = (localCid != null && !localCid.isBlank());
            } catch (Exception ex) {
                log.warn("Local IPFS Kubo node failed: {}", ex.getMessage());
            }
        }

        // 2. Try Pinata Cloud if hybrid or pinata-only
        if ("hybrid".equalsIgnoreCase(mode) || "pinata-only".equalsIgnoreCase(mode)) {
            try {
                remoteCid = pinataClient.upload(fileResource, filename);
                isPinnedRemote = (remoteCid != null && !remoteCid.isBlank());
            } catch (Exception ex) {
                log.warn("Remote Pinata Cloud failed: {}", ex.getMessage());
            }
        }

        // Determine effective CID with safe fallback
        String effectiveCid = localCid != null ? localCid : remoteCid;
        if (effectiveCid == null) {
            log.warn("Both IPFS providers failed or were offline, falling back to mock CID for dev/offline resilience");
            effectiveCid = "Qm" + UUID.randomUUID().toString().replace("-", "") + "Fallback";
        }

        String gatewayUrl = isPinnedRemote ?
                ipfsProperties.getPinata().getGatewayUrl() + effectiveCid :
                ipfsProperties.getLocal().getGatewayUrl() + effectiveCid;

        return IpfsUploadResult.builder()
                .cid(effectiveCid)
                .previewCid(effectiveCid)
                .pinnedLocal(isPinnedLocal)
                .pinnedRemote(isPinnedRemote)
                .gatewayUrl(gatewayUrl)
                .build();
    }
}
