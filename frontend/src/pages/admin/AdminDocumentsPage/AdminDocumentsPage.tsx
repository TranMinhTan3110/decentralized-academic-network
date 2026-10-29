import { useState, useMemo } from 'react';
import {
    Search,
    Copy,
    Check,
    Eye,
    Trash2,
    CheckCircle2,
    FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '../../../components/admin';
import { DocumentPreviewModal } from './components/DocumentPreviewModal';
import { DocumentRejectModal } from './components/DocumentRejectModal';
import { type AdminDocument, type DocTabType } from './types';

export const initialDocuments: AdminDocument[] = [
    {
        id: 'd1',
        title: 'Đề cương Ôn thi Giải tích 3 ĐHBK',
        cid: 'bafybeic2h7g5y391a4z6p9lq2v7n8m',
        size: '14.2 MB',
        faculty: 'Toán ứng dụng',
        univ: 'ĐH Bách Khoa Hà Nội',
        author: 'Nguyễn Văn An',
        authorTitle: 'Scholar Lv.3',
        ok: 9,
        total: 10,
        status: 'PENDING',
        reads: 1240,
        likes: 86,
        reports: 0,
    },
    {
        id: 'd2',
        title: 'Slide Bài giảng Vật lý Đại cương',
        cid: 'bafybeig88ef29vlkxm109923',
        size: '6.8 MB',
        faculty: 'Vật lý kỹ thuật',
        univ: 'ĐH Khoa học Tự nhiên',
        author: 'Trần Thị Bích',
        authorTitle: 'New Scholar',
        ok: 2,
        total: 10,
        status: 'FLAGGED',
        reads: 312,
        likes: 9,
        reports: 2,
    },
    {
        id: 'd3',
        title: 'Giáo trình Kinh tế vi mô (bản scan nguyên cuốn)',
        cid: 'bafybeih4d1k77qwe5r0sz88m2cx',
        size: '48.1 MB',
        faculty: 'Kinh tế học',
        univ: 'ĐH Kinh tế Quốc dân',
        author: 'Lê Minh Quân',
        authorTitle: 'Scholar Lv.1',
        ok: 1,
        total: 10,
        status: 'FLAGGED',
        reads: 2210,
        likes: 41,
        reports: 3,
    },
    {
        id: 'd4',
        title: 'Đề thi Giữa kỳ Cấu trúc dữ liệu & Giải thuật',
        cid: 'bafybeibq3n6v2tkd09al4pw71h',
        size: '3.4 MB',
        faculty: 'Khoa học máy tính',
        univ: 'ĐH Bách Khoa Hà Nội',
        author: 'Võ Thanh Hà',
        authorTitle: 'Scholar Lv.2',
        ok: 7,
        total: 10,
        status: 'PENDING',
        reads: 180,
        likes: 14,
        reports: 0,
    },
    {
        id: 'd5',
        title: 'Ghi chú bài giảng Lập trình mạng INT1332',
        cid: 'bafybeigs72m1xf0pe4t8ku3r6z',
        size: '5.1 MB',
        faculty: 'Công nghệ thông tin',
        univ: 'Học viện Bưu chính Viễn thông',
        author: 'Phạm Gia Huy',
        authorTitle: 'Scholar Lv.4',
        ok: 10,
        total: 10,
        status: 'PUBLISHED',
        reads: 5630,
        likes: 402,
        reports: 0,
    },
    {
        id: 'd6',
        title: 'Bài tập Xác suất thống kê có lời giải',
        cid: 'bafybeiaz5c8d1y2nq7w0jh6l3v',
        size: '9.7 MB',
        faculty: 'Toán ứng dụng',
        univ: 'ĐH Kinh tế TP.HCM',
        author: 'Đặng Khánh Linh',
        authorTitle: 'Scholar Lv.3',
        ok: 10,
        total: 10,
        status: 'PUBLISHED',
        reads: 4120,
        likes: 311,
        reports: 0,
    },
    {
        id: 'd7',
        title: 'Tổng hợp lý thuyết Mạch điện tử',
        cid: 'bafybeid9t4u6o2xm8p1ec5s7kq',
        size: '11.9 MB',
        faculty: 'Điện tử viễn thông',
        univ: 'ĐH Bách Khoa Hà Nội',
        author: 'Bùi Quốc Bảo',
        authorTitle: 'Scholar Lv.2',
        ok: 9,
        total: 10,
        status: 'PUBLISHED',
        reads: 2890,
        likes: 177,
        reports: 0,
    },
    {
        id: 'd8',
        title: 'Bản scan sách Giải tích Thomas (NXB có ISBN)',
        cid: 'bafybeif0v3r9b1kh6y2zq8m4ta',
        size: '72.4 MB',
        faculty: 'Toán ứng dụng',
        univ: 'ĐH Ngoại thương',
        author: 'Hoàng Đức Minh',
        authorTitle: 'New Scholar',
        ok: 0,
        total: 10,
        status: 'REJECTED',
        reads: 96,
        likes: 2,
        reports: 4,
    },
];

const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
};

