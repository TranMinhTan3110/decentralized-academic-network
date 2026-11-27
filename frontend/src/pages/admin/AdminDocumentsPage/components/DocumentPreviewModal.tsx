import React, { useEffect, useState, useMemo } from 'react';
import {
    X,
    Copy,
    Check,
    Trash2,
    Eye,
    Heart,
    MessageSquare,
    Bookmark,
    FileText,
    FileSpreadsheet,
    Presentation,
    ExternalLink,
} from 'lucide-react';
import { type AdminDocument } from '../types';
import { DocxViewer, ExcelViewer, PptxViewer } from '../../../../components';
import { documentService } from '../../../../services/documentService';
import { resolvePreviewFormat } from '../../../../lib/previewFormat';
import type { DocumentDetail } from '../../../../types';

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
    const [detail, setDetail] = useState<DocumentDetail | null>(null);

    useEffect(() => {
        if (!doc?.id) {
            setDetail(null);
            return;
        }
        let isMounted = true;
        documentService.getDetail(doc.id)
            .then((res) => {
                if (isMounted && res) {
                    setDetail(res);
                }
            })
            .catch(() => {});
        return () => {
            isMounted = false;
        };
    }, [doc?.id]);

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

    const { format, extension: effectiveExt } = resolvePreviewFormat({
        fileExtension: detail?.fileExtension || doc.fileExtension,
        attachmentExtension: detail?.attachments?.[0]?.fileExtension,
        title: doc.title,
    });
    const effectiveTotalPages = detail?.totalPages || doc.totalPages || 1;

    const ipfsGateway =
        (typeof import.meta !== 'undefined' && import.meta.env?.VITE_IPFS_GATEWAY) ||
        'http://127.0.0.1:8080/ipfs';
    const normalizedGateway = ipfsGateway.replace('http://localhost:8080/ipfs', 'http://127.0.0.1:8080/ipfs');
    const ipfsUrl = `${normalizedGateway}/${doc.cid}`;
    const convertedPreviewUrl = documentService.getAttachmentPreviewUrl(doc.id, 0);

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
            <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[94vh] sm:max-h-[92vh] flex flex-col shadow-2xl border border-[#dce9ff] animate-in zoom-in-95 duration-150 overflow-hidden">
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
                    {/* Left: Dynamic Document Viewer matching file type */}
                    <div className="md:col-span-7 flex flex-col gap-3">
                        {/* Format Indicator & IPFS Link */}
                        <div className="flex items-center justify-between gap-2 bg-white px-3.5 py-2 rounded-xl border border-[#dce9ff] shadow-2xs">
                            <div className="flex items-center gap-2">
                                {format === 'DOCX' ? (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#eff6ff] text-[#0051d5] border border-[#bfdbfe]">
                                        <FileText size={14} className="text-[#0051d5]" />
                                        <span>Tài liệu Microsoft Word (.docx)</span>
                                    </span>
                                ) : format === 'EXCEL' ? (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#ecfdf5] text-[#009668] border border-[#a7f3d0]">
                                        <FileSpreadsheet size={14} className="text-[#009668]" />
                                        <span>Bảng tính Microsoft Excel (.xlsx)</span>
                                    </span>
                                ) : format === 'PPTX' ? (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#fff7ed] text-[#c2410c] border border-[#fed7aa]">
                                        <Presentation size={14} className="text-[#c2410c]" />
                                        <span>Bài trình chiếu Microsoft PowerPoint (.pptx)</span>
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#fff1f2] text-[#e11d48] border border-[#fecdd3]">
                                        <FileText size={14} className="text-[#e11d48]" />
                                        <span>{format === 'PDF' ? 'Tài liệu PDF (.pdf)' : 'Bản xem trước tài liệu'}</span>
                                    </span>
                                )}
                                {effectiveTotalPages > 1 && (
                                    <span className="text-xs text-[#5a6a80] font-medium hidden sm:inline">
                                        ({effectiveTotalPages} trang)
                                    </span>
                                )}
                            </div>

                            <a
                                href={ipfsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-[#0051d5] hover:text-[#003da0] flex items-center gap-1 font-semibold transition-colors shrink-0"
                                title="Mở toàn màn hình trong tab mới qua IPFS Gateway"
                            >
                                <ExternalLink size={13} />
                                <span>Mở IPFS</span>
                            </a>
                        </div>

                        {/* Document Viewer Render Area */}
                        {format === 'DOCX' ? (
                            <DocxViewer
                                documentId={doc.id}
                                ipfsCid={detail?.ipfsCid || doc.cid}
                                title={doc.title}
                                totalPages={effectiveTotalPages}
                                hasUnlocked={true}
                                isBlurLocked={false}
                                freePagesLimit={999}
                                className="h-[520px] rounded-xl overflow-hidden border border-[#dce9ff]"
                            />
                        ) : format === 'EXCEL' ? (
                            <ExcelViewer
                                documentId={doc.id}
                                ipfsCid={detail?.ipfsCid || doc.cid}
                                title={doc.title}
                                totalPages={effectiveTotalPages}
                                hasUnlocked={true}
                                isBlurLocked={false}
                                freePagesLimit={999}
                                fileExtension={effectiveExt || 'xlsx'}
                                className="h-[520px] rounded-xl overflow-hidden border border-[#dce9ff]"
                            />
                        ) : format === 'PPTX' ? (
                            <PptxViewer
                                documentId={doc.id}
                                attachmentIndex={0}
                                ipfsCid={detail?.ipfsCid || doc.cid}
                                title={doc.title}
                                hasUnlocked={true}
                                isBlurLocked={false}
                                freePagesLimit={Number.MAX_SAFE_INTEGER}
                                totalPages={effectiveTotalPages}
                                fileExtension={effectiveExt || 'pptx'}
                                className="h-[520px] rounded-xl overflow-hidden border border-[#dce9ff]"
                            />
                        ) : format === 'PDF' ? (
                            <div className="flex flex-col h-[520px] rounded-xl overflow-hidden border border-[#dce9ff] bg-slate-900 shadow-xs">
                                <div className="flex items-center justify-between px-3 py-2 bg-[#0F172A] text-xs text-white border-b border-slate-700/80">
                                    <span className="flex items-center gap-1.5 text-slate-300 font-medium min-w-0">
                                        <FileText size={14} className="text-rose-400 shrink-0" />
                                        <span className="hidden sm:inline shrink-0">Trình xem PDF:</span>
                                        <span className="text-white font-semibold truncate">{doc.title}</span>
                                        {doc.totalPages && doc.totalPages > 1 && (
                                            <span className="text-slate-400 font-normal">({doc.totalPages} trang)</span>
                                        )}
                                    </span>
                                    <a
                                        href={ipfsUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 transition-colors shrink-0 ml-2"
                                    >
                                        <ExternalLink size={12} />
                                        <span>Toàn màn hình</span>
                                    </a>
                                </div>
                                <iframe
                                    src={`${ipfsUrl}#view=FitH`}
                                    title={doc.title}
                                    className="w-full flex-1 border-0 bg-slate-800"
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col h-[520px] rounded-xl overflow-hidden border border-[#dce9ff] bg-slate-900 shadow-xs">
                                <div className="flex items-center justify-between px-3 py-2 bg-[#0F172A] text-xs text-white border-b border-slate-700/80">
                                    <span className="flex items-center gap-1.5 text-slate-300 font-medium min-w-0">
                                        <FileText size={14} className="text-amber-400 shrink-0" />
                                        <span className="hidden sm:inline shrink-0">Bản xem trước PDF:</span>
                                        <span className="text-white font-semibold truncate">{doc.title}</span>
                                    </span>
                                    <a
                                        href={convertedPreviewUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 transition-colors shrink-0 ml-2"
                                    >
                                        <ExternalLink size={12} />
                                        <span>Toàn màn hình</span>
                                    </a>
                                </div>
                                <iframe
                                    src={`${convertedPreviewUrl}#view=FitH`}
                                    title={doc.title}
                                    className="w-full flex-1 border-0 bg-slate-800"
                                />
                            </div>
                        )}
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
                                    <span className="text-[#5a6a80]">Trạng thái</span>
                                    {doc.status === 'REJECTED' ? (
                                        <span className="inline-flex items-center gap-1 font-semibold text-[11px] px-2.5 py-0.5 rounded-full bg-[#fee2e2] text-[#ba1a1a] border border-[#fecaca]">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]"></span>
                                            Đã gỡ bỏ (Vi phạm)
                                        </span>
                                    ) : doc.status === 'DELETED' ? (
                                        <span className="inline-flex items-center gap-1 font-semibold text-[11px] px-2.5 py-0.5 rounded-full bg-[#f1f5f9] text-[#475569] border border-[#cbd5e1]">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#64748b]"></span>
                                            Tác giả đã xóa
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 font-semibold text-[11px] px-2.5 py-0.5 rounded-full bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0]">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]"></span>
                                            Đang phát hành
                                        </span>
                                    )}
                                </div>
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
                                            {doc.reads.toLocaleString('en-US')}
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
                                            {doc.likes.toLocaleString('en-US')}
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
                                            {doc.comments.toLocaleString('en-US')}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#f8faff] border border-[#e5eeff] rounded-lg p-2.5 flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-[#ecfdf5] text-[#059669] flex items-center justify-center shrink-0">
                                        <Bookmark size={16} />
                                    </div>
                                    <div>
                                        <div className="text-[11px] text-[#5a6a80]">Lượt lưu</div>
                                        <div className="font-bold text-[#0b1c30] text-sm">
                                            {doc.bookmarks.toLocaleString('en-US')}
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
