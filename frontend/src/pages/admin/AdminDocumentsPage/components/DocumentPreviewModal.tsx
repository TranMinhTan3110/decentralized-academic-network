import React, { useEffect } from 'react';
import { X, Copy, Check, Trash2, Eye, Heart, MessageSquare, Share2 } from 'lucide-react';
import { type AdminDocument } from '../types';

export interface DocumentPreviewModalProps {
    isOpen: boolean;
    document: AdminDocument | null;
    onClose: () => void;
    onDelete: (doc: AdminDocument) => void;
    onCopyCid: (cid: string) => void;
    copiedCid: string | null;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
    isOpen,
    document: doc,
    onClose,
    onDelete,
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
                            Chi tiết bài đăng
                        </h2>
                        <div className="text-[11px] sm:text-xs text-[#5a6a80] mt-0.5 truncate">
                            {doc.title} · {doc.size}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-[#5a6a80] hover:text-[#0b1c30] hover:bg-[#eff4ff] transition-colors cursor-pointer shrink-0"
                        aria-label="Đóng hộp thoại"
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
                            {/* Mockup header */}
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
                                    [Học liệu đính kèm bài đăng]
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
                        {/* Post Information */}
                        <div className="bg-white rounded-xl border border-[#dce9ff] p-4 shadow-xs space-y-3">
                            <h3 className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider">
                                Thông tin bài đăng
                            </h3>

                            <div className="divide-y divide-[#f0f4fc] text-xs">
                                <div className="py-2 flex items-center justify-between gap-2">
                                    <span className="text-[#5a6a80]">Tác giả</span>
                                    <span className="font-semibold text-[#0b1c30]">{doc.author}</span>
                                </div>
                                <div className="py-2 flex items-center justify-between gap-2">
                                    <span className="text-[#5a6a80]">Danh hiệu</span>
                                    <span className="text-[#0051d5] font-medium">{doc.authorTitle}</span>
                                </div>
                                <div className="py-2 flex items-center justify-between gap-2">
                                    <span className="text-[#5a6a80]">Khoa / Viện</span>
                                    <span className="font-medium text-[#0b1c30]">{doc.faculty}</span>
                                </div>
                                <div className="py-2 flex items-center justify-between gap-2">
                                    <span className="text-[#5a6a80]">Trường đại học</span>
                                    <span className="font-medium text-[#0b1c30]">{doc.univ}</span>
                                </div>
                                {doc.createdAt && (
                                    <div className="py-2 flex items-center justify-between gap-2">
                                        <span className="text-[#5a6a80]">Ngày đăng</span>
                                        <span className="font-medium text-[#0b1c30]">{doc.createdAt}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Social Interaction Stats */}
                        <div className="bg-white rounded-xl border border-[#dce9ff] p-4 shadow-xs space-y-3">
                            <h3 className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider">
                                Tương tác mạng xã hội
                            </h3>
                            <div className="grid grid-cols-2 gap-2.5">
                                <div className="bg-[#f8faff] border border-[#e5eeff] rounded-lg p-2.5 flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-[#dbe7fb] text-[#0051d5] flex items-center justify-center shrink-0">
                                        <Eye size={16} />
                                    </div>
                                    <div>
                                        <div className="text-[11px] text-[#5a6a80]">Lượt đọc</div>
                                        <div className="font-bold text-[#0b1c30] text-sm">
                                            {doc.reads.toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#f8faff] border border-[#e5eeff] rounded-lg p-2.5 flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-[#ffe8ec] text-[#e11d48] flex items-center justify-center shrink-0">
                                        <Heart size={16} />
                                    </div>
                                    <div>
                                        <div className="text-[11px] text-[#5a6a80]">Thích</div>
                                        <div className="font-bold text-[#0b1c30] text-sm">
                                            {doc.likes.toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#f8faff] border border-[#e5eeff] rounded-lg p-2.5 flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center shrink-0">
                                        <MessageSquare size={16} />
                                    </div>
                                    <div>
                                        <div className="text-[11px] text-[#5a6a80]">Bình luận</div>
                                        <div className="font-bold text-[#0b1c30] text-sm">
                                            {doc.comments.toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#f8faff] border border-[#e5eeff] rounded-lg p-2.5 flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-[#ecfdf5] text-[#059669] flex items-center justify-center shrink-0">
                                        <Share2 size={16} />
                                    </div>
                                    <div>
                                        <div className="text-[11px] text-[#5a6a80]">Chia sẻ</div>
                                        <div className="font-bold text-[#0b1c30] text-sm">
                                            {doc.shares.toLocaleString()}
                                        </div>
                                    </div>
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
                <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-[#e5eeff] bg-white flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl border border-[#c3d0e6] bg-white hover:bg-[#fafcff] text-xs font-semibold text-[#0b1c30] transition-colors cursor-pointer"
                    >
                        Đóng
                    </button>

                    <button
                        type="button"
                        onClick={() => onDelete(doc)}
                        className="px-4 py-2 rounded-xl bg-[#fff5f4] hover:bg-[#ffebe8] border border-[#ffdad6] text-xs font-semibold text-[#ba1a1a] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                        <Trash2 size={14} />
                        <span>Xóa bài đăng</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
