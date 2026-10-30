import React, { useEffect, useState } from 'react';
import { X, Copy, Check, Gavel } from 'lucide-react';
import { type ReportItem } from '../types';

export interface ReportDocPreviewModalProps {
    isOpen: boolean;
    report: ReportItem | null;
    onClose: () => void;
    onConfirmViolation: (report: ReportItem) => void;
}

export const ReportDocPreviewModal: React.FC<ReportDocPreviewModalProps> = ({
    isOpen,
    report,
    onClose,
    onConfirmViolation,
}) => {
    const [copied, setCopied] = useState(false);

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

    if (!isOpen || !report) return null;

    const handleCopyCid = async () => {
        if (!report.cid) return;
        try {
            await navigator.clipboard.writeText(report.cid);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // ignore
        }
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-preview-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#0b1c30]/50 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#dce9ff] animate-in zoom-in-95 duration-150 overflow-hidden">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-[#e5eeff] flex items-center justify-between gap-4 bg-white">
                    <div className="min-w-0">
                        <h2
                            id="report-preview-modal-title"
                            className="text-base sm:text-lg font-bold text-[#0b1c30] truncate"
                        >
                            {report.docTitle}
                        </h2>
                        <div className="text-xs text-[#5a6a80] mt-0.5">
                            Xem trước tài liệu bị báo cáo · {report.size || 'Tài liệu IPFS'}
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
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6 bg-[#f8faff]">
                    {/* Left: Document simulated preview */}
                    <div className="md:col-span-7 flex flex-col gap-3">
                        <div className="text-xs font-semibold text-[#5a6a80] flex items-center justify-between">
                            <span>Trang 1 / 24</span>
                            <span className="text-[11px] font-mono text-[#ba1a1a] bg-[#fee2e2] px-2 py-0.5 rounded-md">
                                Đang có báo cáo vi phạm
                            </span>
                        </div>

                        {/* Page preview sheet 1 */}
                        <div className="bg-white rounded-xl border border-[#dce9ff] p-5 shadow-xs flex flex-col gap-3 min-h-[260px] text-[#0b1c30]">
                            {/* Academic Document Header */}
                            <div className="border-b border-[#e5eeff] pb-3">
                                <span className="text-[10px] font-mono text-[#0051d5] uppercase font-bold tracking-wider">
                                    TÀI LIỆU HỌC THUẬT PHÂN TÁN · DEDOCU IPFS NETWORK
                                </span>
                                <h3 className="text-sm font-bold mt-1 text-[#0b1c30] leading-snug">
                                    {report.docTitle}
                                </h3>
                                <div className="text-[11px] text-[#5a6a80] mt-0.5">
                                    Tác giả: {report.author} · {report.faculty}
                                </div>
                            </div>

                            {/* Simulated Paper Content / Excerpt */}
                            <div className="space-y-2 text-xs text-[#334155] leading-relaxed">
                                <div className="font-semibold text-[#0b1c30] text-[11px]">
                                    PHẦN 1: MỞ ĐẦU VÀ NỘI DUNG TỔNG QUAN
                                </div>
                                <p className="text-[11px] text-[#475569] leading-normal">
                                    Tài liệu này bao gồm toàn bộ nội dung lý thuyết trọng tâm, các ví dụ minh họa và hệ thống câu hỏi bài tập phục vụ quá trình học tập và nghiên cứu chuyên sâu.
                                </p>
                                <div className="bg-[#f8faff] border border-[#e2e8f0] rounded-lg p-3 text-[11px] space-y-1">
                                    <div className="font-mono text-[#0051d5] text-[10px] font-semibold">
                                        § Trích đoạn nội dung kiểm duyệt:
                                    </div>
                                    <p className="italic text-[#64748b]">
                                        "{report.note}"
                                    </p>
                                </div>
                            </div>

                            {/* Document Watermark footer */}
                            <div className="mt-auto pt-2 border-t border-[#f1f5f9] flex items-center justify-between text-[10px] text-[#94a3b8]">
                                <span>Lưu trữ phi tập trung trên cụm Node IPFS</span>
                                <span>Trang 1</span>
                            </div>
                        </div>

                        {/* Page preview sheet 2 (Thumbnail preview) */}
                        <div className="bg-white rounded-xl border border-[#dce9ff] p-4 shadow-xs flex flex-col gap-2 text-[#64748b] text-[11px]">
                            <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-1.5 text-[10px] text-[#94a3b8]">
                                <span>Trang 2: Sơ đồ & Dữ liệu chi tiết</span>
                                <span>Trang 2</span>
                            </div>
                            <div className="h-14 bg-[#f8faff] border border-dashed border-[#cbd5e1] rounded-lg flex items-center justify-center text-[10px] text-[#64748b]">
                                [ Sơ đồ đồ thị minh họa & Phân tích thuật toán ]
                            </div>
                        </div>
                    </div>

                    {/* Right: Metadata & Stats */}
                    <div className="md:col-span-5 flex flex-col gap-4">
                        <div className="bg-white rounded-xl border border-[#dce9ff] p-4 shadow-xs space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-[#5a6a80] font-medium">Báo cáo vi phạm</span>
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#fee2e2] text-[#ba1a1a] border border-[#fecaca]">
                                    {report.reason}
                                </span>
                            </div>

                            <div className="divide-y divide-[#f0f4fc] text-xs">
                                <div className="py-2 flex items-center justify-between gap-2">
                                    <span className="text-[#5a6a80]">Người đăng</span>
                                    <span className="font-semibold text-[#0b1c30]">{report.author}</span>
                                </div>
                                <div className="py-2 flex items-center justify-between gap-2">
                                    <span className="text-[#5a6a80]">Danh hiệu</span>
                                    <span className="text-[#0051d5] font-medium">{report.authorTitle || 'Scholar'}</span>
                                </div>
                                <div className="py-2 flex items-center justify-between gap-2">
                                    <span className="text-[#5a6a80]">Khoa & Bộ môn</span>
                                    <span className="font-medium text-[#0b1c30]">{report.faculty || 'Khoa học cơ bản'}</span>
                                </div>
                                <div className="py-2 flex items-center justify-between gap-2">
                                    <span className="text-[#5a6a80]">Trường</span>
                                    <span className="font-medium text-[#0b1c30]">{report.univ || 'Đại học đối tác'}</span>
                                </div>
                                <div className="py-2 flex items-center justify-between gap-2">
                                    <span className="text-[#5a6a80]">Người báo cáo</span>
                                    <span className="font-semibold text-[#ba1a1a]">{report.reporter}</span>
                                </div>
                            </div>
                        </div>

                        {/* Report Note */}
                        <div className="bg-[#fff5f4] border border-[#ffdad6] rounded-xl p-4 text-xs space-y-1.5">
                            <span className="font-semibold text-[#ba1a1a]">Nội dung khiếu nại / báo cáo:</span>
                            <p className="text-[#0b1c30] italic leading-relaxed">"{report.note}"</p>
                        </div>

                        {/* CID IPFS Section */}
                        {report.cid && (
                            <div className="bg-white rounded-xl border border-[#dce9ff] p-4 shadow-xs space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-[#0b1c30]">Mã băm CID IPFS</span>
                                    <button
                                        type="button"
                                        onClick={handleCopyCid}
                                        className="text-xs text-[#0051d5] hover:text-[#003da0] flex items-center gap-1 font-semibold cursor-pointer"
                                        aria-label="Sao chép toàn bộ CID"
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
                                <div className="bg-[#f8faff] border border-[#e5eeff] rounded-lg p-2.5 font-mono text-[11px] text-[#0051d5] break-all leading-relaxed">
                                    {report.cid}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-[#e5eeff] bg-white flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl border border-[#c3d0e6] bg-white hover:bg-[#fafcff] text-xs font-semibold text-[#0b1c30] transition-colors cursor-pointer"
                    >
                        Đóng
                    </button>
                    {report.status === 'OPEN' && (
                        <button
                            type="button"
                            onClick={() => onConfirmViolation(report)}
                            className="px-4 py-2 rounded-xl bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                            <Gavel size={14} />
                            <span>Xác nhận vi phạm & Gỡ bỏ</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
