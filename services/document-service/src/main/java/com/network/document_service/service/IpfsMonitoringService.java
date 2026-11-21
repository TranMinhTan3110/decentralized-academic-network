package com.network.document_service.service;

import com.network.document_service.dto.response.ipfs.DesyncedDocumentDto;
import com.network.document_service.dto.response.ipfs.IpfsClusterOverviewResponse;
import com.network.document_service.dto.response.ipfs.IpfsDiagnosticResult;
import com.network.document_service.dto.response.ipfs.IpfsPeerDto;
import com.network.document_service.dto.response.ipfs.IpfsTopologyResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface IpfsMonitoringService {

    IpfsClusterOverviewResponse getOverview();

    IpfsTopologyResponse getTopology();

    IpfsDiagnosticResult runDiagnostics();

    List<IpfsPeerDto> getConnectedPeers();

    Page<DesyncedDocumentDto> getDesyncedDocuments(Pageable pageable);

    void syncDocumentToPinata(UUID documentId);

    Map<String, Object> syncAllDesyncedToPinata();

    String getIpfsMode();

    String updateIpfsMode(String mode);

    Map<String, Object> runGarbageCollection();
}
