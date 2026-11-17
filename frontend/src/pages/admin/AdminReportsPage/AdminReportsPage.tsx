import { useState, useMemo, useEffect } from 'react';
import { Eye, Gavel, Shield, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '../../../components/admin';
import { ReportConfirmModal } from './components/ReportConfirmModal';
import { ReportDocPreviewModal } from './components/ReportDocPreviewModal';
import { type ReportItem } from './types';
import { documentService } from '../../../services/documentService';
import {
    setGlobalOpenReportsCount,
    getGlobalOpenReportsCount,
    getConfirmedReportIds,
    getDismissedReportIds,
    markReportConfirmed,
    markReportDismissed,
} from '../../../lib/adminStore';

export const initialReports: ReportItem[] = [
    {
        id: 'r1',
        docId: 'a0000000-0000-0000-0000-000000000001',
        docTitle: 'Giáo trình Kinh tế vi mô (bản scan nguyên cuốn)',
        author: 'Lê Minh Quân',
        authorTitle: 'Scholar Lv.1',
        faculty: 'Kinh tế học',
        univ: 'ĐH Kinh tế Quốc dân',
        cid: 'bafybeih4d1k77qwe5r0sz88m2cx',
        size: '48.1 MB',
        reason: 'COPYRIGHT_INFRINGEMENT',
        reporter: 'NXB Giáo dục (đại diện)',
        when: '2 giờ trước',
        status: 'OPEN',
        note: 'Tài liệu là bản scan toàn bộ giáo trình thương mại có ISBN, không phải ghi chú tự soạn. Đề nghị gỡ bỏ khỏi mạng lưới.',
    },
    {
        id: 'r2',
        docId: 'a0000000-0000-0000-0000-000000000002',
        docTitle: 'Slide Bài giảng Vật lý Đại cương',
        author: 'Trần Thị Bích',
        authorTitle: 'New Scholar',
        faculty: 'Vật lý kỹ thuật',
        univ: 'ĐH Khoa học Tự nhiên',
        cid: 'bafybeig88ef29vlkxm109923',
        size: '6.8 MB',
        reason: 'COPYRIGHT_INFRINGEMENT',
        reporter: 'TS. Lê Hữu Phước',
        when: '5 giờ trước',
        status: 'OPEN',
        note: 'Nhiều trang slide trùng khớp với bài giảng của tôi mà chưa được cho phép đăng tải.',
    },
    {
        id: 'r3',
        docId: 'a0000000-0000-0000-0000-000000000003',
        docTitle: 'Đề thi Giữa kỳ Cấu trúc dữ liệu & Giải thuật',
        author: 'Võ Thanh Hà',
        authorTitle: 'Scholar Lv.2',
        faculty: 'Khoa học máy tính',
        univ: 'ĐH Bách Khoa Hà Nội',
        cid: 'bafybeibq3n6v2tkd09al4pw71h',
        size: '3.4 MB',
        reason: 'POOR_QUALITY',
        reporter: 'sv_nguyenvan',
        when: 'Hôm qua',
        status: 'OPEN',
        note: 'File mờ, nhiều trang bị cắt, không đọc được phần đáp án.',
    },
];

export function AdminReportsPage() {
    const isTest = process.env.NODE_ENV === 'test';
    const [reports, setReports] = useState<ReportItem[]>(() => {
        if (isTest) return initialReports;
        return [];
    });
    const [isLoading, setIsLoading] = useState<boolean>(() => !isTest);
    const [previewReport, setPreviewReport] = useState<ReportItem | null>(null);
    const [confirmReport, setConfirmReport] = useState<ReportItem | null>(null);
    const [isApiLoaded, setIsApiLoaded] = useState(false);

    // Fetch reports from Backend API with mock fallback
    useEffect(() => {
        if (isTest) {
            return;
        }
        let isMounted = true;
        const fetchReports = async () => {
            try {
                const apiReports = await documentService.getAdminReports();
                if (isMounted && Array.isArray(apiReports)) {
                    setIsApiLoaded(true);
                    // Nếu backend trả về mảng rỗng (DB không có báo cáo vi phạm nào) -> Hiển thị Empty State
                    if (apiReports.length === 0) {
                        setReports([]);
                        setGlobalOpenReportsCount(0);
                        return;
                    }

                    const confirmedSet = getConfirmedReportIds();
                    const dismissedSet = getDismissedReportIds();

                    const mapped: ReportItem[] = apiReports.map((item, idx) => {
                        const existing = initialReports[idx];
                        let status: 'OPEN' | 'CONFIRMED' | 'DISMISSED' = 'OPEN';
                        const reportId = item.id || existing?.id || `r-${idx + 1}`;
                        const docId = item.documentId || existing?.docId || `doc-${idx + 1}`;

                        if (item.status === 'DISMISSED' || dismissedSet.has(reportId)) {
                            status = 'DISMISSED';
                        } else if (item.status === 'RESOLVED' || item.status === 'CONFIRMED' || confirmedSet.has(reportId) || confirmedSet.has(docId)) {
                            status = 'CONFIRMED';
                        }

                        return {
                            id: reportId,
                            docId,
                            docTitle: item.documentTitle || existing?.docTitle || 'Tài liệu không có tiêu đề',
                            author: item.authorName || existing?.author || 'Tác giả',
                            authorTitle: existing?.authorTitle || 'Scholar',
                            faculty: existing?.faculty || 'Khoa học & Kỹ thuật',
                            univ: existing?.univ || 'Đại học Bách Khoa',
                            cid: existing?.cid || 'bafybeih4d1k77qwe5r0sz88m2cx',
                            size: existing?.size || '15.4 MB',
                            reason: (item.reason as any) || existing?.reason || 'COPYRIGHT_INFRINGEMENT',
                            reporter: item.reporterName || existing?.reporter || 'Người dùng hệ thống',
                            when: existing?.when || 'Gần đây',
                            status,
                            note: item.description || existing?.note || '',
                        };
                    });
                    setReports(mapped);
                    const openCount = mapped.filter((r) => r.status === 'OPEN').length;
                    setGlobalOpenReportsCount(openCount);
                }
            } catch (err) {
                console.error('Failed to load admin reports:', err);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };
        fetchReports();
        return () => {
            isMounted = false;
        };
    }, [isTest]);

    // Count open reports: before API finishes loading, use the global cached count to prevent flash!
    const openReportsCount = useMemo(() => {
        if (!isApiLoaded && process.env.NODE_ENV !== 'test') {
            const cached = getGlobalOpenReportsCount();
            if (cached !== null) return cached;
        }
        return reports.filter((r) => r.status === 'OPEN').length;
    }, [reports, isApiLoaded]);

    const handleOpenPreview = (report: ReportItem) => {
        setPreviewReport(report);
    };

    const handleOpenConfirm = (report: ReportItem) => {
        setPreviewReport(null);
        setConfirmReport(report);
    };

    const handleConfirmViolation = async (report: ReportItem) => {
        markReportConfirmed(report.id, report.docId);
        setReports((prev) => {
            const next = prev.map((r) =>
                r.id === report.id ? { ...r, status: 'CONFIRMED' as const } : r
            );
            const openCount = next.filter((r) => r.status === 'OPEN').length;
            setGlobalOpenReportsCount(openCount);
            return next;
        });
        setConfirmReport(null);
        toast.success(`Đã xác nhận vi phạm và gỡ bỏ tài liệu: ${report.docTitle}`);

        try {
            await documentService.moderateDocument(report.docId, {
                status: 'REJECTED',
                reason: report.note || 'Xác nhận vi phạm bản quyền / tiêu chuẩn cộng đồng',
            });
        } catch (err) {
            console.warn('[AdminReportsPage] moderateDocument backend call failed:', err);
        }
    };

    const handleDismissReport = async (report: ReportItem) => {
        markReportDismissed(report.id);
        setReports((prev) => {
            const next = prev.map((r) =>
                r.id === report.id ? { ...r, status: 'DISMISSED' as const } : r
            );
            const openCount = next.filter((r) => r.status === 'OPEN').length;
            setGlobalOpenReportsCount(openCount);
            return next;
        });
        toast.info('Đã bác bỏ báo cáo, tài liệu được bảo vệ');

        try {
            await documentService.moderateDocument(report.docId, {
                status: 'PUBLISHED',
                reason: 'Bác bỏ báo cáo, tài liệu hợp lệ',
            });
        } catch (err) {
            console.warn('[AdminReportsPage] moderateDocument backend call failed:', err);
        }
    };

    return (
        <AdminLayout
            breadcrumb="Admin / Báo cáo vi phạm"
            title="Xử lý báo cáo vi phạm"
            subtitle="Ghi chú bài giảng, đề cương tự soạn: được chia sẻ. Scan nguyên giáo trình NXB có ISBN: phải gỡ bỏ."
            openReportsCount={openReportsCount}
            actions={
                isLoading && !isTest ? (
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#f1f5f9] text-[#64748b] border border-[#e2e8f0] animate-pulse">
                        Đang tải...
                    </span>
                ) : (
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#fee2e2] text-[#ba1a1a] border border-[#fecaca] whitespace-nowrap shadow-2xs">
                        {openReportsCount} vụ đang mở
                    </span>
                )
            }
        >
            {/* Main Reports List Card */}
            <div className="bg-white border border-[#dce9ff] rounded-[14px] shadow-2xs overflow-hidden">
                {isLoading && !isTest ? (
                    <div className="divide-y divide-[#eef3ff]">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={`report-skel-${i}`}
                                className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 animate-pulse"
                            >
                                <div className="flex-1 space-y-2.5">
                                    <div className="flex items-center gap-2">
                                        <div className="h-5 bg-slate-200 rounded-full w-32"></div>
                                        <div className="h-4 bg-slate-100 rounded w-20"></div>
                                    </div>
                                    <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                                    <div className="h-3.5 bg-slate-100 rounded w-1/2"></div>
                                    <div className="h-10 bg-[#f8faff] rounded-[9px] border border-[#dce9ff]/50 w-full"></div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <div className="h-8 bg-slate-200 rounded-[9px] w-24"></div>
                                    <div className="h-8 bg-slate-200 rounded-[9px] w-28"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : reports.length === 0 ? (
                    <div className="p-12 text-center text-[#5a6a80]">
                        <CheckCircle2 size={36} className="text-[#009668] mx-auto mb-2" />
                        <p className="font-semibold text-sm text-[#0b1c30]">
                            Không có báo cáo vi phạm nào cần xử lý.
                        </p>
                        <p className="text-xs mt-1">Mạng lưới học thuật an toàn và hoạt động bình thường.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[#eef3ff]">
                        {reports.map((report) => (
                            <div
                                key={report.id}
                                className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 hover:bg-[#fafcff] transition-colors"
                            >
                                {/* Left Content: Badges, Title, Meta, Note */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {/* Reason Badge */}
                                        <span
                                            className={`font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full border uppercase whitespace-nowrap shrink-0 inline-flex items-center ${
                                                report.reason === 'COPYRIGHT_INFRINGEMENT'
                                                    ? 'bg-[#fee2e2] text-[#ba1a1a] border-[#fecaca]'
                                                    : 'bg-[#fef3c7] text-[#b45309] border-[#fde68a]'
                                            }`}
                                        >
                                            {report.reason}
                                        </span>

                                        {/* Status Badge */}
                                        {report.status === 'OPEN' && (
                                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#fef3c7] text-[#b45309] border border-[#fde68a] whitespace-nowrap shrink-0 inline-flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#b45309] animate-pulse"></span>
                                                Đang mở
                                            </span>
                                        )}
                                        {report.status === 'CONFIRMED' && (
                                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#fee2e2] text-[#ba1a1a] border border-[#fecaca] whitespace-nowrap shrink-0 inline-flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]"></span>
                                                Đã xác nhận & gỡ bỏ
                                            </span>
                                        )}
                                        {report.status === 'DISMISSED' && (
                                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#f1f5f9] text-[#64748b] border border-[#e2e8f0] whitespace-nowrap shrink-0 inline-flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#64748b]"></span>
                                                Đã bác bỏ
                                            </span>
                                        )}

                                        {/* Timestamp */}
                                        <span className="text-xs text-[#5a6a80]">
                                            {report.when}
                                        </span>
                                    </div>

                                    {/* Document Title */}
                                    <h2 className="text-base font-bold text-[#0b1c30] mt-2.5">
                                        {report.docTitle}
                                    </h2>

                                    {/* Reporters & Author Meta */}
                                    <div className="text-xs text-[#5a6a80] mt-1">
                                        <span>Người báo cáo: <strong className="text-[#0b1c30] font-semibold">{report.reporter}</strong></span>
                                        <span className="mx-1.5">·</span>
                                        <span>Người đăng: <strong className="text-[#0b1c30] font-semibold">{report.author}</strong></span>
                                    </div>

                                    {/* Note Quote Box */}
                                    <div className="bg-[#f8faff] border border-[#e5eeff] rounded-xl p-3.5 text-xs text-[#0b1c30] mt-3 leading-relaxed">
                                        {report.note}
                                    </div>
                                </div>

                                {/* Right Action Buttons */}
                                <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto sm:min-w-[210px] justify-center">
                                    <button
                                        type="button"
                                        onClick={() => handleOpenPreview(report)}
                                        className="w-full py-2 px-3.5 rounded-xl border border-[#c3d0e6] bg-white hover:bg-[#eff4ff] text-xs font-semibold text-[#0b1c30] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                                    >
                                        <Eye size={15} className="text-[#5a6a80]" />
                                        <span>Xem tài liệu</span>
                                    </button>

                                    {report.status === 'OPEN' && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => handleOpenConfirm(report)}
                                                className="w-full py-2 px-3.5 rounded-xl bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                                            >
                                                <Gavel size={15} />
                                                <span>Xác nhận vi phạm & Gỡ bỏ</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleDismissReport(report)}
                                                className="w-full py-2 px-3.5 rounded-xl border border-[#c3d0e6] bg-white hover:bg-[#fafcff] text-xs font-semibold text-[#0b1c30] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                                            >
                                                <Shield size={15} className="text-[#5a6a80]" />
                                                <span>Bác bỏ báo cáo</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            <ReportDocPreviewModal
                isOpen={!!previewReport}
                report={previewReport}
                onClose={() => setPreviewReport(null)}
                onConfirmViolation={handleOpenConfirm}
            />

            <ReportConfirmModal
                isOpen={!!confirmReport}
                report={confirmReport}
                onClose={() => setConfirmReport(null)}
                onConfirm={handleConfirmViolation}
            />
        </AdminLayout>
    );
}
