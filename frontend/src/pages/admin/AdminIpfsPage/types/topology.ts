export type NodeHealthStatus = 'online' | 'degraded' | 'offline' | 'checking';

export interface KuboMetrics {
    status: NodeHealthStatus;
    pingMs: number | null;
    version?: string;
    peerId?: string;
    swarmPeersCount: number;
    repoSizeBytes: number;
    pinnedCount: number;
    errorMessage?: string;
}

export interface PinataMetrics {
    status: NodeHealthStatus;
    pingMs: number | null;
    authenticated: boolean;
    pinnedCount: number;
    storageUsedBytes: number;
    errorMessage?: string;
}

export interface GatewayMetrics {
    localGatewayStatus: NodeHealthStatus;
    pinataGatewayStatus: NodeHealthStatus;
    localGatewayUrl?: string;
    pinataGatewayUrl?: string;
}

export interface DiagnosticVerdict {
    level: 'success' | 'warning' | 'danger';
    title: string;
    description: string;
    failingComponent: 'NONE' | 'DOCKER' | 'PINATA' | 'BOTH' | 'GATEWAY';
}

export interface IpfsTopologyData {
    backendStatus: NodeHealthStatus;
    currentMode?: 'hybrid' | 'local-only' | 'pinata-only';
    kubo: KuboMetrics;
    pinata: PinataMetrics;
    gateway: GatewayMetrics;
    lastChecked?: string;
    verdict: DiagnosticVerdict;
}

export interface DesyncedDocumentItem {
    id: string;
    title: string;
    ipfsCid: string;
    previewIpfsCid?: string;
    isPinnedLocal: boolean;
    isPinnedRemote: boolean;
    fileSizeBytes: number;
    createdAt: string;
}

export interface IpfsClusterOverviewData {
    status: string;
    totalDocuments: number;
    pinnedBoth: number;
    pinnedLocalOnly: number;
    pinnedRemoteOnly: number;
    failedOrOrphan: number;
}

export interface IpfsPeerItem {
    peerId: string;
    address: string;
    latency: string;
    direction: string;
    location: string;
}
