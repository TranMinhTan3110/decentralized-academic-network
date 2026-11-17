import React, { useEffect, useState, useMemo } from 'react';
import {
    X,
    Copy,
    Check,
    Gavel,
    FileText,
    FileSpreadsheet,
    ExternalLink,
} from 'lucide-react';
import { type ReportItem } from '../types';
import { DocxViewer, ExcelViewer } from '../../../../components';
import { documentService } from '../../../../services/documentService';
import type { DocumentDetail } from '../../../../types';

export interface ReportDocPreviewModalProps {
    isOpen: boolean;
    report: ReportItem | null;
    onClose: () => void;
    onConfirmViolation: (report: ReportItem) => void;
}

type PreviewFormat = 'PDF' | 'DOCX' | 'EXCEL';

function detectFormat(title: string, extOverride?: string): PreviewFormat {
    const ext = (extOverride || '').toLowerCase().replace('.', '');
    if (ext === 'docx' || ext === 'doc') return 'DOCX';
    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') return 'EXCEL';
    if (ext === 'pdf') return 'PDF';

    const lower = title.toLowerCase();
    if (lower.endsWith('.docx') || lower.endsWith('.doc') || lower.includes('word') || lower.includes('tập dữ liệu') || lower.includes('c1')) return 'DOCX';
    if (lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.endsWith('.csv') || lower.includes('excel') || lower.includes('bảng tính')) return 'EXCEL';
    return 'PDF';
}

