package com.network.document_service.client;

import com.network.document_service.dto.response.IpfsUploadResult;
import org.springframework.core.io.Resource;

public interface IpfsStorageService {
    IpfsUploadResult uploadFile(Resource fileResource, String filename);
    IpfsUploadResult uploadBytes(byte[] content, String filename);
}
