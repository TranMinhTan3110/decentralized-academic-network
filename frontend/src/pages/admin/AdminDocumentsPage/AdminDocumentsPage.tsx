import { useState, useMemo } from 'react';
import {
    Search,
    Copy,
    Check,
    Eye,
    Trash2,
    FileText,
    BookOpen,
    Heart,
    MessageSquare,
    Share2,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { toast } from 'sonner';
import { AdminLayout } from '../../../components/admin';
import { DocumentPreviewModal } from './components/DocumentPreviewModal';
import { type AdminDocument } from './types';

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
        reads: 1240,
        likes: 86,
        comments: 18,
        shares: 24,
        createdAt: '2026-10-28',
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
        reads: 312,
        likes: 9,
        comments: 4,
        shares: 2,
        createdAt: '2026-10-27',
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
        reads: 2210,
        likes: 41,
        comments: 12,
        shares: 15,
        createdAt: '2026-10-25',
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
        reads: 180,
        likes: 14,
        comments: 3,
        shares: 5,
        createdAt: '2026-10-24',
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
        reads: 5630,
        likes: 402,
        comments: 88,
        shares: 112,
        createdAt: '2026-10-20',
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
        reads: 4120,
        likes: 311,
        comments: 56,
        shares: 79,
        createdAt: '2026-10-18',
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
        reads: 2890,
        likes: 177,
        comments: 29,
        shares: 43,
        createdAt: '2026-10-15',
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
        reads: 850,
        likes: 35,
        comments: 7,
        shares: 9,
        createdAt: '2026-10-12',
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
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedCid, setCopiedCid] = useState<string | null>(null);

    // Modal state for previewing post details
    const [previewDoc, setPreviewDoc] = useState<AdminDocument | null>(null);

    // Filtered documents by search query
    const filteredDocs = useMemo(() => {
        if (!searchQuery.trim()) {
            return docs;
        }
        const q = searchQuery.toLowerCase().trim();
        return docs.filter((doc) => {
            const matchTitle = doc.title.toLowerCase().includes(q);
            const matchCid = doc.cid.toLowerCase().includes(q);
            const matchAuthor = doc.author.toLowerCase().includes(q);
            const matchFaculty = doc.faculty.toLowerCase().includes(q);
            const matchUniv = doc.univ.toLowerCase().includes(q);
            return matchTitle || matchCid || matchAuthor || matchFaculty || matchUniv;
        });
    }, [docs, searchQuery]);

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

    const handleDelete = (doc: AdminDocument) => {
        Swal.fire({
            title: 'Xóa bài đăng?',
            text: `Bạn có chắc chắn muốn xóa bài đăng "${doc.title}" khỏi hệ thống? Thao tác này không thể hoàn tác.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ba1a1a',
            cancelButtonColor: '#5a6a80',
            confirmButtonText: 'Xác nhận xóa',
            cancelButtonText: 'Hủy bỏ',
            reverseButtons: true,
        }).then((result) => {
            if (result.isConfirmed) {
                setDocs((prev) => prev.filter((item) => item.id !== doc.id));
                if (previewDoc?.id === doc.id) {
                    setPreviewDoc(null);
                }
                toast.success(`Đã xóa bài đăng: ${doc.title}`);
            }
        });
    };

    return (
        <AdminLayout
            breadcrumb="Admin / Quản lý bài đăng"
            title="Quản lý bài đăng"
            subtitle="Danh sách bài đăng và tương tác học thuật trên mạng xã hội chia sẻ phi tập trung"
        >
            {/* Main Content Card */}
            <div className="bg-white border border-[#dce9ff] rounded-[14px] shadow-2xs overflow-hidden">
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
                            placeholder="Tìm theo tiêu đề bài đăng, tác giả hoặc CID..."
                            aria-label="Tìm theo tiêu đề bài đăng, tác giả hoặc CID"
                            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-[#c3d0e6] rounded-[9px] text-[#0b1c30] placeholder-[#5a6a80] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5] transition-all"
                        />
                    </div>
                    <div className="text-xs text-[#5a6a80] font-medium flex items-center justify-between sm:justify-end shrink-0">
                        <span className="sm:hidden text-[11px] text-[#5a6a80]">Số lượng:</span>
                        <span>Hiển thị {filteredDocs.length} / {docs.length} bài đăng</span>
                    </div>
                </div>

                {/* Table Data */}
                <div className="overflow-x-auto w-full">
                    <table className="block md:table w-full text-left border-collapse md:min-w-[860px]">
                        <thead className="hidden md:table-header-group">
                            <tr className="border-b border-[#e5eeff] text-[11px] font-bold text-[#5a6a80] uppercase tracking-wider bg-[#fafcff]">
                                <th scope="col" className="py-3 px-4 sm:px-5">Tên bài đăng</th>
                                <th scope="col" className="py-3 px-4">Tác giả</th>
                                <th scope="col" className="py-3 px-3.5 text-center">Lượt đọc</th>
                                <th scope="col" className="py-3 px-3.5 text-center">Thích</th>
                                <th scope="col" className="py-3 px-3.5 text-center">Bình luận</th>
                                <th scope="col" className="py-3 px-3.5 text-center">Chia sẻ</th>
                                <th scope="col" className="py-3 px-4 sm:px-5 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="block md:table-row-group p-3 sm:p-4 md:p-0 bg-[#f8faff] md:bg-white space-y-3 md:space-y-0 divide-y-0 md:divide-y md:divide-[#eef3ff] text-xs">
                            {filteredDocs.length === 0 ? (
                                <tr className="block md:table-row">
                                    <td colSpan={7} className="block md:table-cell py-12 text-center text-[#5a6a80]">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <FileText size={32} className="text-[#a2b4cf]" />
                                            <p className="font-medium">Không tìm thấy bài đăng nào phù hợp.</p>
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
                                            {/* Tên bài đăng & CID */}
                                            <td className="block md:table-cell p-0 md:py-3.5 md:px-4 sm:px-5 max-w-none md:max-w-[300px]">
                                                <div
                                                    className="font-bold text-[#0b1c30] text-sm md:text-xs line-clamp-2 md:line-clamp-1 leading-snug cursor-pointer hover:text-[#0051d5] transition-colors"
                                                    title={doc.title}
                                                    onClick={() => setPreviewDoc(doc)}
                                                >
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
                                                <div className="text-[11px] text-[#5a6a80] mt-1 md:mt-0.5 flex items-center gap-1.5 flex-wrap">
                                                    <span>{doc.size}</span>
                                                    <span>·</span>
                                                    <span>{doc.faculty}</span>
                                                    {doc.createdAt && (
                                                        <>
                                                            <span>·</span>
                                                            <span>{doc.createdAt}</span>
                                                        </>
                                                    )}
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
                                                            {doc.authorTitle} · {doc.univ}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Lượt đọc */}
                                            <td className="block md:table-cell p-0 md:py-3.5 md:px-3.5 md:text-center whitespace-nowrap">
                                                <div className="flex items-center md:justify-center gap-1.5 text-xs text-[#0b1c30]">
                                                    <BookOpen size={13} className="text-[#5a6a80] md:hidden" />
                                                    <span className="md:hidden text-[#5a6a80] font-medium text-[11px]">Lượt đọc:</span>
                                                    <span className="font-semibold">{doc.reads.toLocaleString()}</span>
                                                </div>
                                            </td>

                                            {/* Thích */}
                                            <td className="block md:table-cell p-0 md:py-3.5 md:px-3.5 md:text-center whitespace-nowrap">
                                                <div className="flex items-center md:justify-center gap-1.5 text-xs text-[#0b1c30]">
                                                    <Heart size={13} className="text-[#e11d48] md:hidden" />
                                                    <span className="md:hidden text-[#5a6a80] font-medium text-[11px]">Thích:</span>
                                                    <span className="font-semibold text-[#e11d48]">{doc.likes.toLocaleString()}</span>
                                                </div>
                                            </td>

                                            {/* Bình luận */}
                                            <td className="block md:table-cell p-0 md:py-3.5 md:px-3.5 md:text-center whitespace-nowrap">
                                                <div className="flex items-center md:justify-center gap-1.5 text-xs text-[#0b1c30]">
                                                    <MessageSquare size={13} className="text-[#0284c7] md:hidden" />
                                                    <span className="md:hidden text-[#5a6a80] font-medium text-[11px]">Bình luận:</span>
                                                    <span className="font-semibold text-[#0284c7]">{doc.comments.toLocaleString()}</span>
                                                </div>
                                            </td>

                                            {/* Chia sẻ */}
                                            <td className="block md:table-cell p-0 md:py-3.5 md:px-3.5 md:text-center whitespace-nowrap">
                                                <div className="flex items-center md:justify-center gap-1.5 text-xs text-[#0b1c30]">
                                                    <Share2 size={13} className="text-[#059669] md:hidden" />
                                                    <span className="md:hidden text-[#5a6a80] font-medium text-[11px]">Chia sẻ:</span>
                                                    <span className="font-semibold text-[#059669]">{doc.shares.toLocaleString()}</span>
                                                </div>
                                            </td>

                                            {/* Thao tác */}
                                            <td className="block md:table-cell p-0 md:py-3.5 md:px-4 sm:px-5 md:text-right whitespace-nowrap pt-3 md:pt-0 border-t border-[#f0f4fc] md:border-t-0">
                                                <div className="flex items-center justify-end gap-2 md:gap-1.5">
                                                    {/* View Details Eye button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setPreviewDoc(doc)}
                                                        className="p-1.5 text-[#5a6a80] hover:text-[#0b1c30] bg-[#fafcff] hover:bg-[#eff4ff] border border-[#dce9ff] rounded-[7px] transition-colors cursor-pointer"
                                                        aria-label={`Xem chi tiết bài đăng ${doc.title}`}
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye size={15} />
                                                    </button>

                                                    {/* Delete Post button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(doc)}
                                                        className="p-1.5 text-[#ba1a1a] bg-[#fff5f4] hover:bg-[#ffebe8] border border-[#ffdad6] rounded-[7px] transition-colors cursor-pointer"
                                                        aria-label={`Xóa bài đăng ${doc.title}`}
                                                        title="Xóa bài đăng"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
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

            {/* Post Details Preview Modal */}
            <DocumentPreviewModal
                isOpen={!!previewDoc}
                document={previewDoc}
                onClose={() => setPreviewDoc(null)}
                onDelete={handleDelete}
                onCopyCid={handleCopyCid}
                copiedCid={copiedCid}
            />
        </AdminLayout>
    );
}
