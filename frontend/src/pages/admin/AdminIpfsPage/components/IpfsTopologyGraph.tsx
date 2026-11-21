import { useState } from 'react';
import {
    Server,
    Cloud,
    Globe,
    HardDrive,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    RefreshCw,
    Zap,
    Activity,
    SlidersHorizontal,
    ExternalLink,
    Share2,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { Button } from '../../../../components/ui';
import type { IpfsTopologyData, NodeHealthStatus, IpfsPeerItem } from '../types/topology';

interface Props {
    data: IpfsTopologyData;
    peers?: IpfsPeerItem[];
    onRefresh: () => void;
    isRefreshing: boolean;
    onSelectNode?: (nodeKey: 'kubo' | 'pinata' | 'backend' | 'localGateway' | 'pinataGateway') => void;
    onSelectPeer?: (peer: IpfsPeerItem, index: number) => void;
    onModeChange?: (mode: 'hybrid' | 'local-only' | 'pinata-only') => void;
    isChangingMode?: boolean;
}

export function IpfsTopologyGraph({
    data,
    peers = [],
    onRefresh,
    isRefreshing,
    onSelectNode,
    onSelectPeer,
    onModeChange,
    isChangingMode = false
}: Props) {
    const [showAllPeers, setShowAllPeers] = useState(false);
    const { kubo, pinata, gateway, verdict, currentMode = 'hybrid' } = data;
    const isKuboDisabled = currentMode === 'pinata-only';
    const isPinataDisabled = currentMode === 'local-only';

    const getStatusBadge = (status: NodeHealthStatus) => {
        switch (status) {
            case 'online':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e6f9f0] text-[#009668] border border-[#b7ecd5]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#009668]" />
                        HOẠT ĐỘNG
                    </span>
                );
            case 'degraded':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fef3c7] text-[#b45309] border border-[#fde68a]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                        CẢNH BÁO
                    </span>
                );
            case 'offline':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fee2e2] text-[#ba1a1a] border border-[#fca5a5] animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]" />
                        MẤT KẾT NỐI
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                        Đang kiểm tra...
                    </span>
                );
        }
    };

    return (
        <div className="bg-white border border-[#dce9ff] rounded-[14px] p-5 shadow-2xs mb-4">
            {/* Header thanh cong cu */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e5eeff]">
                <div>
                    <h2 className="text-base font-bold text-[#0b1c30] flex items-center gap-2">
                        Sơ đồ Giám sát Tuyến dữ liệu IPFS
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    {data.lastChecked && (
                        <span className="text-[11px] text-[#5a6a80]">
                            Cập nhật: {data.lastChecked}
                        </span>
                    )}
                    <Button
                        variant="secondary"
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="!bg-[#eff4ff] !text-[#0051d5] !border-[#c3d6ff] hover:!bg-[#dce9ff] text-xs font-semibold px-3 py-1.5 rounded-lg"
                        icon={<RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />}
                    >
                        {isRefreshing ? 'Đang ping...' : 'Ping kiểm tra'}
                    </Button>
                </div>
            </div>

            {/* Thanh chon che do luu tru IPFS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 py-2.5 px-3.5 my-3 bg-[#f8f9ff] border border-[#dce9ff] rounded-xl text-xs">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal size={14} className="text-[#0051d5]" />
                    <span className="font-bold text-[#0b1c30]">Chế độ IPFS:</span>
                    <span className="text-[#5a6a80] text-[11px] hidden md:inline">(Chuyển đổi luồng lưu trữ)</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Chọn chế độ IPFS">
                    {(['hybrid', 'local-only', 'pinata-only'] as const).map((modeKey) => {
                        const isActive = currentMode.toLowerCase() === modeKey;
                        const labels: Record<string, string> = {
                            'hybrid': 'Hybrid (Kubo + Pinata)',
                            'local-only': 'Local Kubo',
                            'pinata-only': 'Pinata Cloud',
                        };
                        return (
                            <button
                                key={modeKey}
                                type="button"
                                disabled={isChangingMode}
                                onClick={() => onModeChange?.(modeKey)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${isActive
                                    ? 'bg-[#0051d5] text-white shadow-2xs'
                                    : 'bg-white text-[#5a6a80] hover:text-[#0b1c30] hover:bg-[#eff4ff] border border-[#dce9ff]'
                                    } ${isChangingMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                            >
                                {labels[modeKey]}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Khoi So do Flow truc quan */}
            <div className="py-6 px-2 flex flex-col items-center">
                {/* Tram 1: Document Service */}
                <div
                    onClick={() => onSelectNode?.('backend')}
                    className="w-full max-w-md p-3.5 rounded-xl border border-[#c3d6ff] bg-[#f8f9ff] hover:border-[#0051d5] transition-all cursor-pointer shadow-2xs flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#eff4ff] border border-[#c3d6ff] flex items-center justify-center text-[#0051d5]">
                            <Server size={20} />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-[#0b1c30] flex items-center gap-1.5">
                                Document Service Backend
                                <span className="text-[10px] font-normal text-[#5a6a80]">(Port 8082)</span>
                            </div>
                            <div className="text-[11px] text-[#5a6a80]">Bộ điều phối lưu trữ Hybrid Storage</div>
                        </div>
                    </div>
                    {getStatusBadge(data.backendStatus)}
                </div>

                {/* SVG Day noi che doi (Split Flow) */}
                <div className="w-full max-w-2xl h-12 flex items-center justify-center relative">
                    <svg className="w-full h-full" viewBox="0 0 600 50" preserveAspectRatio="none">
                        {/* Nhanh trai toi Docker */}
                        <path
                            d="M 300 0 L 300 25 L 150 25 L 150 50"
                            fill="none"
                            stroke={isKuboDisabled ? '#94a3b8' : kubo.status === 'offline' ? '#ba1a1a' : '#009668'}
                            strokeWidth="2.5"
                            strokeDasharray={isKuboDisabled ? '4,4' : kubo.status === 'offline' ? '6,4' : 'none'}
                            opacity={isKuboDisabled ? 0.45 : 1}
                        />
                        {/* Nhanh phai toi Pinata */}
                        <path
                            d="M 300 0 L 300 25 L 450 25 L 450 50"
                            fill="none"
                            stroke={isPinataDisabled ? '#94a3b8' : pinata.status === 'offline' ? '#ba1a1a' : '#0051d5'}
                            strokeWidth="2.5"
                            strokeDasharray={isPinataDisabled ? '4,4' : pinata.status === 'offline' ? '6,4' : 'none'}
                            opacity={isPinataDisabled ? 0.45 : 1}
                        />
                    </svg>
                    <span className={`absolute left-[18%] top-1 text-[10px] font-mono px-1.5 rounded border transition-all ${
                        isKuboDisabled
                            ? 'text-[#94a3b8] bg-[#f8fafc] border-[#cbd5e1] line-through'
                            : 'text-[#5a6a80] bg-white border-[#e5eeff]'
                    }`}>
                        Local RPC :5001
                    </span>
                    <span className={`absolute right-[18%] top-1 text-[10px] font-mono px-1.5 rounded border transition-all ${
                        isPinataDisabled
                            ? 'text-[#94a3b8] bg-[#f8fafc] border-[#cbd5e1] line-through'
                            : 'text-[#5a6a80] bg-white border-[#e5eeff]'
                    }`}>
                        Cloud REST API
                    </span>
                </div>

                {/* Tram 2: Kubo Docker & Swarm Peers (Trai) | Pinata Cloud & Multi-Region (Phai) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl items-start">
                    {/* Cot Trai: Kubo Docker & Nhanh Swarm Peers */}
                    <div className="flex flex-col gap-3">
                        {/* Card Kubo Docker */}
                        <div
                            onClick={() => onSelectNode?.('kubo')}
                            className={`p-4 rounded-xl border transition-all cursor-pointer shadow-2xs relative ${
                                isKuboDisabled
                                    ? 'opacity-55 grayscale bg-[#f8fafc] border-[#cbd5e1] hover:border-[#94a3b8]'
                                    : kubo.status === 'offline'
                                    ? 'bg-[#fff5f5] border-[#fca5a5] ring-2 ring-[#ba1a1a]/20'
                                    : 'bg-white border-[#dce9ff] hover:border-[#009668]'
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                                        isKuboDisabled
                                            ? 'bg-[#f1f5f9] text-[#64748b]'
                                            : kubo.status === 'offline'
                                            ? 'bg-[#fee2e2] text-[#ba1a1a]'
                                            : 'bg-[#e6f9f0] text-[#009668]'
                                    }`}>
                                        <HardDrive size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold text-[#0b1c30]">Kubo IPFS (Docker Container)</h3>
                                        <div className="text-[11px] font-mono text-[#5a6a80]">dev_ipfs_kubo :5001</div>
                                    </div>
                                </div>
                                {isKuboDisabled ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f1f5f9] text-[#64748b] border border-[#cbd5e1]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]" />
                                        TẠM BỎ QUA
                                    </span>
                                ) : (
                                    getStatusBadge(kubo.status)
                                )}
                            </div>

                            {/* Chi tiet thong so */}
                            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#f1f5f9] text-[11px]">
                                <div>
                                    <span className="text-[#5a6a80] block text-[10px]">Độ trễ RPC</span>
                                    <span className="font-bold text-[#0b1c30]">
                                        {isKuboDisabled ? 'Bỏ qua' : kubo.pingMs !== null ? `${kubo.pingMs} ms` : 'Timeout'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[#5a6a80] block text-[10px]">Swarm Peers</span>
                                    <span className="font-bold text-[#0b1c30]">
                                        {isKuboDisabled ? '0 peers' : `${peers?.length || kubo.swarmPeersCount || 0} peers`}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[#5a6a80] block text-[10px]">Đã Pin</span>
                                    <span className={`font-bold ${isKuboDisabled ? 'text-[#64748b]' : 'text-[#009668]'}`}>
                                        {kubo.pinnedCount} files
                                    </span>
                                </div>
                            </div>

                            {kubo.errorMessage && !isKuboDisabled && (
                                <div className="mt-2.5 p-2 bg-[#fee2e2] rounded-md text-[10px] text-[#ba1a1a] flex items-center gap-1.5 font-medium">
                                    <XCircle size={13} className="shrink-0" />
                                    <span className="truncate">{kubo.errorMessage}</span>
                                </div>
                            )}

                            {isKuboDisabled && (
                                <div className="mt-2.5 p-2 bg-[#f1f5f9] rounded-md text-[10px] text-[#64748b] font-medium border border-[#cbd5e1]">
                                    Chế độ Pinata-only: Kubo Node tạm ngắt kết nối
                                </div>
                            )}
                        </div>

                        {/* O Nhanh cay Swarm Peers (P2P Cluster) */}
                        <div className={`p-3 rounded-xl border transition-all shadow-2xs ${
                            isKuboDisabled
                                ? 'opacity-55 grayscale bg-[#f8fafc] border-[#cbd5e1]'
                                : 'bg-white border-[#dce9ff]'
                        }`}>
                            <div className="flex items-center justify-between pb-2 border-b border-[#f1f5f9] mb-2">
                                <div className="flex items-center gap-2">
                                    <Share2 size={13} className={isKuboDisabled ? 'text-[#94a3b8]' : 'text-[#009668]'} />
                                    <h4 className="text-xs font-bold text-[#0b1c30]">Mạng lưới P2P Swarm Peers</h4>
                                </div>
                                {isKuboDisabled ? (
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f1f5f9] text-[#64748b] border border-[#cbd5e1]">
                                        Tạm ngắt
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#e6f9f0] text-[#009668] border border-[#b7ecd5]">
                                        {peers?.length || kubo.swarmPeersCount || 0} peers kết nối
                                    </span>
                                )}
                            </div>

                            {isKuboDisabled ? (
                                <div className="text-[11px] text-[#64748b] py-1 text-center">
                                    Mạng lưới P2P Swarm tạm ngắt theo chế độ Pinata-only
                                </div>
                            ) : peers && peers.length > 0 ? (
                                <div className="space-y-1.5">
                                    {(showAllPeers ? peers : peers.slice(0, 3)).map((peer, idx) => (
                                        <div
                                            key={peer.peerId + idx}
                                            onClick={() => onSelectPeer?.(peer, idx)}
                                            className="p-2 rounded-lg bg-[#f8f9ff] hover:bg-[#eff4ff] border border-[#e5eeff] hover:border-[#009668] transition-all cursor-pointer flex items-center justify-between text-[11px] group"
                                            title={`Xem chi tiết Peer:\nĐịa chỉ: ${peer.address}\nHướng: ${peer.direction}`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#009668] shrink-0 animate-pulse" />
                                                <div className="min-w-0">
                                                    <span className="font-mono font-semibold text-[#0b1c30] group-hover:text-[#0051d5] block truncate text-[11px]">
                                                        {peer.peerId.length > 14 ? `${peer.peerId.slice(0, 8)}...${peer.peerId.slice(-4)}` : peer.peerId}
                                                    </span>
                                                    <span className="text-[10px] text-[#5a6a80] block truncate">
                                                        {peer.location || 'Mạng lưới P2P'} · {peer.direction}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white border border-[#dce9ff] text-[#009668] shrink-0 ml-1.5">
                                                {peer.latency || '---'}
                                            </span>
                                        </div>
                                    ))}
                                    {peers.length > 3 && (
                                        <button
                                            type="button"
                                            onClick={() => setShowAllPeers(!showAllPeers)}
                                            className="w-full pt-1 text-center text-[10px] font-semibold text-[#0051d5] hover:underline flex items-center justify-center gap-1 cursor-pointer"
                                        >
                                            {showAllPeers ? (
                                                <><span>Thu gọn</span><ChevronUp size={12} /></>
                                            ) : (
                                                <><span>Xem thêm {peers.length - 3} peers khác</span><ChevronDown size={12} /></>
                                            )}
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="text-[11px] text-[#5a6a80] py-1 text-center italic">
                                    Đang duy trì {kubo.swarmPeersCount} kết nối Swarm qua giao thức Bitswap / DHT
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cot Phai: Pinata Cloud & Multi-Region Box */}
                    <div className="flex flex-col gap-3">
                        {/* Card Pinata Cloud */}
                        <div
                            onClick={() => onSelectNode?.('pinata')}
                            className={`p-4 rounded-xl border transition-all cursor-pointer shadow-2xs relative ${
                                isPinataDisabled
                                    ? 'opacity-55 grayscale bg-[#f8fafc] border-[#cbd5e1] hover:border-[#94a3b8]'
                                    : pinata.status === 'offline'
                                    ? 'bg-[#fff5f5] border-[#fca5a5] ring-2 ring-[#ba1a1a]/20'
                                    : pinata.status === 'degraded'
                                    ? 'bg-[#fffbeb] border-[#fde68a]'
                                    : 'bg-white border-[#dce9ff] hover:border-[#0051d5]'
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                                        isPinataDisabled
                                            ? 'bg-[#f1f5f9] text-[#64748b]'
                                            : pinata.status === 'offline'
                                            ? 'bg-[#fee2e2] text-[#ba1a1a]'
                                            : 'bg-[#eff4ff] text-[#0051d5]'
                                    }`}>
                                        <Cloud size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold text-[#0b1c30]">Pinata Cloud Bridge</h3>
                                        <div className="text-[11px] font-mono text-[#5a6a80]">api.pinata.cloud</div>
                                    </div>
                                </div>
                                {isPinataDisabled ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f1f5f9] text-[#64748b] border border-[#cbd5e1]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]" />
                                        TẠM BỎ QUA
                                    </span>
                                ) : (
                                    getStatusBadge(pinata.status)
                                )}
                            </div>

                            {/* Chi tiet thong so */}
                            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#f1f5f9] text-[11px]">
                                <div>
                                    <span className="text-[#5a6a80] block text-[10px]">Độ trễ API</span>
                                    <span className="font-bold text-[#0b1c30]">
                                        {isPinataDisabled ? 'Bỏ qua' : pinata.pingMs !== null ? `${pinata.pingMs} ms` : 'Timeout'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[#5a6a80] block text-[10px]">Auth Token</span>
                                    <span className={`font-bold ${isPinataDisabled ? 'text-[#64748b]' : pinata.authenticated ? 'text-[#009668]' : 'text-[#ba1a1a]'}`}>
                                        {isPinataDisabled ? 'Tạm ngắt' : pinata.authenticated ? 'Hợp lệ' : 'Hết hạn'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[#5a6a80] block text-[10px]">Cloud Pinned</span>
                                    <span className={`font-bold ${isPinataDisabled ? 'text-[#64748b]' : 'text-[#0051d5]'}`}>
                                        {pinata.pinnedCount} files
                                    </span>
                                </div>
                            </div>

                            {pinata.errorMessage && !isPinataDisabled && (
                                <div className="mt-2.5 p-2 bg-[#fee2e2] rounded-md text-[10px] text-[#ba1a1a] flex items-center gap-1.5 font-medium">
                                    <AlertTriangle size={13} className="shrink-0" />
                                    <span className="truncate">{pinata.errorMessage}</span>
                                </div>
                            )}

                            {isPinataDisabled && (
                                <div className="mt-2.5 p-2 bg-[#f1f5f9] rounded-md text-[10px] text-[#64748b] font-medium border border-[#cbd5e1]">
                                    Chế độ Local-only: Pinata Cloud tạm ngắt kết nối
                                </div>
                            )}
                        </div>

                        {/* O Phân vùng Lưu trữ Cloud (Pinata Multi-Region) */}
                        <div className={`p-3 rounded-xl border transition-all shadow-2xs ${
                            isPinataDisabled
                                ? 'opacity-55 grayscale bg-[#f8fafc] border-[#cbd5e1]'
                                : 'bg-white border-[#dce9ff]'
                        }`}>
                            <div className="flex items-center justify-between pb-2 border-b border-[#f1f5f9] mb-2">
                                <div className="flex items-center gap-2">
                                    <Cloud size={13} className={isPinataDisabled ? 'text-[#94a3b8]' : 'text-[#0051d5]'} />
                                    <h4 className="text-xs font-bold text-[#0b1c30]">Phân vùng Pinata Cloud</h4>
                                </div>
                                {isPinataDisabled ? (
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f1f5f9] text-[#64748b] border border-[#cbd5e1]">
                                        Tạm ngắt
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#eff4ff] text-[#0051d5] border border-[#c3d6ff]">
                                        2 Vùng lưu trữ
                                    </span>
                                )}
                            </div>

                            {isPinataDisabled ? (
                                <div className="text-[11px] text-[#64748b] py-1 text-center">
                                    Lưu trữ đám mây tạm ngắt theo chế độ Local-only
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <div className="p-2 rounded-lg bg-[#f8f9ff] border border-[#e5eeff] flex items-center justify-between text-[11px]">
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#0051d5] shrink-0" />
                                            <div>
                                                <span className="font-semibold text-[#0b1c30] block text-[11px]">FRA1 (Frankfurt, EU)</span>
                                                <span className="text-[10px] text-[#5a6a80] block">Cụm lưu trữ chính (Primary Region)</span>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white border border-[#dce9ff] text-[#0051d5]">
                                            1x Bản sao
                                        </span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-[#f8f9ff] border border-[#e5eeff] flex items-center justify-between text-[11px]">
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#0051d5] shrink-0" />
                                            <div>
                                                <span className="font-semibold text-[#0b1c30] block text-[11px]">NYC1 (New York, US)</span>
                                                <span className="text-[10px] text-[#5a6a80] block">Cụm phân vùng dự phòng (Replica)</span>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white border border-[#dce9ff] text-[#0051d5]">
                                            1x Bản sao
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* SVG Day noi xuong Gateway */}
                <div className="w-full max-w-2xl h-8 flex items-center justify-around relative">
                    <div className={`w-0.5 h-full transition-all ${isKuboDisabled ? 'bg-[#cbd5e1] opacity-40' : 'bg-[#dce9ff]'}`} />
                    <div className={`w-0.5 h-full transition-all ${isPinataDisabled ? 'bg-[#cbd5e1] opacity-40' : 'bg-[#dce9ff]'}`} />
                </div>

                {/* Tram 3: Output Gateways */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
                    <div
                        onClick={() => onSelectNode?.('localGateway')}
                        className={`p-3 rounded-xl flex items-center justify-between text-xs transition-all cursor-pointer shadow-2xs group ${
                            isKuboDisabled
                                ? 'opacity-55 grayscale bg-[#f8fafc] border border-[#cbd5e1]'
                                : 'bg-[#f8f9ff] hover:bg-[#edf3ff] border border-[#e5eeff] hover:border-[#009668]'
                        }`}
                        title="Xem chi tiết Local Gateway"
                    >
                        <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-2xs ${
                                isKuboDisabled
                                    ? 'bg-[#f1f5f9] text-[#64748b] border border-[#cbd5e1]'
                                    : 'bg-white border border-[#dce9ff] text-[#009668]'
                            }`}>
                                <Globe size={16} />
                            </div>
                            <div>
                                <span className="font-semibold text-[#0b1c30] block group-hover:text-[#0051d5]">Local Gateway (:8080/ipfs)</span>
                                <span className="text-[10px] text-[#5a6a80] font-mono">http://127.0.0.1:8080/ipfs/</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isKuboDisabled ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f1f5f9] text-[#64748b] border border-[#cbd5e1]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]" />
                                    TẠM BỎ QUA
                                </span>
                            ) : (
                                getStatusBadge(gateway.localGatewayStatus)
                            )}
                            <button
                                type="button"
                                disabled={isKuboDisabled}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const url = 'http://127.0.0.1:8080/ipfs/bafkreignqlsnvgeatzkxjivltx6zixyvoyqtebitdpefb5abjrtokxkgme';
                                    window.open(url, '_blank', 'noopener,noreferrer');
                                }}
                                className={`p-1 rounded-md transition-colors ${
                                    isKuboDisabled
                                        ? 'text-[#94a3b8] cursor-not-allowed'
                                        : 'text-[#5a6a80] hover:text-[#0051d5] hover:bg-white'
                                }`}
                                title="Mở nội dung xác thực qua Local Gateway"
                            >
                                <ExternalLink size={13} />
                            </button>
                        </div>
                    </div>
                    <div
                        onClick={() => onSelectNode?.('pinataGateway')}
                        className={`p-3 rounded-xl flex items-center justify-between text-xs transition-all cursor-pointer shadow-2xs group ${
                            isPinataDisabled
                                ? 'opacity-55 grayscale bg-[#f8fafc] border border-[#cbd5e1]'
                                : 'bg-[#f8f9ff] hover:bg-[#edf3ff] border border-[#e5eeff] hover:border-[#0051d5]'
                        }`}
                        title="Xem chi tiết Pinata Gateway"
                    >
                        <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-2xs ${
                                isPinataDisabled
                                    ? 'bg-[#f1f5f9] text-[#64748b] border border-[#cbd5e1]'
                                    : 'bg-white border border-[#dce9ff] text-[#0051d5]'
                            }`}>
                                <Globe size={16} />
                            </div>
                            <div>
                                <span className="font-semibold text-[#0b1c30] block group-hover:text-[#0051d5]">Pinata Dedicated Gateway</span>
                                <span className="text-[10px] text-[#5a6a80] font-mono truncate max-w-[190px] block" title={gateway.pinataGatewayUrl || 'https://harlequin-working-cheetah-340.mypinata.cloud/ipfs/'}>
                                    {gateway.pinataGatewayUrl ? gateway.pinataGatewayUrl.replace(/^https?:\/\//, '').replace(/\/ipfs\/.*$/, '') : 'harlequin-working-cheetah-340.mypinata.cloud'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isPinataDisabled ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f1f5f9] text-[#64748b] border border-[#cbd5e1]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]" />
                                    TẠM BỎ QUA
                                </span>
                            ) : (
                                getStatusBadge(gateway.pinataGatewayStatus)
                            )}
                            <button
                                type="button"
                                disabled={isPinataDisabled}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const baseUrl = gateway.pinataGatewayUrl || 'https://harlequin-working-cheetah-340.mypinata.cloud/ipfs/';
                                    const url = `${baseUrl.replace(/\/+$/, '')}/bafkreignqlsnvgeatzkxjivltx6zixyvoyqtebitdpefb5abjrtokxkgme`;
                                    window.open(url, '_blank', 'noopener,noreferrer');
                                }}
                                className={`p-1 rounded-md transition-colors ${
                                    isPinataDisabled
                                        ? 'text-[#94a3b8] cursor-not-allowed'
                                        : 'text-[#5a6a80] hover:text-[#0051d5] hover:bg-white'
                                }`}
                                title="Mở nội dung xác thực qua Pinata Dedicated Gateway"
                            >
                                <ExternalLink size={13} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Diagnostic Verdict Alert Banner */}
            <div className={`mt-2 p-3.5 rounded-xl border flex items-start gap-3 ${verdict.level === 'danger'
                ? 'bg-[#fff5f5] border-[#fca5a5] text-[#ba1a1a]'
                : verdict.level === 'warning'
                    ? 'bg-[#fffbeb] border-[#fde68a] text-[#b45309]'
                    : 'bg-[#e6f9f0] border-[#b7ecd5] text-[#009668]'
                }`}>
                {verdict.level === 'danger' ? (
                    <XCircle size={18} className="shrink-0 mt-0.5 text-[#ba1a1a]" />
                ) : verdict.level === 'warning' ? (
                    <AlertTriangle size={18} className="shrink-0 mt-0.5 text-[#b45309]" />
                ) : (
                    <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-[#009668]" />
                )}
                <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">{verdict.title}</h4>
                    <p className="text-xs mt-0.5 opacity-90 leading-relaxed">{verdict.description}</p>
                </div>
            </div>
        </div>
    );
}
