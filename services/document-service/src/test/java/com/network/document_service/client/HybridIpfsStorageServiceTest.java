package com.network.document_service.client;

import com.network.document_service.client.impl.HybridIpfsStorageServiceImpl;
import com.network.document_service.client.impl.LocalKuboIpfsClient;
import com.network.document_service.client.impl.PinataIpfsClient;
import com.network.document_service.config.IpfsProperties;
import com.network.document_service.dto.response.IpfsUploadResult;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ByteArrayResource;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class HybridIpfsStorageServiceTest {

    private final LocalKuboIpfsClient localClient = mock(LocalKuboIpfsClient.class);
    private final PinataIpfsClient pinataClient = mock(PinataIpfsClient.class);

    @Test
    void uploadFile_inMockMode_shouldReturnMockCid() {
        IpfsProperties props = new IpfsProperties();
        props.setMode("mock");
        HybridIpfsStorageServiceImpl service = new HybridIpfsStorageServiceImpl(props, localClient, pinataClient);

        ByteArrayResource resource = new ByteArrayResource("test".getBytes());
        IpfsUploadResult result = service.uploadFile(resource, "test.pdf");

        assertNotNull(result);
        assertTrue(result.getCid().startsWith("Qm"));
        assertTrue(result.isPinnedLocal());
        assertTrue(result.isPinnedRemote());
    }

    @Test
    void uploadBytes_inHybridMode_bothSuccess_shouldReturnLocalCid() {
        IpfsProperties props = new IpfsProperties();
        props.setMode("hybrid");
        HybridIpfsStorageServiceImpl service = new HybridIpfsStorageServiceImpl(props, localClient, pinataClient);

        when(localClient.upload(any(), eq("sample.pdf"))).thenReturn("QmLocal123");
        when(pinataClient.upload(any(), eq("sample.pdf"))).thenReturn("QmPinata123");

        IpfsUploadResult result = service.uploadBytes("hello".getBytes(), "sample.pdf");

        assertEquals("QmLocal123", result.getCid());
        assertTrue(result.isPinnedLocal());
        assertTrue(result.isPinnedRemote());
    }

    @Test
    void uploadFile_inHybridMode_localFails_shouldFallbackToPinata() {
        IpfsProperties props = new IpfsProperties();
        props.setMode("hybrid");
        HybridIpfsStorageServiceImpl service = new HybridIpfsStorageServiceImpl(props, localClient, pinataClient);

        when(localClient.upload(any(), any())).thenThrow(new RuntimeException("Local down"));
        when(pinataClient.upload(any(), any())).thenReturn("QmPinataOnly");

        ByteArrayResource resource = new ByteArrayResource("test".getBytes());
        IpfsUploadResult result = service.uploadFile(resource, "test.pdf");

        assertEquals("QmPinataOnly", result.getCid());
        assertFalse(result.isPinnedLocal());
        assertTrue(result.isPinnedRemote());
    }

    @Test
    void uploadFile_inLocalOnlyMode_success() {
        IpfsProperties props = new IpfsProperties();
        props.setMode("local-only");
        HybridIpfsStorageServiceImpl service = new HybridIpfsStorageServiceImpl(props, localClient, pinataClient);

        when(localClient.upload(any(), eq("local.pdf"))).thenReturn("QmLocalOnly");

        ByteArrayResource resource = new ByteArrayResource("content".getBytes());
        IpfsUploadResult result = service.uploadFile(resource, "local.pdf");

        assertEquals("QmLocalOnly", result.getCid());
        assertTrue(result.isPinnedLocal());
        assertFalse(result.isPinnedRemote());
        verifyNoInteractions(pinataClient);
    }

    @Test
    void uploadFile_inPinataOnlyMode_success() {
        IpfsProperties props = new IpfsProperties();
        props.setMode("pinata-only");
        HybridIpfsStorageServiceImpl service = new HybridIpfsStorageServiceImpl(props, localClient, pinataClient);

        when(pinataClient.upload(any(), eq("remote.pdf"))).thenReturn("QmRemoteOnly");

        ByteArrayResource resource = new ByteArrayResource("content".getBytes());
        IpfsUploadResult result = service.uploadFile(resource, "remote.pdf");

        assertEquals("QmRemoteOnly", result.getCid());
        assertFalse(result.isPinnedLocal());
        assertTrue(result.isPinnedRemote());
        verifyNoInteractions(localClient);
    }

    @Test
    void uploadFile_bothFail_shouldFallbackMockCid() {
        IpfsProperties props = new IpfsProperties();
        props.setMode("hybrid");
        HybridIpfsStorageServiceImpl service = new HybridIpfsStorageServiceImpl(props, localClient, pinataClient);

        when(localClient.upload(any(), any())).thenThrow(new RuntimeException("Local error"));
        when(pinataClient.upload(any(), any())).thenThrow(new RuntimeException("Pinata error"));

        ByteArrayResource resource = new ByteArrayResource("content".getBytes());
        IpfsUploadResult result = service.uploadFile(resource, "fallback.pdf");

        assertNotNull(result);
        assertTrue(result.getCid().startsWith("Qm"));
        assertFalse(result.isPinnedLocal());
        assertFalse(result.isPinnedRemote());
    }
}
