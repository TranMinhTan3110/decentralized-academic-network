import { useState, useMemo, useEffect } from 'react';
import {
    Network,
    Gauge,
    RefreshCw,
    Search,
    Info,
    AlertTriangle,
    Layers,
    Terminal,
    CheckCircle2,
    Check,
    Copy,
    ExternalLink,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { AdminLayout } from '../../../components/admin';
import { Button } from '../../../components/ui';
import { NodeDetailModal, type IpfsNodeInfo, type NodeStatus, type NodeType } from './components/NodeDetailModal';
import { IpfsTopologyGraph } from './components/IpfsTopologyGraph';
import { ipfsAdminService } from '../../../services/ipfsAdminService';
import type {
    IpfsTopologyData,
    IpfsClusterOverviewData,
    DesyncedDocumentItem,
    IpfsPeerItem,
} from './types/topology';

function formatBytes(bytes?: number): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function AdminIpfsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'error' | 'maintenance' | 'offline'>('all');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isChangingMode, setIsChangingMode] = useState(false);
    const [selectedNode, setSelectedNode] = useState<IpfsNodeInfo | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [overviewData, setOverviewData] = useState<IpfsClusterOverviewData | null>(null);
    const [peersData, setPeersData] = useState<IpfsPeerItem[]>([]);
    const [desyncedDocs, setDesyncedDocs] = useState<DesyncedDocumentItem[]>([]);
    const [desyncedPage, setDesyncedPage] = useState(0);
    const [desyncedTotalPages, setDesyncedTotalPages] = useState(1);
    const [desyncedTotalElements, setDesyncedTotalElements] = useState(0);
    const [copiedPeerId, setCopiedPeerId] = useState<string | null>(null);
    const [copiedCid, setCopiedCid] = useState<string | null>(null);
    const [isSyncingAll, setIsSyncingAll] = useState(false);
    const [syncingDocId, setSyncingDocId] = useState<string | null>(null);
    const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

    const [topologyData, setTopologyData] = useState<IpfsTopologyData>({
        backendStatus: 'online',
        kubo: {
            status: 'online',
            pingMs: 8,
            version: 'kubo/0.32.0',
            peerId: '12D3KooWLocalDockerKuboPeer',
            swarmPeersCount: 42,
            repoSizeBytes: 12800000000,
            pinnedCount: 142,
        },
        pinata: {
            status: 'online',
            pingMs: 42,
            authenticated: true,
            pinnedCount: 142,
            storageUsedBytes: 12800000000,
        },
        gateway: {
            localGatewayStatus: 'online',
            pinataGatewayStatus: 'online',
            localGatewayUrl: 'http://127.0.0.1:8080/ipfs/',
            pinataGatewayUrl: 'https://harlequin-working-cheetah-340.mypinata.cloud/ipfs/',
        },
        lastChecked: new Date().toLocaleTimeString(),
        verdict: {
            level: 'success',
            title: 'Mạng lưới hoạt động tối ưu',
            description: 'Cả Docker Kubo và Pinata Cloud đều trực tuyến. Luồng dữ liệu Hybrid được phân phối ổn định 100%.',
            failingComponent: 'NONE',
        },
    });

    const loadDesynced = async (page: number) => {
        try {
            const desynced = await ipfsAdminService.getDesyncedDocuments(page, 10);
            setDesyncedDocs(desynced.content);
            setDesyncedPage(desynced.pageNumber);
            setDesyncedTotalPages(desynced.totalPages || 1);
            setDesyncedTotalElements(desynced.totalElements || 0);
        } catch (err) {
            console.warn('Could not load desynced docs:', err);
        }
    };

    const loadAllData = async () => {
        try {
            const [topo, overview, peers, desynced] = await Promise.all([
                ipfsAdminService.getTopology(),
                ipfsAdminService.getOverview(),
                ipfsAdminService.getPeers(),
                ipfsAdminService.getDesyncedDocuments(desyncedPage, 10),
            ]);
            setTopologyData(topo);
            setOverviewData(overview);
            setPeersData(peers);
            setDesyncedDocs(desynced.content);
            setDesyncedPage(desynced.pageNumber);
            setDesyncedTotalPages(desynced.totalPages || 1);
            setDesyncedTotalElements(desynced.totalElements || 0);
        } catch (err) {
            console.warn('Could not load IPFS data:', err);
        }
    };

    useEffect(() => {
        loadAllData();
        const timer = setInterval(loadAllData, 30000);
        return () => clearInterval(timer);
    }, []);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await ipfsAdminService.runDiagnostics();
            await loadAllData();
        } catch {
            // fallback
        } finally {
            setTimeout(() => setIsRefreshing(false), 500);
        }
    };

    const handleModeChange = async (newMode: 'hybrid' | 'local-only' | 'pinata-only') => {
        setIsChangingMode(true);
        try {
            const updated = await ipfsAdminService.updateMode(newMode);
            await loadAllData();
            setTopologyData((prev) => ({ ...prev, currentMode: (updated as 'hybrid' | 'local-only' | 'pinata-only') || newMode }));
        } catch (err) {
            console.warn('Failed to switch IPFS mode:', err);
            setTopologyData((prev) => ({ ...prev, currentMode: newMode }));
        } finally {
            setIsChangingMode(false);
        }
    };

    const isNodeBypassed = (nodeId: number): boolean => {
        const mode = topologyData.currentMode || 'hybrid';
        if (mode === 'local-only') {
            // Pinata Cloud Gateway Bridge (id: 1) va Pinata Dedicated Gateway (id: 103) bi tam ngat
            return nodeId === 1 || nodeId === 103;
        }
        if (mode === 'pinata-only') {
            // Local IPFS Daemon (id: 2), Local Gateway (id: 102) va P2P Swarm Peers (id >= 200) bi tam ngat
            return nodeId === 2 || nodeId === 102 || nodeId >= 200;
        }
        return false;
    };

    const handleSyncDocument = async (id: string) => {
        setSyncingDocId(id);
        try {
            await ipfsAdminService.syncDocument(id);
            setSyncFeedback('Đồng bộ tài liệu thành công');
            const [overview, desynced] = await Promise.all([
                ipfsAdminService.getOverview(),
                ipfsAdminService.getDesyncedDocuments(desyncedPage, 10),
            ]);
            setOverviewData(overview);
            setDesyncedDocs(desynced.content);
            setDesyncedTotalElements(desynced.totalElements || 0);
        } catch (err) {
            console.warn('Failed to sync document:', err);
            setSyncFeedback('Đồng bộ thất bại, vui lòng kiểm tra kết nối.');
        } finally {
            setSyncingDocId(null);
            setTimeout(() => setSyncFeedback(null), 3000);
        }
    };

    const handleSyncAll = async () => {
        setIsSyncingAll(true);
        try {
            const res = await ipfsAdminService.syncAllDesynced();
            setSyncFeedback(`Đã quét ${res.scanned} tài liệu, đồng bộ thành công ${res.synced} tài liệu.`);
            const [overview, desynced] = await Promise.all([
                ipfsAdminService.getOverview(),
                ipfsAdminService.getDesyncedDocuments(0, 10),
            ]);
            setOverviewData(overview);
            setDesyncedDocs(desynced.content);
            setDesyncedPage(0);
            setDesyncedTotalPages(desynced.totalPages || 1);
            setDesyncedTotalElements(desynced.totalElements || 0);
        } catch (err) {
            console.warn('Failed to sync all desynced documents:', err);
            setSyncFeedback('Đồng bộ hàng loạt thất bại.');
        } finally {
            setIsSyncingAll(false);
            setTimeout(() => setSyncFeedback(null), 4000);
        }
    };

    const nodes = useMemo<IpfsNodeInfo[]>(() => {
        const kuboStatus: NodeStatus = topologyData.kubo.status === 'offline'
            ? 'offline'
            : topologyData.kubo.errorMessage
            ? 'error'
            : 'active';
        const pinataStatus: NodeStatus = topologyData.pinata.status === 'offline'
            ? 'offline'
            : topologyData.pinata.status === 'degraded'
            ? 'maintenance'
            : topologyData.pinata.errorMessage
            ? 'error'
            : 'active';

        const coreNodes: IpfsNodeInfo[] = [
            {
                id: 101,
                name: 'Document Service Backend (Port 8082)',
                cid: 'http://localhost:8082',
                nodeType: 'gateway',
                status: topologyData.backendStatus === 'online' ? 'active' : 'offline',
                sla: topologyData.backendStatus === 'online' ? '99.99%' : '0%',
                lat: '1 ms',
                reviews: `${overviewData?.totalDocuments ?? 0}`,
                bandwidth: '1 Gbps',
                storageUsed: formatBytes(topologyData.kubo.repoSizeBytes),
                location: 'Local Cluster (Spring Boot 3 / Java 21)',
                multiaddr: 'http://localhost:8082',
                version: 'Spring Boot 3.3.4 (REST)',
                logs: [
                    '[INFO] Document Service Backend đang chạy trên cổng 8082',
                    '[INFO] Hệ thống điều phối Hybrid IPFS sẵn sàng tiếp nhận yêu cầu',
                    `[INFO] Trạng thái Backend: ${topologyData.backendStatus.toUpperCase()}`,
                ],
            },
            {
                id: 2,
                name: 'Local IPFS Daemon (Docker Kubo)',
                cid: topologyData.kubo.peerId
                    ? `${topologyData.kubo.peerId.slice(0, 8)}...${topologyData.kubo.peerId.slice(-4)}`
                    : '12D3KooW...Peer',
                nodeType: 'storage',
                status: kuboStatus,
                sla: topologyData.kubo.status === 'online' ? '99.95%' : '0%',
                lat: topologyData.kubo.pingMs !== null ? `${topologyData.kubo.pingMs} ms` : 'Timeout',
                reviews: `${topologyData.kubo.pinnedCount || 0}`,
                bandwidth: '1 Gbps',
                storageUsed: formatBytes(topologyData.kubo.repoSizeBytes),
                location: 'Docker Host (dev_ipfs_kubo:5001)',
                multiaddr: `/ip4/127.0.0.1/tcp/4001/p2p/${topologyData.kubo.peerId || 'dev_ipfs_kubo'}`,
                version: topologyData.kubo.version,
                logs: topologyData.kubo.errorMessage ? [topologyData.kubo.errorMessage] : [
                    '[INFO] Kubo RPC daemon lắng nghe tại http://localhost:5001/api/v0',
                    `[INFO] Tổng số Swarm Peers kết nối: ${topologyData.kubo.swarmPeersCount}`,
                    `[INFO] Kích thước kho khối RepoSize: ${formatBytes(topologyData.kubo.repoSizeBytes)}`,
                ],
            },
            {
                id: 1,
                name: 'Pinata Cloud Gateway Bridge',
                cid: 'api.pinata.cloud',
                nodeType: 'gateway',
                status: pinataStatus,
                sla: topologyData.pinata.status === 'online' ? '99.99%' : '85.0%',
                lat: topologyData.pinata.pingMs !== null ? `${topologyData.pinata.pingMs} ms` : 'Timeout',
                reviews: `${topologyData.pinata.pinnedCount || 0}`,
                bandwidth: '500 Mbps',
                storageUsed: formatBytes(topologyData.pinata.storageUsedBytes),
                location: 'Cloud US-East (Pinata Cloud)',
                multiaddr: 'https://api.pinata.cloud/data/testAuthentication',
                logs: topologyData.pinata.errorMessage ? [topologyData.pinata.errorMessage] : [
                    '[INFO] Kết nối thành công Pinata Pinning REST API',
                    `[INFO] Trạng thái xác thực Token JWT: ${topologyData.pinata.authenticated ? 'Hợp lệ' : 'Hết hạn'}`,
                    `[INFO] Dung lượng Cloud đã dùng: ${formatBytes(topologyData.pinata.storageUsedBytes)}`,
                ],
            },
            {
                id: 102,
                name: 'Local IPFS Gateway (:8080/ipfs)',
                cid: '127.0.0.1:8080',
                nodeType: 'gateway',
                status: topologyData.gateway.localGatewayStatus === 'online' ? 'active' : 'offline',
                sla: topologyData.gateway.localGatewayStatus === 'online' ? '99.9%' : '0%',
                lat: '8 ms',
                reviews: `${topologyData.kubo.pinnedCount || 0}`,
                bandwidth: '1 Gbps',
                storageUsed: formatBytes(topologyData.kubo.repoSizeBytes),
                location: 'Cổng truy xuất nội bộ (Port 8080)',
                multiaddr: topologyData.gateway.localGatewayUrl || 'http://127.0.0.1:8080/ipfs/',
                version: 'Kubo Gateway v0.32.0',
                logs: [
                    '[INFO] Cổng Gateway nội bộ phân phối file PDF trực tiếp từ bộ đệm container Kubo',
                    `[INFO] Trạng thái kết nối: ${topologyData.gateway.localGatewayStatus.toUpperCase()}`,
                ],
            },
            {
                id: 103,
                name: 'Pinata Dedicated Gateway',
                cid: topologyData.gateway.pinataGatewayUrl
                    ? topologyData.gateway.pinataGatewayUrl.replace(/^https?:\/\//, '').replace(/\/ipfs\/.*$/, '')
                    : 'harlequin-working-cheetah-340.mypinata.cloud',
                nodeType: 'gateway',
                status: topologyData.gateway.pinataGatewayStatus === 'online' ? 'active' : 'offline',
                sla: topologyData.gateway.pinataGatewayStatus === 'online' ? '99.99%' : '0%',
                lat: '42 ms',
                reviews: `${topologyData.pinata.pinnedCount || 0}`,
                bandwidth: 'Global CDN',
                storageUsed: formatBytes(topologyData.pinata.storageUsedBytes),
                location: 'Mạng phân phối CDN chuyên dụng (Dedicated CDN)',
                multiaddr: topologyData.gateway.pinataGatewayUrl || 'https://harlequin-working-cheetah-340.mypinata.cloud/ipfs/',
                version: 'Cloudflare / Pinata Dedicated Gateway',
                logs: [
                    '[INFO] Cổng phân phối CDN toàn cầu chuyên dụng (Dedicated Gateway)',
                    `[INFO] Tên miền cổng: ${topologyData.gateway.pinataGatewayUrl || 'https://harlequin-working-cheetah-340.mypinata.cloud/ipfs/'}`,
                    `[INFO] Trạng thái Gateway CDN: ${topologyData.gateway.pinataGatewayStatus.toUpperCase()}`,
                ],
            },
        ];

        const swarmPeers: IpfsNodeInfo[] = (peersData || []).map((peer, idx) => ({
            id: 200 + idx,
            name: `P2P Swarm Peer #${idx + 1}`,
            cid: peer.peerId.length > 12 ? `${peer.peerId.slice(0, 8)}...${peer.peerId.slice(-4)}` : peer.peerId,
            nodeType: peer.direction === 'Inbound' ? 'storage' : 'relay',
            status: 'active',
            sla: '99.9%',
            lat: peer.latency || '---',
            reviews: 'P2P',
            bandwidth: 'P2P Swarm',
            storageUsed: '---',
            location: peer.location || 'Mạng lưới P2P',
            multiaddr: peer.address,
            version: 'Kubo P2P Peer',
            logs: [
                `[INFO] P2P Swarm peer kết nối qua địa chỉ ${peer.address}`,
                `[INFO] Hướng kết nối: ${peer.direction}`,
                `[INFO] Độ trễ vòng lặp Swarm: ${peer.latency || 'Chưa xác định'}`,
            ],
        }));

        return [...coreNodes, ...swarmPeers];
    }, [topologyData, peersData, overviewData]);

    const activeNodesCount = nodes.filter((n) => !isNodeBypassed(n.id) && (n.status === 'active' || n.status === 'hot')).length;
    const totalNodesCount = nodes.length;
    const errorNodesCount = nodes.filter((n) => !isNodeBypassed(n.id) && n.status === 'error').length;
    const maintNodesCount = nodes.filter((n) => !isNodeBypassed(n.id) && n.status === 'maintenance').length;
    const offlineNodesCount = nodes.filter((n) => isNodeBypassed(n.id) || n.status === 'offline').length;
    const nodesSla = totalNodesCount > 0 ? (activeNodesCount === totalNodesCount ? '99.9%' : ((activeNodesCount / totalNodesCount) * 100).toFixed(1) + '%') : '0.0%';

    const handleTopologySelectNode = (nodeKey: 'kubo' | 'pinata' | 'backend' | 'localGateway' | 'pinataGateway') => {
        const targetId = nodeKey === 'kubo'
            ? 2
            : nodeKey === 'pinata'
            ? 1
            : nodeKey === 'localGateway'
            ? 102
            : nodeKey === 'pinataGateway'
            ? 103
            : 101;
        const found = nodes.find((n) => n.id === targetId);
        if (found) {
            setSelectedNode(found);
            setIsModalOpen(true);
        }
    };

    const handleTopologySelectPeer = (peer: IpfsPeerItem, index: number) => {
        const targetId = 200 + index;
        const found = nodes.find((n) => n.id === targetId);
        if (found) {
            setSelectedNode(found);
            setIsModalOpen(true);
        }
    };

    const handleSelectNode = (node: IpfsNodeInfo) => {
        setSelectedNode(node);
        setIsModalOpen(true);
    };

    const filteredNodes = useMemo(() => {
        let result = nodes;
        if (statusFilter !== 'all') {
            if (statusFilter === 'active') {
                result = result.filter((n) => !isNodeBypassed(n.id) && (n.status === 'active' || n.status === 'hot'));
            } else if (statusFilter === 'offline') {
                result = result.filter((n) => isNodeBypassed(n.id) || n.status === 'offline');
            } else {
                result = result.filter((n) => !isNodeBypassed(n.id) && n.status === statusFilter);
            }
        }
        const q = searchQuery.trim().toLowerCase();
        if (q) {
            result = result.filter(
                (n) =>
                    n.name.toLowerCase().includes(q) ||
                    n.cid.toLowerCase().includes(q) ||
                    (n.nodeType && n.nodeType.toLowerCase().includes(q))
            );
        }
        return result;
    }, [nodes, searchQuery, statusFilter, topologyData.currentMode]);

    const getNodeStatusBadge = (status: NodeStatus) => {
        switch (status) {
            case 'hot':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#009668] text-white">
                        Quản trị
                    </span>
                );
            case 'error':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fee2e2] text-[#ba1a1a] border border-[#fecaca]">
                        Lỗi kết nối
                    </span>
                );
            case 'maintenance':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#fef3c7] text-[#b45309] border border-[#fde68a]">
                        Bảo trì
                    </span>
                );
            case 'offline':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#f1f5f9] text-[#64748b] border border-[#cbd5e1]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]" />
                        Ngừng hoạt động
                    </span>
                );
            case 'active':
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#e6f9f0] text-[#009668] border border-[#b7ecd5]">
                        Hoạt động
                    </span>
                );
        }
    };

    const getNodeTypeBadge = (type?: NodeType) => {
        switch (type) {
            case 'gateway':
                return <span className="text-[11px] font-semibold text-[#0051d5] bg-[#eff4ff] px-2 py-0.5 rounded-md border border-[#c3d6ff]">Gateway</span>;
            case 'storage':
                return <span className="text-[11px] font-semibold text-[#8b5cf6] bg-[#f5f3ff] px-2 py-0.5 rounded-md border border-[#ddd6fe]">Core Storage</span>;
            case 'relay':
                return <span className="text-[11px] font-semibold text-[#f59e0b] bg-[#fffbeb] px-2 py-0.5 rounded-md border border-[#fef3c7]">Relay v2</span>;
            case 'bootstrap':
                return <span className="text-[11px] font-semibold text-[#10b981] bg-[#ecfdf5] px-2 py-0.5 rounded-md border border-[#a7f3d0]">DHT Bootstrap</span>;
            default:
                return <span className="text-[11px] font-semibold text-[#64748b] bg-[#f8fafc] px-2 py-0.5 rounded-md border border-[#e2e8f0]">Worker</span>;
        }
    };

    return (
        <AdminLayout
            breadcrumb="Admin / Giám sát Node IPFS"
            title="Giám sát Node IPFS"
            subtitle="Theo dõi kết nối Swarm, độ trễ P2P, gateway và nhật ký lỗi (Logs Terminal)"
            actions={
                <div className="flex flex-wrap items-center gap-2.5">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#e6f9f0] text-[#009668] border border-[#b7ecd5] shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-[#009668] animate-pulse" />
                        Hệ thống kết nối ổn định
                    </span>

                    <Button
                        variant="secondary"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="!bg-white !border-[#c3d0e6] !text-[#0b1c30] hover:!bg-[#eff4ff] text-xs font-semibold px-3 py-2 rounded-[9px]"
                        icon={
                            <RefreshCw
                                size={14}
                                className={`text-[#5a6a80] ${isRefreshing ? 'animate-spin' : ''}`}
                            />
                        }
                    >
                        {isRefreshing ? 'Đang làm mới...' : 'Làm mới trạng thái'}
                    </Button>
                </div>
            }
        >
            {/* Architecture Banner */}
            <div className="bg-[#eff4ff] border border-[#c3d6ff] rounded-[14px] p-4 text-xs text-[#0051d5] flex items-start gap-3 shadow-2xs mb-4">
                <Info size={18} className="shrink-0 mt-0.5 text-[#0051d5]" />
                <div className="space-y-1">
                    <h3 className="font-bold text-[#0b1c30] text-sm">
                        Kiến trúc Lưu trữ Bán phi tập trung & Hệ thống Giám sát Node IPFS
                    </h3>
                    <p className="text-[#3b5998] leading-relaxed">
                        Theo dõi thời gian thực cụm mạng lưới P2P kết hợp giữa <strong>Pinata Dedicated Gateway</strong>, <strong>Kubo Docker Daemon</strong> và các node Core Storage/Relay phân tán. Hỗ trợ chẩn đoán sự cố kết nối và trích xuất Logs Daemon trực tiếp.
                    </p>
                </div>
            </div>

            {/* 4 KPIs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
                {/* KPI 1 */}
                <div
                    onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}
                    className={`bg-white border rounded-[14px] p-4 flex flex-col gap-1.5 shadow-2xs transition-all cursor-pointer group ${
                        statusFilter === 'active' ? 'border-[#009668] ring-2 ring-[#009668]/20 bg-[#f0fdf4]' : 'border-[#dce9ff] hover:border-[#009668]'
                    }`}
                    title="Nhấn để lọc các node đang hoạt động"
                >
                    <div className="text-xs text-[#5a6a80] font-medium flex items-center justify-between">
                        <span className="group-hover:text-[#009668] transition-colors">Node trực tuyến</span>
                        <Network size={17} className="text-[#009668]" />
                    </div>
                    <div className="text-2xl font-bold text-[#0b1c30] tracking-tight">{activeNodesCount} / {totalNodesCount} Node</div>
                    <div className="text-xs text-[#009668] font-semibold">{nodesSla} SLA toàn mạng</div>
                </div>

                {/* KPI 2 */}
                <div
                    onClick={() => setStatusFilter(statusFilter === 'error' ? 'all' : 'error')}
                    className={`bg-white border rounded-[14px] p-4 flex flex-col gap-1.5 shadow-2xs transition-all cursor-pointer group ${
                        statusFilter === 'error' ? 'border-[#ba1a1a] ring-2 ring-[#ba1a1a]/20 bg-[#fff5f5]' : 'border-[#dce9ff] hover:border-[#ba1a1a]'
                    }`}
                    title="Nhấn để lọc các node gặp sự cố kết nối"
                >
                    <div className="text-xs text-[#5a6a80] font-medium flex items-center justify-between">
                        <span className="group-hover:text-[#ba1a1a] transition-colors">Lỗi kết nối cần xử lý</span>
                        <AlertTriangle size={17} className="text-[#ba1a1a]" />
                    </div>
                    <div className="text-2xl font-bold text-[#ba1a1a] tracking-tight">{errorNodesCount} Node</div>
                    <div className="text-xs text-[#ba1a1a] font-medium">
                        {errorNodesCount > 0 ? 'Phát hiện lỗi RPC hoặc API' : 'Không có sự cố kết nối'}
                    </div>
                </div>

                {/* KPI 3 */}
                <div
                    onClick={() => setStatusFilter(statusFilter === 'maintenance' ? 'all' : 'maintenance')}
                    className={`bg-white border rounded-[14px] p-4 flex flex-col gap-1.5 shadow-2xs transition-all cursor-pointer group ${
                        statusFilter === 'maintenance' ? 'border-[#b45309] ring-2 ring-[#b45309]/20 bg-[#fefce8]' : 'border-[#dce9ff] hover:border-[#b45309]'
                    }`}
                    title="Nhấn để lọc các node đang bảo trì"
                >
                    <div className="text-xs text-[#5a6a80] font-medium flex items-center justify-between">
                        <span className="group-hover:text-[#b45309] transition-colors">Đang bảo trì / Degraded</span>
                        <Layers size={17} className="text-[#b45309]" />
                    </div>
                    <div className="text-2xl font-bold text-[#b45309] tracking-tight">{maintNodesCount} Node</div>
                    <div className="text-xs text-[#5a6a80]">
                        {maintNodesCount > 0 ? 'Trạng thái Degraded / Bảo trì' : 'Hoạt động bình thường'}
                    </div>
                </div>

                {/* KPI 4 */}
                <div
                    onClick={() => {
                        const el = document.getElementById('desynced-docs-section');
                        el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-white border border-[#dce9ff] hover:border-[#0051d5] rounded-[14px] p-4 flex flex-col gap-1.5 shadow-2xs transition-all cursor-pointer group"
                    title="Nhấn để cuộn xuống bảng quản lý đồng bộ tài liệu"
                >
                    <div className="text-xs text-[#5a6a80] font-medium flex items-center justify-between">
                        <span className="group-hover:text-[#0051d5] transition-colors">Tài liệu Cụm lưu trữ</span>
                        <Gauge size={17} className="text-[#0051d5]" />
                    </div>
                    <div className="text-2xl font-bold text-[#0b1c30] tracking-tight">
                        {overviewData?.totalDocuments ?? 0} Tài liệu
                    </div>
                    <div className="text-xs text-[#5a6a80]">
                        {formatBytes(topologyData.kubo.repoSizeBytes)} dung lượng Repo
                    </div>
                </div>
            </div>

            {/* IPFS Hybrid Topology & Diagnostic Flow */}
            <IpfsTopologyGraph
                data={topologyData}
                peers={peersData}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
                onSelectNode={handleTopologySelectNode}
                onSelectPeer={handleTopologySelectPeer}
                onModeChange={handleModeChange}
                isChangingMode={isChangingMode}
            />

            {/* Nodes Health Table */}
            <div className="bg-white border border-[#dce9ff] rounded-[14px] shadow-2xs overflow-hidden mb-4">
                <div className="px-5 py-4 border-b border-[#e5eeff] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-base font-bold text-[#0b1c30]">
                            Bảng kiểm soát kết nối hạ tầng IPFS
                        </h2>
                        <p className="text-xs text-[#5a6a80] mt-0.5">
                            Theo dõi danh sách các node hạ tầng P2P, SLA và tra cứu nhật ký lỗi
                        </p>
                    </div>

                    {/* Table search filter */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-72">
                            <Search
                                size={15}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a6a80]"
                            />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm theo tên node, loại hạ tầng, Peer ID..."
                                className="w-full h-9 pl-9 pr-3 text-xs bg-[#f8f9ff] border border-[#dce9ff] rounded-lg outline-none focus:border-[#0051d5] focus:bg-white transition-all text-[#0b1c30]"
                            />
                        </div>
                    </div>
                </div>

                {/* Status Filter Tabs Bar */}
                <div className="flex items-center gap-2 px-5 py-2.5 bg-[#f8f9ff] border-b border-[#e5eeff] overflow-x-auto text-xs">
                    <span className="text-[#5a6a80] font-semibold text-[11px] uppercase mr-1">Bộ lọc:</span>
                    <button
                        type="button"
                        onClick={() => setStatusFilter('all')}
                        className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                            statusFilter === 'all'
                                ? 'bg-[#0b1c30] text-white shadow-2xs'
                                : 'bg-white text-[#5a6a80] hover:text-[#0b1c30] border border-[#dce9ff]'
                        }`}
                    >
                        Tất cả ({nodes.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setStatusFilter('active')}
                        className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                            statusFilter === 'active'
                                ? 'bg-[#009668] text-white shadow-2xs'
                                : 'bg-white text-[#009668] hover:bg-[#e6f9f0] border border-[#b7ecd5]'
                        }`}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#009668]" />
                        Đang hoạt động ({activeNodesCount})
                    </button>
                    <button
                        type="button"
                        onClick={() => setStatusFilter('error')}
                        className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                            statusFilter === 'error'
                                ? 'bg-[#ba1a1a] text-white shadow-2xs'
                                : 'bg-white text-[#ba1a1a] hover:bg-[#fff5f5] border border-[#fecaca]'
                        }`}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]" />
                        Lỗi kết nối ({errorNodesCount})
                    </button>
                    <button
                        type="button"
                        onClick={() => setStatusFilter('maintenance')}
                        className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                            statusFilter === 'maintenance'
                                ? 'bg-[#b45309] text-white shadow-2xs'
                                : 'bg-white text-[#b45309] hover:bg-[#fefce8] border border-[#fde68a]'
                        }`}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                        Đang bảo trì ({maintNodesCount})
                    </button>
                    <button
                        type="button"
                        onClick={() => setStatusFilter('offline')}
                        className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                            statusFilter === 'offline'
                                ? 'bg-[#64748b] text-white shadow-2xs'
                                : 'bg-white text-[#64748b] hover:bg-[#f1f5f9] border border-[#cbd5e1]'
                        }`}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]" />
                        Ngừng hoạt động ({offlineNodesCount})
                    </button>
                </div>

                {/* Table Data */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[760px]">
                        <thead>
                            <tr className="bg-[#f8f9ff] border-b border-[#e5eeff] text-[#5a6a80] font-semibold uppercase tracking-wider text-[11px]">
                                <th className="px-5 py-3">Node / Hạ tầng</th>
                                <th className="px-5 py-3">Loại hạ tầng</th>
                                <th className="px-5 py-3">Peer ID</th>
                                <th className="px-5 py-3">Trạng thái</th>
                                <th className="px-5 py-3">SLA / Độ trễ</th>
                                <th className="px-5 py-3 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#eef3ff]">
                            {filteredNodes.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-5 py-8 text-center text-xs text-[#5a6a80]"
                                    >
                                        Không tìm thấy node nào phù hợp với điều kiện lọc hiện tại
                                    </td>
                                </tr>
                            ) : (
                                filteredNodes.map((t) => {
                                    const bypassed = isNodeBypassed(t.id);
                                    return (
                                        <tr
                                            key={t.id}
                                            className={`transition-all group cursor-pointer ${
                                                bypassed
                                                    ? 'opacity-55 grayscale bg-[#f8fafc] hover:bg-[#f1f5f9] border-l-4 border-l-[#94a3b8]'
                                                    : 'hover:bg-[#fafcff]'
                                            }`}
                                            onClick={() => handleSelectNode(t)}
                                        >
                                            <td className="px-5 py-3.5 font-semibold text-[#0b1c30]">
                                                <div className="flex items-center gap-2">
                                                    <span className={bypassed ? 'text-[#64748b]' : ''}>{t.name}</span>
                                                    {bypassed && (
                                                        <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-[#f1f5f9] text-[#64748b] border border-[#cbd5e1]">
                                                            Tạm ngắt ({topologyData.currentMode === 'local-only' ? 'Local-only' : 'Pinata-only'})
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[11px] text-[#5a6a80] block font-normal mt-0.5">
                                                    {t.location}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {getNodeTypeBadge(t.nodeType)}
                                            </td>
                                            <td className={`px-5 py-3.5 font-mono ${bypassed ? 'text-[#64748b]' : 'text-[#0051d5]'}`}>
                                                <div className="flex items-center gap-1.5">
                                                    <span>{t.cid}</span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigator.clipboard?.writeText(t.multiaddr || t.cid);
                                                            setCopiedPeerId(t.cid);
                                                            setTimeout(() => setCopiedPeerId(null), 2000);
                                                        }}
                                                        className="p-1 text-[#5a6a80] hover:text-[#0051d5] hover:bg-[#eff4ff] rounded transition-colors"
                                                        title="Sao chép Peer ID / Địa chỉ"
                                                    >
                                                        {copiedPeerId === t.cid ? <Check size={12} className="text-[#009668]" /> : <Copy size={12} />}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {bypassed ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#f1f5f9] text-[#64748b] border border-[#cbd5e1]">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]" />
                                                        Tạm ngắt
                                                    </span>
                                                ) : (
                                                    getNodeStatusBadge(t.status)
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {bypassed ? (
                                                    <div>
                                                        <div className="font-semibold text-[#64748b]">Bỏ qua</div>
                                                        <span className="text-[11px] text-[#94a3b8] block">Không kết nối</span>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="font-semibold text-[#0b1c30]">{t.sla}</div>
                                                        <span className="text-[11px] text-[#5a6a80] block">{t.lat}</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelectNode(t);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c3d0e6] bg-white hover:bg-[#eff4ff] text-[#0051d5] text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                                                >
                                                    <Terminal size={13} />
                                                    <span>Chi tiết & Logs</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Desynced Documents Management & Storage Sync Table (Dat bang tai lieu phia duoi) */}
            <div id="desynced-docs-section" className="bg-white border border-[#dce9ff] rounded-[14px] shadow-2xs overflow-hidden scroll-mt-6">
                <div className="px-5 py-4 border-b border-[#e5eeff] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-bold text-[#0b1c30]">
                                Quản lý Tài liệu Lệch pha & Đồng bộ Lưu trữ
                            </h2>
                            {overviewData && (overviewData.pinnedLocalOnly > 0 || overviewData.pinnedRemoteOnly > 0) ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fee2e2] text-[#ba1a1a] border border-[#fca5a5]">
                                    {overviewData.pinnedLocalOnly + overviewData.pinnedRemoteOnly} tài liệu cần đồng bộ
                                </span>
                            ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e6f9f0] text-[#009668] border border-[#b7ecd5]">
                                    Đã đồng bộ 100%
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-[#5a6a80] mt-0.5">
                            Danh sách các tài liệu chưa được lưu trữ đầy đủ trên cả Kubo Docker và Pinata Cloud (chỉ mới Pin ở một bên)
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {syncFeedback && (
                            <span className="text-xs font-semibold text-[#009668] bg-[#e6f9f0] px-2.5 py-1 rounded-lg border border-[#b7ecd5] flex items-center gap-1">
                                <Check size={13} />
                                {syncFeedback}
                            </span>
                        )}
                        <Button
                            variant="primary"
                            onClick={handleSyncAll}
                            disabled={isSyncingAll}
                            className="text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5"
                            icon={<RefreshCw size={13} className={isSyncingAll ? 'animate-spin' : ''} />}
                        >
                            {isSyncingAll ? 'Đang đồng bộ hàng loạt...' : 'Đồng bộ tất cả sang Pinata Cloud'}
                        </Button>
                    </div>
                </div>

                {/* Desynced Table Content */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[760px]">
                        <thead>
                            <tr className="bg-[#f8f9ff] border-b border-[#e5eeff] text-[#5a6a80] font-semibold uppercase tracking-wider text-[11px]">
                                <th className="px-5 py-3">Tài liệu / CID</th>
                                <th className="px-5 py-3">Kích thước</th>
                                <th className="px-5 py-3">Kubo Local</th>
                                <th className="px-5 py-3">Pinata Cloud</th>
                                <th className="px-5 py-3">Ngày tạo</th>
                                <th className="px-5 py-3 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#eef3ff]">
                            {desyncedDocs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-8 text-center text-xs text-[#5a6a80]">
                                        <div className="flex flex-col items-center justify-center gap-1.5 text-[#009668]">
                                            <CheckCircle2 size={24} />
                                            <span className="font-semibold text-sm">Toàn bộ tài liệu đã đồng bộ hoàn hảo</span>
                                            <span className="text-xs text-[#5a6a80]">
                                                Không có tài liệu nào bị lệch pha giữa Kubo Docker và Pinata Cloud.
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                desyncedDocs.map((doc) => {
                                    const gatewayBase = doc.isPinnedLocal
                                        ? topologyData.gateway.localGatewayUrl || 'http://127.0.0.1:8080/ipfs/'
                                        : topologyData.gateway.pinataGatewayUrl || 'https://harlequin-working-cheetah-340.mypinata.cloud/ipfs/';
                                    const fileUrl = `${gatewayBase}${doc.ipfsCid}`;

                                    return (
                                        <tr key={doc.id} className="hover:bg-[#fafcff] transition-colors">
                                            <td className="px-5 py-3.5">
                                                <div className="font-semibold text-[#0b1c30]">{doc.title}</div>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <a
                                                        href={fileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[11px] font-mono text-[#0051d5] hover:underline inline-flex items-center gap-1"
                                                        title="Mở xem tài liệu trên IPFS Gateway"
                                                    >
                                                        <span>{doc.ipfsCid}</span>
                                                        <ExternalLink size={11} />
                                                    </a>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            navigator.clipboard?.writeText(doc.ipfsCid);
                                                            setCopiedCid(doc.ipfsCid);
                                                            setTimeout(() => setCopiedCid(null), 2000);
                                                        }}
                                                        className="p-0.5 text-[#5a6a80] hover:text-[#0051d5] rounded transition-colors"
                                                        title="Sao chép CID"
                                                    >
                                                        {copiedCid === doc.ipfsCid ? (
                                                            <Check size={11} className="text-[#009668]" />
                                                        ) : (
                                                            <Copy size={11} />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 font-medium text-[#5a6a80]">
                                                {formatBytes(doc.fileSizeBytes)}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {doc.isPinnedLocal ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#e6f9f0] text-[#009668] border border-[#b7ecd5]">
                                                        Đã Pin (Local)
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#fee2e2] text-[#ba1a1a] border border-[#fecaca]">
                                                        Chưa Pin
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {doc.isPinnedRemote ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#e6f9f0] text-[#009668] border border-[#b7ecd5]">
                                                        Đã Pin (Cloud)
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#fef3c7] text-[#b45309] border border-[#fde68a]">
                                                        Chưa Pin
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-[#5a6a80]">
                                                {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : '---'}
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSyncDocument(doc.id)}
                                                    disabled={syncingDocId === doc.id}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#c3d0e6] bg-white hover:bg-[#eff4ff] text-[#0051d5] text-xs font-semibold transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                                                >
                                                    <RefreshCw size={12} className={syncingDocId === doc.id ? 'animate-spin' : ''} />
                                                    <span>{syncingDocId === doc.id ? 'Đang đồng bộ...' : 'Đồng bộ'}</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {desyncedTotalPages > 1 && (
                    <div className="px-5 py-3 border-t border-[#e5eeff] bg-[#f8f9ff] flex items-center justify-between text-xs">
                        <span className="text-[#5a6a80]">
                            Trang {desyncedPage + 1} / {desyncedTotalPages} ({desyncedTotalElements} tài liệu lệch pha)
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => loadDesynced(desyncedPage - 1)}
                                disabled={desyncedPage <= 0}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-[#dce9ff] text-[#0b1c30] hover:bg-[#eff4ff] disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium shadow-2xs cursor-pointer"
                            >
                                <ChevronLeft size={13} />
                                <span>Trang trước</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => loadDesynced(desyncedPage + 1)}
                                disabled={desyncedPage >= desyncedTotalPages - 1}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-[#dce9ff] text-[#0b1c30] hover:bg-[#eff4ff] disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium shadow-2xs cursor-pointer"
                            >
                                <span>Trang sau</span>
                                <ChevronRight size={13} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Node Detail & Diagnostics Modal */}
            <NodeDetailModal
                node={selectedNode}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                isBypassed={selectedNode ? isNodeBypassed(selectedNode.id) : false}
                currentMode={topologyData.currentMode}
            />
        </AdminLayout>
    );
}
