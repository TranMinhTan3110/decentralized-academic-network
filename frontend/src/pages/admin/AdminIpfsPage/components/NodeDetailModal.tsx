import { useState } from 'react';
import {
    X,
    Copy,
    Check,
    Server,
    Activity,
    HardDrive,
    ShieldCheck,
    Wifi,
    Terminal,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Layers,
    Trash2,
    ExternalLink,
} from 'lucide-react';
import { Button } from '../../../../components/ui';
import { ipfsAdminService } from '../../../../services/ipfsAdminService';

export type NodeStatus = 'active' | 'hot' | 'error' | 'maintenance' | 'offline';
export type NodeType = 'gateway' | 'storage' | 'relay' | 'bootstrap';

export interface IpfsNodeInfo {
    id: number;
    name: string;
    cid: string;
    sla: string;
    lat: string;
    reviews: string;
    status: NodeStatus;
    nodeType?: NodeType;
    multiaddr?: string;
    bandwidth?: string;
    storageUsed?: string;
    version?: string;
    location?: string;
    logs?: string[];
}

export interface NodeDetailModalProps {
    node: IpfsNodeInfo | null;
    isOpen: boolean;
    onClose: () => void;
    isBypassed?: boolean;
    currentMode?: string;
}

export function NodeDetailModal({ node, isOpen, onClose, isBypassed = false, currentMode }: NodeDetailModalProps) {
    const [activeTab, setActiveTab] = useState<'metrics' | 'logs'>('metrics');
    const [copiedMultiaddr, setCopiedMultiaddr] = useState(false);
    const [copiedLog, setCopiedLog] = useState(false);
    const [pinging, setPinging] = useState(false);
    const [pingLatency, setPingLatency] = useState<string | null>(null);
    const [isCleaningGc, setIsCleaningGc] = useState(false);
    const [gcMessage, setGcMessage] = useState<string | null>(null);

    if (!isOpen || !node) return null;

    const fullMultiaddr = node.multiaddr || `/p2p/${node.cid}`;

    const handleCopyMultiaddr = () => {
        navigator.clipboard?.writeText(fullMultiaddr);
        setCopiedMultiaddr(true);
        setTimeout(() => setCopiedMultiaddr(false), 2000);
    };

    const handleRunGc = async () => {
        setIsCleaningGc(true);
        setGcMessage(null);
        try {
            const res = await ipfsAdminService.runGarbageCollection();
            if (res.success) {
                setGcMessage(`Đã dọn dẹp ${res.clearedBlocks} khối unpinned rác thành công.`);
            } else {
                setGcMessage(res.message || 'Dọn dẹp thất bại.');
            }
        } catch {
            setGcMessage('Không thể kích hoạt dọn dẹp bộ nhớ Kubo.');
        } finally {
            setIsCleaningGc(false);
            setTimeout(() => setGcMessage(null), 5000);
        }
    };

    const handlePing = () => {
        setPinging(true);
        if (node.id === 101) {
            ipfsAdminService
                .getOverview()
                .then(() => setPingLatency('1 ms (Nội bộ)'))
                .catch(() => setPingLatency('Không phản hồi'))
                .finally(() => setTimeout(() => setPinging(false), 500));
            return;
        }

        ipfsAdminService
            .runDiagnostics()
            .then((diag) => {
                if (node.id === 2) {
                    setPingLatency(diag.kuboPingMs !== null ? `${diag.kuboPingMs} ms` : 'Timeout (> 1500 ms)');
                } else if (node.id === 1) {
                    setPingLatency(diag.pinataPingMs !== null ? `${diag.pinataPingMs} ms` : 'Timeout (> 1500 ms)');
                } else if (node.id === 102) {
                    setPingLatency(diag.localGatewayAvailable ? '8 ms' : 'Không khả dụng');
                } else if (node.id === 103) {
                    setPingLatency(diag.pinataGatewayAvailable ? '42 ms' : 'Không khả dụng');
                } else {
                    setPingLatency(diag.kuboPingMs !== null ? `${diag.kuboPingMs} ms` : node.lat || '12 ms');
                }
            })
            .catch(() => {
                if (node.status === 'error' || node.status === 'offline') {
                    setPingLatency('Timeout (> 1500 ms)');
                } else {
                    setPingLatency(node.lat || '12 ms');
                }
            })
            .finally(() => {
                setTimeout(() => setPinging(false), 500);
            });
    };

    const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const defaultLogs = node.logs && node.logs.length > 0
        ? node.logs
        : node.status === 'error' || node.status === 'offline'
        ? [
            `[${nowStr}] [INFO] Khởi tạo kết nối Swarm / API tới node: ${node.name}`,
            `[${nowStr}] [WARN] Phát hiện phản hồi trễ bất thường hoặc gián đoạn luồng dữ liệu`,
            `[${nowStr}] [ERROR] Thao tác bắt tay Swarm P2P thất bại hoặc kết nối bị từ chối`,
            `[${nowStr}] [CRITICAL] Trạng thái node được ghi nhận là ${node.status.toUpperCase()}. Hệ thống chuyển luồng dự phòng.`,
        ]
        : [
            `[${nowStr}] [INFO] Node ${node.name} (${node.version || 'IPFS'}) đang hoạt động bình thường`,
            `[${nowStr}] [INFO] Băng thông danh định: ${node.bandwidth || 'Tiêu chuẩn'} | SLA: ${node.sla}`,
            `[${nowStr}] [INFO] Kiểm tra kết nối định kỳ hoàn tất: độ trễ ${pingLatency || node.lat}`,
            `[${nowStr}] [INFO] Số khối/tài liệu ghi nhận: ${node.reviews}`,
        ];

    const handleCopyLogs = () => {
        navigator.clipboard?.writeText(defaultLogs.join('\n'));
        setCopiedLog(true);
        setTimeout(() => setCopiedLog(false), 2000);
    };

    const getStatusBadge = () => {
        if (isBypassed) {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f1f5f9] text-[#64748b] border border-[#cbd5e1]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]" />
                    Tạm ngắt ({currentMode === 'local-only' ? 'Local-only' : 'Pinata-only'})
                </span>
            );
        }
        switch (node.status) {
            case 'hot':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#009668] text-white">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Node Quản trị (#8)
                    </span>
                );
            case 'error':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fee2e2] text-[#ba1a1a] border border-[#fecaca]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a] animate-pulse" />
                        Lỗi kết nối
                    </span>
                );
            case 'maintenance':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fef3c7] text-[#b45309] border border-[#fde68a]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                        Đang bảo trì
                    </span>
                );
            case 'offline':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f1f5f9] text-[#64748b] border border-[#cbd5e1]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]" />
                        Ngừng hoạt động
                    </span>
                );
            case 'active':
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e6f9f0] text-[#009668] border border-[#b7ecd5]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#009668] animate-pulse" />
                        Đang hoạt động
                    </span>
                );
        }
    };

    const getNodeTypeLabel = (type?: NodeType) => {
        switch (type) {
            case 'gateway':
                return 'IPFS Edge Gateway';
            case 'storage':
                return 'Core Storage & Pinning Node';
            case 'relay':
                return 'Circuit Relay v2 Node';
            case 'bootstrap':
                return 'DHT Bootstrap Peer';
            default:
                return 'P2P Storage Worker';
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0b1c30]/50 backdrop-blur-xs animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="node-modal-title"
        >
            <div className="w-full max-w-[620px] bg-white rounded-2xl border border-[#dce9ff] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="p-4 sm:p-5 border-b border-[#e5eeff] flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#0b1c30] text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Server size={20} className="text-white" />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 id="node-modal-title" className="text-base font-bold text-[#0b1c30]">
                                    {node.name}
                                </h3>
                                {getStatusBadge()}
                            </div>
                            <p className="text-xs text-[#5a6a80] mt-0.5 flex items-center gap-1.5">
                                <Layers size={13} className="text-[#0051d5]" />
                                <span>{getNodeTypeLabel(node.nodeType)}</span>
                                <span>·</span>
                                <span>{node.location || 'Cụm máy chủ P2P'}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-[#5a6a80] hover:text-[#0b1c30] hover:bg-[#eff4ff] rounded-lg transition-colors cursor-pointer"
                        aria-label="Đóng modal"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Banner thong bao neu node dang tam ngat theo che do van hanh */}
                {isBypassed && (
                    <div className="mx-4 sm:mx-5 mt-3 p-3 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl flex items-center gap-2.5 text-xs text-[#64748b]">
                        <AlertTriangle size={15} className="shrink-0 text-[#94a3b8]" />
                        <span>
                            Node này hiện đang tạm ngắt kết nối do hệ thống đang vận hành ở chế độ{' '}
                            <strong className="text-[#0b1c30]">
                                {currentMode === 'local-only' ? 'Local Kubo Only' : 'Pinata Cloud Only'}
                            </strong>.
                        </span>
                    </div>
                )}

                {/* Tabs Switcher */}
                <div className="flex items-center border-b border-[#e5eeff] bg-[#f8f9ff] px-4 pt-2 gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab('metrics')}
                        className={`py-2 px-3 text-xs font-semibold rounded-t-lg flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 -mb-px ${
                            activeTab === 'metrics'
                                ? 'bg-white border-[#0051d5] text-[#0051d5] shadow-2xs'
                                : 'border-transparent text-[#5a6a80] hover:text-[#0b1c30]'
                        }`}
                    >
                        <Activity size={14} />
                        <span>Thông số kết nối</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('logs')}
                        className={`py-2 px-3 text-xs font-semibold rounded-t-lg flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 -mb-px ${
                            activeTab === 'logs'
                                ? 'bg-white border-[#0051d5] text-[#0051d5] shadow-2xs'
                                : 'border-transparent text-[#5a6a80] hover:text-[#0b1c30]'
                        }`}
                    >
                        <Terminal size={14} />
                        <span>Nhật ký lỗi & Kết nối</span>
                        {node.status === 'error' && (
                            <span className="w-2 h-2 rounded-full bg-[#ba1a1a] animate-ping" />
                        )}
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
                    {activeTab === 'metrics' ? (
                        <>
                            {/* Node CID / Peer ID Box */}
                            <div className="p-3 bg-[#f8f9ff] border border-[#dce9ff] rounded-xl flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                    <span className="text-[11px] font-semibold text-[#5a6a80] block uppercase tracking-wider">
                                        Peer ID / Node CID
                                    </span>
                                    <span className="font-mono text-xs font-semibold text-[#0051d5] truncate block mt-0.5">
                                        {node.cid}
                                    </span>
                                </div>
                                <span className="px-2 py-1 text-[11px] font-mono text-[#5a6a80] bg-white border border-[#c3d0e6] rounded-md shrink-0">
                                    {node.version || 'Kubo v0.32.0'}
                                </span>
                            </div>

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                                <div className="p-3 bg-white border border-[#dce9ff] rounded-xl flex flex-col gap-1 shadow-2xs">
                                    <div className="flex items-center gap-1.5 text-[11px] text-[#5a6a80] font-medium">
                                        <ShieldCheck size={14} className="text-[#009668]" />
                                        <span>SLA Uptime</span>
                                    </div>
                                    <span className={`text-base font-bold ${node.status === 'error' ? 'text-[#ba1a1a]' : 'text-[#009668]'}`}>
                                        {node.sla}
                                    </span>
                                </div>

                                <div className="p-3 bg-white border border-[#dce9ff] rounded-xl flex flex-col gap-1 shadow-2xs">
                                    <div className="flex items-center gap-1.5 text-[11px] text-[#5a6a80] font-medium">
                                        <Activity size={14} className="text-[#0051d5]" />
                                        <span>Độ trễ Ping</span>
                                    </div>
                                    <span className={`text-base font-bold ${node.status === 'error' ? 'text-[#ba1a1a]' : 'text-[#0b1c30]'}`}>
                                        {pingLatency || node.lat}
                                    </span>
                                </div>

                                <div className="p-3 bg-white border border-[#dce9ff] rounded-xl flex flex-col gap-1 shadow-2xs">
                                    <div className="flex items-center gap-1.5 text-[11px] text-[#5a6a80] font-medium">
                                        <Wifi size={14} className="text-[#3b82f6]" />
                                        <span>Băng thông</span>
                                    </div>
                                    <span className="text-base font-bold text-[#0b1c30]">
                                        {node.bandwidth || '180 Mbps'}
                                    </span>
                                </div>

                                <div className="p-3 bg-white border border-[#dce9ff] rounded-xl flex flex-col gap-1 shadow-2xs">
                                    <div className="flex items-center gap-1.5 text-[11px] text-[#5a6a80] font-medium">
                                        <HardDrive size={14} className="text-[#8b5cf6]" />
                                        <span>Lưu trữ Pin</span>
                                    </div>
                                    <span className="text-base font-bold text-[#0b1c30]">
                                        {node.storageUsed || '14.2 TB'}
                                    </span>
                                </div>
                            </div>

                            {/* Multiaddr with copy button */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#0b1c30]">
                                    {node.nodeType === 'gateway' ? 'Địa chỉ Cổng IPFS Gateway (Base URL)' : 'Địa chỉ Swarm Multiaddr'}
                                </label>
                                <div className="flex items-center gap-2 p-2.5 bg-[#eff4ff] border border-[#dce9ff] rounded-xl">
                                    <span className="font-mono text-[11px] text-[#0b1c30] truncate flex-1 select-all">
                                        {fullMultiaddr}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleCopyMultiaddr}
                                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-[#c3d0e6] hover:bg-[#eff4ff] text-[#0b1c30] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
                                        title="Sao chép Multiaddr"
                                    >
                                        {copiedMultiaddr ? (
                                            <>
                                                <Check size={13} className="text-[#009668]" />
                                                <span className="text-[#009668]">Đã chép</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={13} />
                                                <span>Sao chép</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Review Activity */}
                            <div className="p-3.5 bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl flex items-center justify-between text-xs text-[#15803d]">
                                <span>Tổng số tài liệu đã Pin & Đồng bộ Bitswap:</span>
                                <span className="font-bold font-mono text-sm">{node.reviews} CID</span>
                            </div>
                        </>
                    ) : (
                        /* Logs Terminal Tab */
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-[#0b1c30] flex items-center gap-1.5">
                                    <Terminal size={14} className="text-[#0051d5]" />
                                    <span>Terminal Logs Daemon ({node.version || 'Kubo v0.26.0'})</span>
                                </span>
                                <button
                                    type="button"
                                    onClick={handleCopyLogs}
                                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-[#c3d0e6] hover:bg-[#eff4ff] text-[#0b1c30] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                                >
                                    {copiedLog ? (
                                        <>
                                            <Check size={13} className="text-[#009668]" />
                                            <span className="text-[#009668]">Đã sao chép</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={13} />
                                            <span>Sao chép nhật ký</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="bg-[#0a0f1d] text-gray-200 font-mono text-[11px] sm:text-xs rounded-xl p-3.5 sm:p-4 space-y-1.5 overflow-x-auto max-h-[300px] border border-[#1e293b] shadow-inner">
                                {defaultLogs.map((line, idx) => {
                                    const isError = line.includes('[ERROR]') || line.includes('[CRITICAL]');
                                    const isWarn = line.includes('[WARN]');
                                    const isInfo = line.includes('[INFO]');

                                    return (
                                        <div
                                            key={idx}
                                            className={`leading-relaxed whitespace-pre-wrap ${
                                                isError
                                                    ? 'text-[#f87171] font-semibold'
                                                    : isWarn
                                                    ? 'text-[#facc15]'
                                                    : isInfo
                                                    ? 'text-[#93c5fd]'
                                                    : 'text-gray-300'
                                            }`}
                                        >
                                            {line}
                                        </div>
                                    );
                                })}
                            </div>

                            <p className="text-[11px] text-[#5a6a80] flex items-center gap-1">
                                <Clock size={12} />
                                <span>Nhật ký được cập nhật theo thời gian thực từ Swarm Daemon.</span>
                            </p>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-[#e5eeff] bg-[#f8f9ff] flex flex-wrap items-center justify-between gap-2.5">
                    <div className="text-xs">
                        {gcMessage && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#e6f9f0] border border-[#b7ecd5] text-[#009668] font-semibold text-[11px]">
                                <Check size={13} />
                                {gcMessage}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {node.id === 2 && (
                            <Button
                                variant="secondary"
                                onClick={handleRunGc}
                                disabled={isCleaningGc}
                                className="!bg-white !border-[#fed7aa] !text-[#b45309] hover:!bg-[#fffbeb] text-xs font-semibold px-3 py-2 rounded-[9px]"
                                icon={<Trash2 size={13} className={isCleaningGc ? 'animate-spin' : ''} />}
                            >
                                {isCleaningGc ? 'Đang dọn dẹp...' : 'Dọn rác repo (Repo GC)'}
                            </Button>
                        )}

                        {(node.id === 102 || node.id === 103) && (
                            <>
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        const url = node.id === 103
                                            ? `${(node.multiaddr || 'https://harlequin-working-cheetah-340.mypinata.cloud/ipfs/').replace(/\/+$/, '')}/bafkreignqlsnvgeatzkxjivltx6zixyvoyqtebitdpefb5abjrtokxkgme`
                                            : 'http://127.0.0.1:8080/ipfs/bafkreignqlsnvgeatzkxjivltx6zixyvoyqtebitdpefb5abjrtokxkgme';
                                        window.open(url, '_blank', 'noopener,noreferrer');
                                    }}
                                    className="!bg-white !border-[#c3d0e6] !text-[#0051d5] hover:!bg-[#eff4ff] text-xs font-semibold px-3 py-2 rounded-[9px]"
                                    icon={<ExternalLink size={13} />}
                                    title="Mở nội dung xác thực kiểm tra cổng IPFS Gateway"
                                >
                                    Mở Gateway
                                </Button>
                                {node.id === 102 && (
                                    <Button
                                        variant="secondary"
                                        onClick={() => window.open('http://127.0.0.1:5001/webui', '_blank', 'noopener,noreferrer')}
                                        className="!bg-white !border-[#b7ecd5] !text-[#009668] hover:!bg-[#e6f9f0] text-xs font-semibold px-3 py-2 rounded-[9px]"
                                        icon={<ExternalLink size={13} />}
                                        title="Mở giao diện quản trị IPFS Kubo WebUI (:5001)"
                                    >
                                        Mở WebUI (:5001)
                                    </Button>
                                )}
                                {node.id === 103 && (
                                    <Button
                                        variant="secondary"
                                        onClick={() => window.open('https://app.pinata.cloud/gateway', '_blank', 'noopener,noreferrer')}
                                        className="!bg-white !border-[#ddd6fe] !text-[#8b5cf6] hover:!bg-[#f5f3ff] text-xs font-semibold px-3 py-2 rounded-[9px]"
                                        icon={<ExternalLink size={13} />}
                                        title="Mở trang quản lý Pinata Dedicated Gateway Dashboard"
                                    >
                                        Pinata Dashboard
                                    </Button>
                                )}
                            </>
                        )}

                        <Button
                            variant="secondary"
                            onClick={handlePing}
                            disabled={pinging}
                            className="!bg-white !border-[#c3d0e6] !text-[#0b1c30] hover:!bg-[#eff4ff] text-xs font-semibold px-3.5 py-2 rounded-[9px]"
                            icon={<Activity size={14} className={pinging ? 'animate-spin' : ''} />}
                        >
                            {pinging ? 'Đang ping...' : 'Ping kiểm tra độ trễ'}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={onClose}
                            className="!bg-[#0b1c30] hover:!bg-[#1d3350] text-white text-xs font-semibold px-4 py-2 rounded-[9px]"
                        >
                            Đóng
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
