import { useState } from 'react';
import { X, Copy, Check, Server, Activity, HardDrive, ShieldCheck, Wifi } from 'lucide-react';
import { Button } from '../../../../components/ui';

export interface IpfsNodeInfo {
    id: number;
    name: string;
    cid: string;
    sla: string;
    lat: string;
    reviews: string;
    status?: 'active' | 'hot' | 'warning';
    multiaddr?: string;
    bandwidth?: string;
    storageUsed?: string;
    version?: string;
    location?: string;
}

export interface NodeDetailModalProps {
    node: IpfsNodeInfo | null;
    isOpen: boolean;
    onClose: () => void;
}

export function NodeDetailModal({ node, isOpen, onClose }: NodeDetailModalProps) {
    const [copied, setCopied] = useState(false);
    const [pinging, setPinging] = useState(false);
    const [pingLatency, setPingLatency] = useState<string | null>(null);

    if (!isOpen || !node) return null;

    const fullMultiaddr =
        node.multiaddr ||
        `/ip4/113.190.24.${node.id * 2}/tcp/4001/p2p/${node.cid.replace('...', 'abc123xyz')}`;

    const handleCopy = () => {
        navigator.clipboard?.writeText(fullMultiaddr);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePing = () => {
        setPinging(true);
        setTimeout(() => {
            setPinging(false);
            setPingLatency(`${Math.floor(Math.random() * 10) + 12} ms`);
        }, 500);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1c30]/50 backdrop-blur-xs animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="node-modal-title"
        >
            <div className="w-full max-w-[560px] bg-white rounded-2xl border border-[#dce9ff] shadow-2xl overflow-hidden flex flex-col">
                {/* Modal Header */}
                <div className="p-5 border-b border-[#e5eeff] flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#0b1c30] text-white flex items-center justify-center shrink-0">
                            <Server size={20} className="text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 id="node-modal-title" className="text-base font-bold text-[#0b1c30]">
                                    {node.name}
                                </h3>
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#e6f9f0] text-[#009668] border border-[#b7ecd5]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#009668] animate-pulse" />
                                    Node #{node.id}
                                </span>
                            </div>
                            <p className="text-xs text-[#5a6a80] mt-0.5">
                                {node.location || 'Khu vực Việt Nam'} · Kubo v0.26.0
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

                {/* Modal Body */}
                <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
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
                        <span className="px-2 py-1 text-[11px] font-mono text-[#5a6a80] bg-white border border-[#c3d0e6] rounded-md">
                            IPFS v0.4
                        </span>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 bg-white border border-[#dce9ff] rounded-xl flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-[11px] text-[#5a6a80] font-medium">
                                <ShieldCheck size={14} className="text-[#009668]" />
                                <span>SLA</span>
                            </div>
                            <span className="text-base font-bold text-[#009668]">{node.sla}</span>
                        </div>

                        <div className="p-3 bg-white border border-[#dce9ff] rounded-xl flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-[11px] text-[#5a6a80] font-medium">
                                <Activity size={14} className="text-[#0051d5]" />
                                <span>Độ trễ</span>
                            </div>
                            <span className="text-base font-bold text-[#0b1c30]">
                                {pingLatency || node.lat}
                            </span>
                        </div>

                        <div className="p-3 bg-white border border-[#dce9ff] rounded-xl flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-[11px] text-[#5a6a80] font-medium">
                                <Wifi size={14} className="text-[#3b82f6]" />
                                <span>Băng thông</span>
                            </div>
                            <span className="text-base font-bold text-[#0b1c30]">
                                {node.bandwidth || '180 Mbps'}
                            </span>
                        </div>

                        <div className="p-3 bg-white border border-[#dce9ff] rounded-xl flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-[11px] text-[#5a6a80] font-medium">
                                <HardDrive size={14} className="text-[#8b5cf6]" />
                                <span>Lưu trữ</span>
                            </div>
                            <span className="text-base font-bold text-[#0b1c30]">
                                {node.storageUsed || '14.2 TB'}
                            </span>
                        </div>
                    </div>

                    {/* Multiaddr with copy button */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#0b1c30]">
                            Địa chỉ Swarm Multiaddr
                        </label>
                        <div className="flex items-center gap-2 p-2.5 bg-[#eff4ff] border border-[#dce9ff] rounded-xl">
                            <span className="font-mono text-[11px] text-[#0b1c30] truncate flex-1 select-all">
                                {fullMultiaddr}
                            </span>
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-[#c3d0e6] hover:bg-[#eff4ff] text-[#0b1c30] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
                                title="Sao chép Multiaddr"
                            >
                                {copied ? (
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
                    <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-center justify-between text-xs text-[#065f46]">
                        <span>Tổng lượt thẩm định & lưu trữ tài liệu:</span>
                        <span className="font-bold font-mono text-sm">{node.reviews} tài liệu</span>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-[#e5eeff] bg-[#f8f9ff] flex items-center justify-end gap-2.5">
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
    );
}
