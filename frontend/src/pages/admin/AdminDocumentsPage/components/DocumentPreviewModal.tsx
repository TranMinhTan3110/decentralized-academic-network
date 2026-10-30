import React, { useEffect } from 'react';
import { X, Copy, Check, CheckCircle2, Trash2, Send, ExternalLink } from 'lucide-react';
import { type AdminDocument } from '../types';

export interface DocumentPreviewModalProps {
    isOpen: boolean;
    document: AdminDocument | null;
    onClose: () => void;
    onApprove: (doc: AdminDocument) => void;
    onReject: (doc: AdminDocument) => void;
    onRequestRevision: (doc: AdminDocument) => void;
    onCopyCid: (cid: string) => void;
    copiedCid: string | null;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
    isOpen,
    document: doc,
    onClose,
    onApprove,
    onReject,
    onRequestRevision,
    onCopyCid,
    copiedCid,
}) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !doc) return null;

    const okVotes = doc.ok ?? 8;
    const totalVotes = doc.total ?? 10;
    const approvalRate = Math.round((okVotes / totalVotes) * 100);

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="preview-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-5 bg-[#0b1c30]/50 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl border border-[#dce9ff] animate-in zoom-in-95 duration-150 overflow-hidden">
                {/* Modal Header */}
                <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#e5eeff] flex items-center justify-between gap-3 sm:gap-4 bg-white">
                    <div className="min-w-0 flex-1">
                        <h2
                            id="preview-modal-title"
                            className="text-sm sm:text-base md:text-lg font-bold text-[#0b1c30] truncate"
                        >
                            {doc.title}
                        </h2>
                        <div className="text-[11px] sm:text-xs text-[#5a6a80] mt-0.5 truncate">
                            Xem trước tài liệu · {doc.size}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-[#5a6a80] hover:text-[#0b1c30] hover:bg-[#eff4ff] transition-colors cursor-pointer shrink-0"
                        aria-label="Đóng"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 bg-[#f8faff]">
                    {/* Left: Document simulated preview */}
                    <div className="md:col-span-7 flex flex-col gap-3">
                        <div className="text-xs font-semibold text-[#5a6a80] flex items-center justify-between">
                            <span>Trang 1 / 24</span>
                            <span className="text-[11px] font-mono text-[#0051d5] bg-[#eff4ff] px-2 py-0.5 rounded-md">
                                PDF Document
                            </span>
                        </div>

                        {/* Page preview sheet 1 */}
                        <div className="bg-white rounded-xl border border-[#dce9ff] p-4 sm:p-5 shadow-xs flex flex-col gap-3 min-h-[220px]">
                            {/* Academic paper mockup header */}
                            <div className="h-4 bg-[#0b1c30]/15 rounded w-3/4 animate-pulse" />
                            <div className="h-3 bg-[#5a6a80]/15 rounded w-1/2" />
                            <div className="border-b border-[#e5eeff] my-1" />
                            <div className="space-y-2">
                                <div className="h-2.5 bg-[#5a6a80]/10 rounded w-full" />
                                <div className="h-2.5 bg-[#5a6a80]/10 rounded w-11/12" />
                                <div className="h-2.5 bg-[#5a6a80]/10 rounded w-4/5" />
                                <div className="h-2.5 bg-[#5a6a80]/10 rounded w-full" />
                                <div className="h-2.5 bg-[#5a6a80]/10 rounded w-5/6" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                                <div className="h-16 bg-[#0051d5]/5 border border-[#0051d5]/15 rounded-lg flex items-center justify-center text-[10px] text-[#0051d5] font-mono">
                                    [Biểu đồ phân tích giải tích]
                                </div>
                                <div className="space-y-1.5 py-1">
                                    <div className="h-2 bg-[#5a6a80]/10 rounded w-full" />
                                    <div className="h-2 bg-[#5a6a80]/10 rounded w-4/5" />
                                    <div className="h-2 bg-[#5a6a80]/10 rounded w-3/4" />
                                </div>
                            </div>
                        </div>

                        {/* Page preview sheet 2 */}
                        <div className="bg-white rounded-xl border border-[#dce9ff] p-4 sm:p-5 shadow-xs flex flex-col gap-2.5 opacity-80">
                            <div className="h-3 bg-[#0b1c30]/10 rounded w-1/3" />
                            <div className="space-y-1.5">
                                <div className="h-2 bg-[#5a6a80]/10 rounded w-full" />
                                <div className="h-2 bg-[#5a6a80]/10 rounded w-5/6" />
                                <div className="h-2 bg-[#5a6a80]/10 rounded w-full" />
                            </div>
                        </div>
                    </div>

                    {/* Right: Metadata & Stats */}
                    <div className="md:col-span-5 flex flex-col gap-4">
                        {/* Status Badge */}
                        <div className="bg-white rounded-xl border border-[#dce9ff] p-4 shadow-xs space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-[#5a6a80] font-medium">Trạng thái</span>
                                {doc.status === 'PENDING' && (
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#fef3c7] text-[#b45309] border border-[#fde68a]">
                                        Chờ duyệt
                                    </span>
                                )}
                                {doc.status === 'FLAGGED' && (
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#fee2e2] text-[#ba1a1a] border border-[#fecaca]">
                                        Cảnh báo bản quyền
                                    </span>
                                )}
                                {doc.status === 'PUBLISHED' && (
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#ecfdf5] text-[#009668] border border-[#a7f3d0]">
                                        Đã xuất bản
                                    </span>
                                )}
                                {doc.status === 'REJECTED' && (
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#f1f5f9] text-[#64748b] border border-[#e2e8f0]">
                                        Đã gỡ bỏ
                                    </span>
                                )}
                            </div>

                            <div className="divide-y divide-[#f0f4fc] text-xs">
                                <div className="py-2 flex items-center justify-between gap-2">
                                    <span className="text-[#5a6a80]">Người đăng</span>
                                    <span className="font-semibold text-[#0b1c30]">{doc.author}</span>
                                </div>
                                <div className="py-2 flex items-center justify-between gap-2">
                                    <span className="text-[#5a6a80]">Danh hiệu</span>
                                    <span className="text-[#0051d5] font-medium">{doc.authorTitle}</span>
                                </div>
                                <div className="py-2 flex items-center justify-between gap-2">
                                    <span className="text-[#5a6a80]">Khoa & Bộ môn</span>
                                    <span className="font-medium text-[#0b1c30]">{doc.faculty}</span>
                                </div>
                                <div className="py-2 flex items-center justify-between gap-2">
                                    <span className="text-[#5a6a80]">Trường</span>
                                    <span className="font-medium text-[#0b1c30]">{doc.univ}</span>
                                </div>
                                <div className="py-2 flex items-center justify-between gap-2">
                                    <span className="text-[#5a6a80]">Báo cáo vi phạm</span>
                                    <span className={`font-bold ${doc.reports > 0 ? 'text-[#ba1a1a]' : 'text-[#0b1c30]'}`}>
                                        {doc.reports} báo cáo
                                    </span>
                                </div>
                                <div className="py-2 flex items-center justify-between gap-2">
                                    <span className="text-[#5a6a80]">Peer-review</span>
                                    <span className="font-semibold text-[#009668]">
                                        {okVotes}/{totalVotes} đồng thuận ({approvalRate}%)
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* CID IPFS Section */}
                        <div className="bg-white rounded-xl border border-[#dce9ff] p-4 shadow-xs space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-[#0b1c30]">Mã băm CID IPFS</span>
                                <button
                                    type="button"
                                    onClick={() => onCopyCid(doc.cid)}
                                    className="text-xs text-[#0051d5] hover:text-[#003da0] flex items-center gap-1 font-semibold cursor-pointer"
                                    aria-label="Sao chép toàn bộ CID"
                                >
                                    {copiedCid === doc.cid ? (
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
                            <div className="bg-[#f8faff] border border-[#e5eeff] rounded-lg p-2.5 font-mono text-[11px] text-[#0051d5] break-all leading-relaxed">
                                {doc.cid}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer / Actions */}
                <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-[#e5eeff] bg-white flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
                    <button
                        type="button"
                        onClick={() => onRequestRevision(doc)}
                        className="w-full sm:w-auto px-3.5 py-2.5 sm:py-2 rounded-xl border border-[#c3d0e6] bg-white hover:bg-[#fafcff] text-xs font-semibold text-[#0b1c30] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                        <Send size={14} className="text-[#5a6a80]" />
                        <span>Yêu cầu bổ sung</span>
                    </button>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        {doc.status !== 'REJECTED' && (
                            <button
                                type="button"
                                onClick={() => onReject(doc)}
                                className="flex-1 sm:flex-none justify-center px-3.5 py-2.5 sm:py-2 rounded-xl bg-[#fff5f4] hover:bg-[#ffebe8] border border-[#ffdad6] text-xs font-semibold text-[#ba1a1a] flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                                <Trash2 size={14} />
                                <span>Gỡ bỏ tài liệu</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => onApprove(doc)}
                            className="flex-1 sm:flex-none justify-center px-4 py-2.5 sm:py-2 rounded-xl bg-[#009668] hover:bg-[#007d56] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                            <CheckCircle2 size={14} />
                            <span>Phê duyệt tài liệu</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