const formatShortCid = (cid: string) => {
    if (cid.length <= 20) return cid;
    return `${cid.slice(0, 14)}..${cid.slice(-4)}`;
};

export function AdminDocumentsPage() {
    const [docs, setDocs] = useState<AdminDocument[]>(initialDocuments);
    const [activeTab, setActiveTab] = useState<DocTabType>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedCid, setCopiedCid] = useState<string | null>(null);

    // Modals state
    const [previewDoc, setPreviewDoc] = useState<AdminDocument | null>(null);
    const [rejectDoc, setRejectDoc] = useState<AdminDocument | null>(null);

    // Review queue count (PENDING or FLAGGED)
    const reviewCount = useMemo(() => {
        return docs.filter((d) => d.status === 'PENDING' || d.status === 'FLAGGED').length;
    }, [docs]);

    // Filtered documents by tab & search query
    const filteredDocs = useMemo(() => {
        return docs.filter((doc) => {
            // Tab filter
            if (activeTab === 'REVIEW') {
                if (doc.status !== 'PENDING' && doc.status !== 'FLAGGED') return false;
            } else if (activeTab === 'PUBLISHED') {
                if (doc.status !== 'PUBLISHED') return false;
            } else if (activeTab === 'REJECTED') {
                if (doc.status !== 'REJECTED') return false;
            }

            // Search filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchTitle = doc.title.toLowerCase().includes(q);
                const matchCid = doc.cid.toLowerCase().includes(q);
                const matchAuthor = doc.author.toLowerCase().includes(q);
                return matchTitle || matchCid || matchAuthor;
            }

            return true;
        });
    }, [docs, activeTab, searchQuery]);

    const handleCopyCid = async (cid: string) => {
        try {
            await navigator.clipboard.writeText(cid);
            setCopiedCid(cid);
            toast.success('Đã sao chép mã CID vào clipboard!');
            setTimeout(() => setCopiedCid(null), 2000);
        } catch {
            toast.error('Không thể sao chép CID');
        }
    };

    const handleApprove = (doc: AdminDocument) => {
        setDocs((prev) =>
            prev.map((item) =>
                item.id === doc.id
                    ? { ...item, status: 'PUBLISHED', reports: 0 }
                    : item
            )
        );
        if (previewDoc?.id === doc.id) {
            setPreviewDoc((prev) => (prev ? { ...prev, status: 'PUBLISHED', reports: 0 } : null));
        }
        toast.success(`Đã phê duyệt tài liệu: ${doc.title}`);
    };

    const handleOpenReject = (doc: AdminDocument) => {
        setPreviewDoc(null);
        setRejectDoc(doc);
    };

    const handleConfirmReject = (docId: string) => {
        const target = docs.find((d) => d.id === docId);
        setDocs((prev) =>
            prev.map((item) =>
                item.id === docId ? { ...item, status: 'REJECTED' } : item
            )
        );
        setRejectDoc(null);
        toast.success(`Đã gỡ bỏ tài liệu khỏi mạng lưới: ${target?.title ?? ''}`);
    };

    const handleRequestRevision = (doc: AdminDocument) => {
        toast.info(`Đã gửi yêu cầu bổ sung tới hộp thư tác giả ${doc.author}`);
        setPreviewDoc(null);
    };

    return (
        <AdminLayout
            breadcrumb="Admin / Tài liệu"
            title="Quản lý & Kiểm duyệt tài liệu"
            subtitle="Mô hình hậu kiểm: đăng ngay, chỉ xử lý khi bị gắn cờ hoặc có báo cáo"
            pendingReviewsCount={reviewCount}
        >
            {/* Main Content Card */}
            <div className="bg-white border border-[#dce9ff] rounded-[14px] shadow-2xs overflow-hidden">
                {/* Tabs Row */}
                <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 border-b border-[#dce9ff] overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth">
                    <button
                        type="button"
                        onClick={() => setActiveTab('ALL')}
                        className={`py-3 sm:py-3.5 px-2.5 sm:px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 sm:gap-2 shrink-0 ${
                            activeTab === 'ALL'
                                ? 'text-[#0b1c30] border-[#0b1c30]'
                                : 'text-[#5a6a80] border-transparent hover:text-[#0b1c30]'
                        }`}
                    >
                        <span>Tất cả tài liệu</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('REVIEW')}
                        className={`py-3 sm:py-3.5 px-2.5 sm:px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 sm:gap-2 shrink-0 ${
                            activeTab === 'REVIEW'
                                ? 'text-[#0b1c30] border-[#0b1c30]'
                                : 'text-[#5a6a80] border-transparent hover:text-[#0b1c30]'
                        }`}
                    >
                        <span>Cần kiểm duyệt</span>
                        {reviewCount > 0 && (
                            <span className="bg-[#ba1a1a] text-white text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.2 rounded-full">
                                {reviewCount}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('PUBLISHED')}
                        className={`py-3 sm:py-3.5 px-2.5 sm:px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 sm:gap-2 shrink-0 ${
                            activeTab === 'PUBLISHED'
                                ? 'text-[#0b1c30] border-[#0b1c30]'
                                : 'text-[#5a6a80] border-transparent hover:text-[#0b1c30]'
                        }`}
                    >
                        <span>Đã công khai</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('REJECTED')}
                        className={`py-3 sm:py-3.5 px-2.5 sm:px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 sm:gap-2 shrink-0 ${
                            activeTab === 'REJECTED'
                                ? 'text-[#0b1c30] border-[#0b1c30]'
                                : 'text-[#5a6a80] border-transparent hover:text-[#0b1c30]'
                        }`}
                    >
                        <span>Đã gỡ bỏ</span>
                    </button>
                </div>

                {/* Toolbar: Search input & total count */}
                <div className="p-3 sm:p-4 border-b border-[#e5eeff] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
                    <div className="relative flex-1 max-w-full sm:max-w-md lg:max-w-lg">
                        <Search
                            size={16}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5a6a80]"
                        />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm theo tiêu đề hoặc CID..."
                            aria-label="Tìm theo tiêu đề hoặc CID"
                            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-[#c3d0e6] rounded-[9px] text-[#0b1c30] placeholder-[#5a6a80] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5] transition-all"
                        />
                    </div>
                    <div className="text-xs text-[#5a6a80] font-medium flex items-center justify-between sm:justify-end shrink-0">
                        <span className="sm:hidden text-[11px] text-[#5a6a80]">Số lượng:</span>
                        <span>{filteredDocs.length} tài liệu</span>
                    </div>
                </div>

                {/* Table Data */}
                <div className="overflow-x-auto w-full">
                    <table className="block md:table w-full text-left border-collapse md:min-w-[820px]">
                        <thead className="hidden md:table-header-group">
                            <tr className="border-b border-[#e5eeff] text-[11px] font-bold text-[#5a6a80] uppercase tracking-wider bg-[#fafcff]">
                                <th scope="col" className="py-3 px-4 sm:px-5">Tài liệu & CID</th>
                                <th scope="col" className="py-3 px-4">Khoa & Bộ môn</th>
                                <th scope="col" className="py-3 px-4">Tác giả</th>
                                <th scope="col" className="py-3 px-4">Lượt đọc / Like</th>
                                <th scope="col" className="py-3 px-4">Trạng thái</th>
                                <th scope="col" className="py-3 px-4 sm:px-5 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="block md:table-row-group p-3 sm:p-4 md:p-0 bg-[#f8faff] md:bg-white space-y-3 md:space-y-0 divide-y-0 md:divide-y md:divide-[#eef3ff] text-xs">
                            {filteredDocs.length === 0 ? (
                                <tr className="block md:table-row">
                                    <td colSpan={6} className="block md:table-cell py-12 text-center text-[#5a6a80]">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <FileText size={32} className="text-[#a2b4cf]" />
                                            <p className="font-medium">Không tìm thấy tài liệu nào phù hợp.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredDocs.map((doc) => {
                                    const isCopied = copiedCid === doc.cid;
                                    return (
                                        <tr
                                            key={doc.id}
                                            className="block md:table-row bg-white rounded-xl md:rounded-none border border-[#dce9ff] md:border-b md:border-x-0 md:border-t-0 md:border-[#eef3ff] p-4 md:py-3.5 md:px-0 shadow-2xs md:shadow-none space-y-3 md:space-y-0 hover:bg-[#fafcff] transition-colors"
                                        >
                                            {/* Tài liệu & CID */}
                                            <td className="block md:table-cell p-0 md:py-3.5 md:px-4 sm:px-5 max-w-none md:max-w-[280px]">
                                                <div className="font-bold text-[#0b1c30] text-sm md:text-xs line-clamp-2 md:line-clamp-1 leading-snug" title={doc.title}>
                                                    {doc.title}
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-1.5 md:mt-1">
                                                    <span className="font-mono text-[11px] text-[#0051d5]">
                                                        {formatShortCid(doc.cid)}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopyCid(doc.cid)}
                                                        className="text-[#5a6a80] hover:text-[#0b1c30] p-0.5 rounded transition-colors cursor-pointer shrink-0"
                                                        aria-label={`Sao chép CID của ${doc.title}`}
                                                        title="Sao chép CID"
                                                    >
                                                        {isCopied ? (
                                                            <Check size={13} className="text-[#009668]" />
                                                        ) : (
                                                            <Copy size={13} />
                                                        )}
                                                    </button>
                                                </div>
                                                <div className="text-[11px] text-[#5a6a80] mt-1 md:mt-0.5 flex items-center gap-1">
                                                    <span>{doc.size}</span>
                                                    {doc.reports > 0 && (
                                                        <span className="text-[#ba1a1a] font-semibold">
                                                            · {doc.reports} báo cáo
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Khoa & Bộ môn */}
                                            <td className="block md:table-cell p-0 md:py-3.5 md:px-4">
                                                <div className="flex items-center md:block gap-1.5 text-xs text-[#5a6a80]">
                                                    <span className="md:hidden text-[#5a6a80] font-medium text-[11px]">Đơn vị:</span>
                                                    <span className="font-semibold text-[#0b1c30]">{doc.faculty}</span>
                                                    <span className="md:hidden">·</span>
                                                    <span className="text-[11px] text-[#5a6a80] md:block md:mt-0.5">{doc.univ}</span>
                                                </div>
                                            </td>

                                            {/* Tác giả */}
                                            <td className="block md:table-cell p-0 md:py-3.5 md:px-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2.5 bg-[#f8faff] md:bg-transparent p-2 md:p-0 rounded-lg md:rounded-none border border-[#e5eeff] md:border-0">
                                                    <div className="w-8 h-8 rounded-full bg-[#dbe7fb] text-[#0051d5] flex items-center justify-center font-bold text-xs shrink-0">
                                                        {getInitials(doc.author)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-semibold text-[#0b1c30]">
                                                            {doc.author}
                                                        </div>
                                                        <div className="text-[11px] text-[#5a6a80]">
                                                            {doc.authorTitle}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Lượt đọc / Like */}
                                            <td className="block md:table-cell p-0 md:py-3.5 md:px-4 whitespace-nowrap">
                                                <div className="flex items-center md:block gap-1.5 text-xs">
                                                    <span className="md:hidden text-[#5a6a80] font-medium text-[11px]">Tương tác:</span>
                                                    <span className="font-bold text-[#0b1c30]">
                                                        {doc.reads.toLocaleString()} <span className="font-normal text-[#5a6a80] md:hidden">lượt đọc</span>
                                                    </span>
                                                    <span className="text-[11px] text-[#5a6a80] md:mt-0.5">
                                                        <span className="md:hidden">· </span>{doc.likes} like
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Trạng thái */}
                                            <td className="block md:table-cell p-0 md:py-3.5 md:px-4 whitespace-nowrap">
                                                <div className="flex items-center md:block gap-2">
                                                    <span className="md:hidden text-[#5a6a80] font-medium text-[11px]">Trạng thái:</span>
                                                    <div>
                                                        {doc.status === 'PENDING' && (
                                                            <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-[#fef3c7] text-[#b45309] border border-[#fde68a]">
                                                                Chờ duyệt
                                                            </span>
                                                        )}
                                                        {doc.status === 'FLAGGED' && (
                                                            <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-[#fee2e2] text-[#ba1a1a] border border-[#fecaca]">
                                                                Cảnh báo bản quyền
                                                            </span>
                                                        )}
                                                        {doc.status === 'PUBLISHED' && (
                                                            <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-[#ecfdf5] text-[#009668] border border-[#a7f3d0]">
                                                                Đã xuất bản
                                                            </span>
                                                        )}
                                                        {doc.status === 'REJECTED' && (
                                                            <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-[#f1f5f9] text-[#64748b] border border-[#e2e8f0]">
                                                                Đã gỡ bỏ
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Thao tác */}
                                            <td className="block md:table-cell p-0 md:py-3.5 md:px-4 sm:px-5 md:text-right whitespace-nowrap pt-3 md:pt-0 border-t border-[#f0f4fc] md:border-t-0">
                                                <div className="flex items-center justify-end gap-2 md:gap-1.5">
                                                    {/* Phê duyệt button (shown for PENDING, FLAGGED, and REJECTED) */}
                                                    {doc.status !== 'PUBLISHED' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleApprove(doc)}
                                                            className="px-3.5 md:px-2.5 py-1.5 md:py-1 text-xs font-semibold text-white bg-[#009668] hover:bg-[#007d56] rounded-[7px] flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                                                        >
                                                            <CheckCircle2 size={13} />
                                                            <span>Phê duyệt</span>
                                                        </button>
                                                    )}

                                                    {/* Preview Eye button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setPreviewDoc(doc)}
                                                        className="p-1.5 text-[#5a6a80] hover:text-[#0b1c30] bg-[#fafcff] hover:bg-[#eff4ff] border border-[#dce9ff] rounded-[7px] transition-colors cursor-pointer"
                                                        aria-label={`Xem trước tài liệu ${doc.title}`}
                                                        title="Xem trước"
                                                    >
                                                        <Eye size={15} />
                                                    </button>

                                                    {/* Reject Trash button (shown for all except REJECTED) */}
                                                    {doc.status !== 'REJECTED' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenReject(doc)}
                                                            className="p-1.5 text-[#ba1a1a] bg-[#fff5f4] hover:bg-[#ffebe8] border border-[#ffdad6] rounded-[7px] transition-colors cursor-pointer"
                                                            aria-label={`Gỡ bỏ tài liệu ${doc.title}`}
                                                            title="Gỡ bỏ"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            <DocumentPreviewModal
                isOpen={!!previewDoc}
                document={previewDoc}
                onClose={() => setPreviewDoc(null)}
                onApprove={handleApprove}
                onReject={handleOpenReject}
                onRequestRevision={handleRequestRevision}
                onCopyCid={handleCopyCid}
                copiedCid={copiedCid}
            />

            <DocumentRejectModal
                isOpen={!!rejectDoc}
                document={rejectDoc}
                onClose={() => setRejectDoc(null)}
                onConfirm={handleConfirmReject}
            />
        </AdminLayout>
    );
}