export const ReportDocPreviewModal: React.FC<ReportDocPreviewModalProps> = ({
    isOpen,
    report,
    onClose,
    onConfirmViolation,
}) => {
    const [copied, setCopied] = useState(false);
    const [detail, setDetail] = useState<DocumentDetail | null>(null);

    useEffect(() => {
        const docId = report?.docId || report?.id;
        if (!docId) {
            setDetail(null);
            return;
        }
        let isMounted = true;
        documentService.getDetail(docId)
            .then((res) => {
                if (isMounted && res) {
                    setDetail(res);
                }
            })
            .catch(() => {});
        return () => {
            isMounted = false;
        };
    }, [report?.docId, report?.id]);

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

    const effectiveExt = (
        detail?.fileExtension ||
        detail?.attachments?.[0]?.fileExtension ||
        ''
    ).toLowerCase().replace('.', '');

    const effectiveTotalPages = detail?.totalPages || 1;
    const format = detectFormat(report.docTitle || '', effectiveExt);

    const ipfsGateway =
        (typeof import.meta !== 'undefined' && import.meta.env?.VITE_IPFS_GATEWAY) ||
        'http://127.0.0.1:8080/ipfs';
    const normalizedGateway = ipfsGateway.replace('http://localhost:8080/ipfs', 'http://127.0.0.1:8080/ipfs');
    const ipfsUrl = `${normalizedGateway}/${report.cid}`;

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
            <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[94vh] sm:max-h-[92vh] flex flex-col shadow-2xl border border-[#dce9ff] animate-in zoom-in-95 duration-150 overflow-hidden">
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
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 bg-[#f8faff]">
                    {/* Left: Dynamic Document Viewer */}
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
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#fff1f2] text-[#ba1a1a] border border-[#fecdd3]">
                                        <FileText size={14} className="text-[#ba1a1a]" />
                                        <span>Tài liệu PDF (.pdf)</span>
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
                                documentId={report.docId || report.id}
                                ipfsCid={detail?.ipfsCid || report.cid}
                                title={report.docTitle}
                                totalPages={effectiveTotalPages}
                                hasUnlocked={true}
                                isBlurLocked={false}
                                freePagesLimit={999}
                                className="h-[520px] rounded-xl overflow-hidden border border-[#dce9ff]"
                            />
                        ) : format === 'EXCEL' ? (
                            <ExcelViewer
                                documentId={report.docId || report.id}
                                ipfsCid={detail?.ipfsCid || report.cid}
                                title={report.docTitle}
                                totalPages={effectiveTotalPages}
                                hasUnlocked={true}
                                isBlurLocked={false}
                                freePagesLimit={999}
                                fileExtension={effectiveExt || 'xlsx'}
                                className="h-[520px] rounded-xl overflow-hidden border border-[#dce9ff]"
                            />
                        ) : (
                            <div className="flex flex-col h-[520px] rounded-xl overflow-hidden border border-[#dce9ff] bg-slate-900 shadow-xs">
                                <div className="flex items-center justify-between px-3 py-2 bg-[#0F172A] text-xs text-white border-b border-slate-700/80">
                                    <span className="flex items-center gap-1.5 text-slate-300 font-medium min-w-0">
                                        <FileText size={14} className="text-rose-400 shrink-0" />
                                        <span className="hidden sm:inline shrink-0">Trình xem PDF:</span>
                                        <span className="text-white font-semibold truncate">{report.docTitle}</span>
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
                                    title={report.docTitle}
                                    className="w-full flex-1 border-0 bg-slate-800"
                                />
                            </div>
                        )}
                    </div>

                    {/* Right: Metadata & Stats */}
                    <div className="md:col-span-5 flex flex-col gap-4">
                        {/* Report & Violation Note Box */}
                        <div className="bg-[#fff5f4] rounded-xl border border-[#ffdad6] p-4 shadow-xs space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fee2e2] text-[#ba1a1a] border border-[#fecaca] uppercase">
                                    {report.reason}
                                </span>
                                <span className="text-[11px] text-[#ba1a1a] font-medium">Báo cáo vi phạm</span>
                            </div>
                            <p className="text-xs text-[#0b1c30] leading-relaxed font-medium">
                                "{report.note}"
                            </p>
                            <div className="text-[11px] text-[#5a6a80] pt-1 border-t border-[#ffdad6]/60 flex items-center justify-between">
                                <span>Người báo cáo: <strong className="text-[#0b1c30]">{report.reporter}</strong></span>
                                <span>{report.when}</span>
                            </div>
                        </div>

                        {/* Document Information */}
                        <div className="bg-white rounded-xl border border-[#dce9ff] p-4 shadow-xs space-y-3">
                            <h3 className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider">
                                Thông tin tài liệu
                            </h3>

                            <div className="divide-y divide-[#f0f4fc] text-xs">
                                <div className="py-2 flex items-center justify-between">
                                    <span className="text-[#5a6a80]">Tác giả</span>
                                    <span className="font-semibold text-[#0b1c30]">{report.author}</span>
                                </div>
                                <div className="py-2 flex items-center justify-between">
                                    <span className="text-[#5a6a80]">Danh hiệu</span>
                                    <span className="text-[#0051d5] font-medium">{report.authorTitle}</span>
                                </div>
                                <div className="py-2 flex items-center justify-between">
                                    <span className="text-[#5a6a80]">Khoa / Viện</span>
                                    <span className="font-medium text-[#0b1c30]">{report.faculty}</span>
                                </div>
                                <div className="py-2 flex items-center justify-between">
                                    <span className="text-[#5a6a80]">Trường đại học</span>
                                    <span className="font-medium text-[#0b1c30]">{report.univ}</span>
                                </div>
                                <div className="py-2 flex items-center justify-between">
                                    <span className="text-[#5a6a80]">Dung lượng</span>
                                    <span className="font-mono text-[#0b1c30]">{report.size}</span>
                                </div>
                            </div>
                        </div>

                        {/* CID IPFS Section */}
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
                    </div>
                </div>

                {/* Modal Footer / Actions */}
                <div className="px-6 py-4 border-t border-[#e5eeff] bg-white flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl border border-[#c3d0e6] bg-white hover:bg-[#fafcff] text-xs font-semibold text-[#0b1c30] transition-colors cursor-pointer"
                    >
                        Đóng
                    </button>

                    <button
                        type="button"
                        onClick={() => onConfirmViolation(report)}
                        className="px-4 py-2 rounded-xl bg-[#ba1a1a] hover:bg-[#9a1414] text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                        <Gavel size={14} />
                        <span>Xác nhận vi phạm & Gỡ bài</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
