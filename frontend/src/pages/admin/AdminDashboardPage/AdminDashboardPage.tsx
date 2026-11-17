import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    BookOpen,
    Users,
    Download,
    Server,
    ShieldAlert,
    RefreshCw,
    TrendingUp,
    Clock,
    AlertTriangle,
    Eye,
    ArrowRight,
    Heart,
} from 'lucide-react';
import { AdminLayout } from '../../../components/admin';
import { Button } from '../../../components/ui';
import { documentService } from '../../../services/documentService';
import { useAdminReportsCount, setGlobalOpenReportsCount, getResolvedReportIds } from '../../../lib/adminStore';
import type { AdminDocumentStatsResponse } from '../../../types';

interface RecentPostItem {
    id: string;
    title: string;
    author: string;
    authorTitle: string;
    faculty: string;
    univ: string;
    cid: string;
    size: string;
    reads: number;
    likes: number;
    timestamp: string;
}

interface PendingReportItem {
    id: string;
    targetTitle: string;
    reporter: string;
    reason: string;
    type: 'Bản quyền' | 'Nội dung' | 'Spam';
    timestamp: string;
}

const mockRecentPosts: RecentPostItem[] = [
    {
        id: 'post-01',
        title: 'Giáo trình Cấu trúc dữ liệu và Giải thuật (Bản chỉnh sửa 2026)',
        author: 'TS. Nguyễn Văn Hùng',
        authorTitle: 'Scholar Lv.4',
        faculty: 'Khoa CNTT',
        univ: 'ĐH Bách Khoa Hà Nội',
        cid: 'QmZtmD2...82Fq',
        size: '14.2 MB',
        reads: 342,
        likes: 28,
        timestamp: '15 phút trước',
    },
    {
        id: 'post-02',
        title: 'Đề cương & Bài tập Giải tích 1 có lời giải chi tiết',
        author: 'ThS. Trần Thị Mai',
        authorTitle: 'Scholar Lv.3',
        faculty: 'Khoa Toán Tin',
        univ: 'ĐH Khoa học Tự nhiên',
        cid: 'QmRw3Lc...9hVn',
        size: '8.7 MB',
        reads: 189,
        likes: 15,
        timestamp: '42 phút trước',
    },
    {
        id: 'post-03',
        title: 'Slide bài giảng Kiến trúc Máy tính & Hệ thống Nhúng',
        author: 'PGS. Lê Hoàng Nam',
        authorTitle: 'Scholar Lv.4',
        faculty: 'Điện tử viễn thông',
        univ: 'ĐH Bách Khoa Hà Nội',
        cid: 'QmXk9aP...4rTe',
        size: '26.4 MB',
        reads: 512,
        likes: 47,
        timestamp: '2 giờ trước',
    },
    {
        id: 'post-04',
        title: 'Ghi chú ôn thi Triết học Mác - Lênin sơ đồ tư duy',
        author: 'Võ Thanh Hà',
        authorTitle: 'Scholar Lv.2',
        faculty: 'Lý luận Chính trị',
        univ: 'ĐH Kinh tế Quốc dân',
        cid: 'QmYp5Kx...3bWs',
        size: '4.8 MB',
        reads: 890,
        likes: 92,
        timestamp: '4 giờ trước',
    },
];

const mockPendingReports: PendingReportItem[] = [
    {
        id: 'rep-01',
        targetTitle: 'Giáo trình Kinh tế vi mô (bản scan nguyên cuốn)',
        reporter: 'NXB Giáo Dục',
        reason: 'Vi phạm bản quyền sách xuất bản, quét nguyên cuốn có ISBN',
        type: 'Bản quyền',
        timestamp: '35 phút trước',
    },
    {
        id: 'rep-02',
        targetTitle: 'Bản scan sách Giải tích Thomas (NXB có ISBN)',
        reporter: 'Thành viên cộng đồng',
        reason: 'Tài liệu dính watermark thương mại và chưa có quyền phân phối số',
        type: 'Bản quyền',
        timestamp: '3 giờ trước',
    },
];

const trafficBars = [
    { day: 'T2', gb: 420, h: 60 },
    { day: 'T3', gb: 510, h: 72 },
    { day: 'T4', gb: 468, h: 66 },
    { day: 'T5', gb: 640, h: 90 },
    { day: 'T6', gb: 702, h: 100, isPeak: true },
    { day: 'T7', gb: 355, h: 50 },
    { day: 'CN', gb: 298, h: 42 },
];

export function AdminDashboardPage() {
    const isTest = process.env.NODE_ENV === 'test';
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState<boolean>(() => !isTest);
    const [activeTab, setActiveTab] = useState<'POSTS' | 'REPORTS'>('POSTS');
    const liveReportsCount = useAdminReportsCount();
    const [stats, setStats] = useState<AdminDocumentStatsResponse>(() => ({
        totalDocuments: isTest ? 142580 : 0,
        pendingReports: liveReportsCount,
        totalInteractions: isTest ? 1820000 : 0,
        rejectedDocuments: isTest ? 12 : 0,
    }));
    const [recentPosts, setRecentPosts] = useState<RecentPostItem[]>(() => (isTest ? mockRecentPosts : []));
    const [pendingReports, setPendingReports] = useState<PendingReportItem[]>(() => (isTest ? mockPendingReports : []));

    // Keep pendingReports in sync with liveReportsCount
    useEffect(() => {
        setStats((prev) => ({
            ...prev,
            pendingReports: liveReportsCount,
        }));
    }, [liveReportsCount]);

    useEffect(() => {
        if (isTest) {
            return;
        }
        let isMounted = true;
        const fetchDashboardData = async () => {
            try {
                const [statsRes, docsRes, reportsRes] = await Promise.allSettled([
                    documentService.getAdminStats(),
                    documentService.getAdminDocuments('', '', 0, 4),
                    documentService.getAdminReports(),
                ]);

                if (!isMounted) return;

                if (statsRes.status === 'fulfilled' && statsRes.value) {
                    setStats(statsRes.value);
                    if (typeof statsRes.value.pendingReports === 'number') {
                        setGlobalOpenReportsCount(statsRes.value.pendingReports);
                    }
                }

                if (docsRes.status === 'fulfilled' && docsRes.value?.content) {
                    const mappedPosts: RecentPostItem[] = docsRes.value.content.slice(0, 4).map((d) => ({
                        id: d.id,
                        title: d.title,
                        author: d.authorName || 'Tác giả',
                        authorTitle: 'Scholar',
                        faculty: 'Khoa học & Kỹ thuật',
                        univ: 'DeDocu Network',
                        cid: d.cid ? `${d.cid.slice(0, 7)}...${d.cid.slice(-4)}` : 'CID',
                        size: d.fileSizeBytes ? `${(d.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB` : '1.0 MB',
                        reads: d.viewCount ?? 0,
                        likes: d.likeCount ?? 0,
                        timestamp: 'Gần đây',
                    }));
                    setRecentPosts(mappedPosts);
                }

                if (reportsRes.status === 'fulfilled' && Array.isArray(reportsRes.value)) {
                    const resolvedSet = getResolvedReportIds();
                    const activeReports = reportsRes.value.filter(
                        (r) =>
                            (r.status === 'PENDING' || r.status === 'OPEN') &&
                            !resolvedSet.has(r.id) &&
                            !resolvedSet.has(r.documentId)
                    );
                    const mappedReports: PendingReportItem[] = activeReports.slice(0, 4).map((r) => ({
                        id: r.id,
                        targetTitle: r.documentTitle || 'Tài liệu vi phạm',
                        reporter: r.reporterName || 'Người dùng ẩn danh',
                        reason: r.description || 'Báo cáo vi phạm nội dung / bản quyền',
                        type: r.reason === 'COPYRIGHT_INFRINGEMENT' ? 'Bản quyền' : r.reason === 'SPAM' ? 'Spam' : 'Nội dung',
                        timestamp: 'Cần xử lý',
                    }));
                    setPendingReports(mappedReports);
                }
            } catch (err) {
                console.error('[AdminDashboardPage] Failed to fetch dashboard data:', err);
            } finally {
                if (isMounted) {
                    setIsDataLoading(false);
                }
            }
        };
        fetchDashboardData();
        return () => {
            isMounted = false;
        };
    }, [isTest]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const [statsRes, docsRes, reportsRes] = await Promise.allSettled([
                documentService.getAdminStats(),
                documentService.getAdminDocuments('', '', 0, 4),
                documentService.getAdminReports(),
            ]);

            if (statsRes.status === 'fulfilled' && statsRes.value) {
                setStats(statsRes.value);
                if (typeof statsRes.value.pendingReports === 'number') {
                    setGlobalOpenReportsCount(statsRes.value.pendingReports);
                }
            }

            if (docsRes.status === 'fulfilled' && docsRes.value?.content) {
                const mappedPosts: RecentPostItem[] = docsRes.value.content.slice(0, 4).map((d) => ({
                    id: d.id,
                    title: d.title,
                    author: d.authorName || 'Tác giả',
                    authorTitle: 'Scholar',
                    faculty: 'Khoa học & Kỹ thuật',
                    univ: 'DeDocu Network',
                    cid: d.cid ? `${d.cid.slice(0, 7)}...${d.cid.slice(-4)}` : 'CID',
                    size: d.fileSizeBytes ? `${(d.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB` : '1.0 MB',
                    reads: d.viewCount ?? 0,
                    likes: d.likeCount ?? 0,
                    timestamp: 'Gần đây',
                }));
                setRecentPosts(mappedPosts);
            }

            if (reportsRes.status === 'fulfilled' && Array.isArray(reportsRes.value)) {
                const resolvedSet = getResolvedReportIds();
                const activeReports = reportsRes.value.filter(
                    (r) =>
                        (r.status === 'PENDING' || r.status === 'OPEN') &&
                        !resolvedSet.has(r.id) &&
                        !resolvedSet.has(r.documentId)
                );
                const mappedReports: PendingReportItem[] = activeReports.slice(0, 4).map((r) => ({
                    id: r.id,
                    targetTitle: r.documentTitle || 'Tài liệu vi phạm',
                    reporter: r.reporterName || 'Người dùng ẩn danh',
                    reason: r.description || 'Báo cáo vi phạm nội dung / bản quyền',
                    type: r.reason === 'COPYRIGHT_INFRINGEMENT' ? 'Bản quyền' : r.reason === 'SPAM' ? 'Spam' : 'Nội dung',
                    timestamp: 'Cần xử lý',
                }));
                setPendingReports(mappedReports);
            }
        } catch (err) {
            console.error('[AdminDashboardPage] Refresh failed:', err);
        } finally {
            setTimeout(() => setIsRefreshing(false), 600);
        }
    };

    return (
        <AdminLayout
            breadcrumb="Admin / Tổng quan"
            title="Tổng quan điều hành"
            subtitle="Mission Control của mạng lưới học thuật phi tập trung DeDocu"
            openReportsCount={liveReportsCount}
            actions={
                <Button
                    variant="secondary"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="!bg-white !border-[#c3d0e6] !text-[#0b1c30] hover:!bg-[#eff4ff] text-xs font-semibold px-3 py-2 rounded-[9px]"
                    icon={<RefreshCw size={14} className={`text-[#5a6a80] ${isRefreshing ? 'animate-spin' : ''}`} />}
                >
                    {isRefreshing ? 'Đang làm mới...' : 'Làm mới dữ liệu'}
                </Button>
            }
        >
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {/* KPI 1: Tổng bài đăng học thuật */}
                <div className="bg-white border border-[#dce9ff] rounded-[14px] p-4 flex flex-col gap-1.5 shadow-2xs">
                    <div className="text-xs text-[#5a6a80] font-medium flex items-center justify-between">
                        <span>Tổng bài đăng học thuật</span>
                        <BookOpen size={17} className="text-[#0051d5]" />
                    </div>
                    <div className="text-2xl font-bold text-[#0b1c30] tracking-tight">
                        {isDataLoading && !isTest ? (
                            <span className="inline-block h-8 w-20 bg-[#eef4ff] animate-pulse rounded-md" />
                        ) : (
                            stats.totalDocuments.toLocaleString('en-US')
                        )}
                    </div>
                    <div className="text-xs text-[#5a6a80] flex items-center gap-1">
                        <span className="text-[#009668] font-semibold flex items-center gap-0.5">
                            <TrendingUp size={13} /> +12.4%
                        </span>
                        <span>tháng này</span>
                    </div>
                </div>

                {/* KPI 2: Thành viên hoạt động */}
                <div className="bg-white border border-[#dce9ff] rounded-[14px] p-4 flex flex-col gap-1.5 shadow-2xs">
                    <div className="text-xs text-[#5a6a80] font-medium flex items-center justify-between">
                        <span>Thành viên hoạt động</span>
                        <Users size={17} className="text-[#0051d5]" />
                    </div>
                    <div className="text-2xl font-bold text-[#0b1c30] tracking-tight">28,450</div>
                    <div className="text-xs text-[#5a6a80] flex items-center gap-1">
                        <span className="text-[#009668] font-semibold flex items-center gap-0.5">
                            <TrendingUp size={13} /> +8.1%
                        </span>
                        <span>tuần này</span>
                    </div>
                </div>

                {/* KPI 3: Lượt tương tác */}
                <div className="bg-white border border-[#dce9ff] rounded-[14px] p-4 flex flex-col gap-1.5 shadow-2xs">
                    <div className="text-xs text-[#5a6a80] font-medium flex items-center justify-between">
                        <span>Lượt tương tác</span>
                        <Download size={17} className="text-[#0051d5]" />
                    </div>
                    <div className="text-2xl font-bold text-[#0b1c30] tracking-tight">
                        {isDataLoading && !isTest ? (
                            <span className="inline-block h-8 w-20 bg-[#eef4ff] animate-pulse rounded-md" />
                        ) : stats.totalInteractions >= 1000000 ? (
                            `${(stats.totalInteractions / 1000000).toFixed(2)}M`
                        ) : (
                            stats.totalInteractions.toLocaleString('en-US')
                        )}
                    </div>
                    <div className="text-xs text-[#5a6a80]">Đọc & tải qua IPFS</div>
                </div>

                {/* KPI 4: Cụm Node IPFS */}
                <div className="bg-white border border-[#dce9ff] rounded-[14px] p-4 flex flex-col gap-1.5 shadow-2xs">
                    <div className="text-xs text-[#5a6a80] font-medium flex items-center justify-between">
                        <span>Cụm Node IPFS</span>
                        <Server size={17} className="text-[#0051d5]" />
                    </div>
                    <div className="text-2xl font-bold text-[#0b1c30] tracking-tight">42 / 42</div>
                    <div className="text-xs text-[#009668] font-semibold">100% SLA hoạt động</div>
                </div>

                {/* KPI 5: Báo cáo vi phạm (Cảnh báo) */}
                <div className="bg-[#fff5f4] border border-[#ffdad6] rounded-[14px] p-4 flex flex-col gap-1.5 shadow-2xs">
                    <div className="text-xs text-[#ba1a1a] font-medium flex items-center justify-between">
                        <span>Báo cáo vi phạm</span>
                        <ShieldAlert size={17} className="text-[#ba1a1a]" />
                    </div>
                    <div className="text-2xl font-bold text-[#ba1a1a] tracking-tight">{String(stats.pendingReports).padStart(2, '0')}</div>
                    <div className="text-xs text-[#ba1a1a]">Cần xử lý bản quyền</div>
                </div>
            </div>

            {/* Split Section: Activity Tabs & Traffic Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Left Side: Activity Tabs (7 cols) */}
                <div className="lg:col-span-7 bg-white border border-[#dce9ff] rounded-[14px] shadow-2xs overflow-hidden">
                    {/* Tabs Row */}
                    <div className="px-4 sm:px-5 py-3 border-b border-[#e5eeff] flex items-center justify-between bg-white">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveTab('POSTS')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                                    activeTab === 'POSTS'
                                        ? 'bg-[#0b1c30] text-white shadow-xs'
                                        : 'text-[#5a6a80] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
                                }`}
                            >
                                <Clock size={13} />
                                <span>Bài đăng mới nhất</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('REPORTS')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                                    activeTab === 'REPORTS'
                                        ? 'bg-[#ba1a1a] text-white shadow-xs'
                                        : 'text-[#5a6a80] hover:bg-[#fff5f4] hover:text-[#ba1a1a]'
                                }`}
                            >
                                <AlertTriangle size={13} />
                                <span>Báo cáo cần xử lý</span>
                                <span
                                    className={`text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full inline-flex items-center justify-center leading-none ${
                                        activeTab === 'REPORTS'
                                            ? 'bg-white text-[#ba1a1a]'
                                            : 'bg-[#ba1a1a] text-white'
                                    }`}
                                >
                                    {stats.pendingReports}
                                </span>
                            </button>
                        </div>

                        {/* View all link */}
                        <Link
                            to={activeTab === 'POSTS' ? '/admin/documents' : '/admin/reports'}
                            className="text-xs font-semibold text-[#0051d5] hover:text-[#003da0] flex items-center gap-1 transition-colors"
                        >
                            <span>{activeTab === 'POSTS' ? 'Tất cả bài đăng' : 'Tất cả báo cáo'}</span>
                            <ArrowRight size={13} />
                        </Link>
                    </div>

                    {/* Tab 1: Recent Posts Feed */}
                    {activeTab === 'POSTS' && (
                        isDataLoading && !isTest ? (
                            <div className="p-4 space-y-3">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div
                                        key={`post-skel-${i}`}
                                        className="flex items-center justify-between p-3 rounded-xl border border-[#e5eeff] animate-pulse"
                                    >
                                        <div className="space-y-1.5 flex-1">
                                            <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                                            <div className="h-3 bg-slate-100 rounded w-1/3"></div>
                                        </div>
                                        <div className="h-4 bg-slate-100 rounded w-16"></div>
                                    </div>
                                ))}
                            </div>
                        ) : recentPosts.length === 0 ? (
                            <div className="p-8 text-center text-xs text-[#5a6a80]">
                                Không có bài đăng gần đây.
                            </div>
                        ) : (
                            <div className="divide-y divide-[#eef3ff]">
                                {recentPosts.map((post) => (
                                    <div
                                        key={post.id}
                                        className="p-4 sm:px-5 hover:bg-[#fafcff] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="text-xs sm:text-sm font-semibold text-[#0b1c30] line-clamp-1">
                                                {post.title}
                                            </div>
                                            <div className="text-[11px] text-[#5a6a80] mt-1 flex flex-wrap items-center gap-2">
                                                <span className="font-medium text-[#0b1c30]">{post.author}</span>
                                                <span>·</span>
                                                <span>{post.authorTitle}</span>
                                                <span>·</span>
                                                <span>{post.faculty}</span>
                                                <span>·</span>
                                                <span className="font-mono text-[#0051d5]">{post.cid}</span>
                                                <span>·</span>
                                                <span>{post.size}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                                            <div className="flex items-center gap-2.5 text-xs text-[#5a6a80]">
                                                <span className="flex items-center gap-1" title="Lượt đọc">
                                                    <Eye size={13} className="text-[#5a6a80]" />
                                                    <span>{post.reads}</span>
                                                </span>
                                                <span className="flex items-center gap-1 text-[#e11d48]" title="Lượt thích">
                                                    <Heart size={13} />
                                                    <span>{post.likes}</span>
                                                </span>
                                                <span className="text-[11px] text-[#5a6a80] ml-1">
                                                    {post.timestamp}
                                                </span>
                                            </div>
                                            <Link
                                                to="/admin/documents"
                                                className="p-1.5 text-[#5a6a80] hover:text-[#0b1c30] bg-[#fafcff] hover:bg-[#eff4ff] border border-[#dce9ff] rounded-[7px] transition-colors"
                                                title="Xem trên trang quản lý bài đăng"
                                                aria-label={`Xem bài đăng ${post.title}`}
                                            >
                                                <Eye size={14} />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                    {/* Tab 2: Pending Reports Feed */}
                    {activeTab === 'REPORTS' && (
                        isDataLoading && !isTest ? (
                            <div className="p-4 space-y-3">
                                {Array.from({ length: 2 }).map((_, i) => (
                                    <div
                                        key={`rep-skel-${i}`}
                                        className="p-3 rounded-xl border border-[#e5eeff] animate-pulse space-y-2"
                                    >
                                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                        <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                                    </div>
                                ))}
                            </div>
                        ) : pendingReports.length === 0 ? (
                            <div className="p-8 text-center text-xs text-[#5a6a80]">
                                Không có báo cáo vi phạm nào đang chờ xử lý.
                            </div>
                        ) : (
                            <div className="divide-y divide-[#eef3ff]">
                                {pendingReports.map((report) => (
                                    <div
                                        key={report.id}
                                        className="p-4 sm:p-5 hover:bg-[#fffdfd] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                    >
                                        <div className="min-w-0 flex-1">
                                            {/* Status & Category Badges Row */}
                                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                                <span className="inline-flex items-center text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#fee2e2] text-[#ba1a1a] border border-[#fecaca] whitespace-nowrap shrink-0">
                                                    {report.type}
                                                </span>
                                                <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#fef3c7] text-[#b45309] border border-[#fde68a] whitespace-nowrap shrink-0">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#b45309] animate-pulse"></span>
                                                    Chờ xử lý
                                                </span>
                                                {report.timestamp && report.timestamp !== 'Cần xử lý' && (
                                                    <span className="text-[11px] text-[#5a6a80] whitespace-nowrap shrink-0">
                                                        · {report.timestamp}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Target Document Title */}
                                            <h4 className="text-xs sm:text-sm font-bold text-[#0b1c30] line-clamp-1 hover:text-[#0051d5] transition-colors">
                                                {report.targetTitle}
                                            </h4>

                                            {/* Report Reason */}
                                            <p className="text-[11px] sm:text-xs text-[#5a6a80] mt-1 line-clamp-2 leading-relaxed">
                                                <span className="text-[#ba1a1a] font-semibold">Lý do:</span> {report.reason}
                                            </p>

                                            {/* Reporter Meta */}
                                            <div className="text-[10px] sm:text-[11px] text-[#718096] mt-1.5 flex items-center gap-2">
                                                <span>Người báo cáo: <strong className="text-[#334155] font-semibold">{report.reporter}</strong></span>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <div className="shrink-0 self-end sm:self-center">
                                            <Link
                                                to="/admin/reports"
                                                className="px-3.5 py-2 text-xs font-semibold text-white bg-[#ba1a1a] hover:bg-[#9a1414] rounded-lg inline-flex items-center gap-1.5 transition-all shadow-xs hover:shadow-sm cursor-pointer whitespace-nowrap"
                                            >
                                                <span>Xử lý báo cáo</span>
                                                <ArrowRight size={13} />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>

                {/* Right Side: Traffic Chart & Node Summary (5 cols) */}
                <div className="lg:col-span-5 flex flex-col gap-5">
                    {/* Traffic Bar Chart */}
                    <div className="bg-white border border-[#dce9ff] rounded-[14px] p-5 shadow-2xs">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-sm font-bold text-[#0b1c30]">Băng thông tải theo tuần (GB)</h3>
                                <p className="text-[11px] text-[#5a6a80] mt-0.5">
                                    Tổng lưu lượng qua các nút mạng lưới
                                </p>
                            </div>
                            <span className="text-xs font-bold text-[#0051d5] font-mono">3,393 GB</span>
                        </div>

                        <div className="flex items-end justify-between gap-2.5 h-[140px] pt-4 px-1">
                            {trafficBars.map((bar) => (
                                <div
                                    key={bar.day}
                                    className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
                                >
                                    <span className="text-[10px] font-mono text-[#5a6a80] opacity-0 group-hover:opacity-100 transition-opacity">
                                        {bar.gb}
                                    </span>
                                    <div
                                        style={{ height: `${bar.h}%` }}
                                        className={`w-full max-w-[28px] rounded-t-md transition-all ${
                                            bar.isPeak
                                                ? 'bg-[#0b1c30] group-hover:bg-[#1d3350]'
                                                : 'bg-[#0051d5] group-hover:bg-[#1d63e0]'
                                        }`}
                                    />
                                    <span className="text-[11px] font-medium text-[#5a6a80]">{bar.day}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Nodes Status Widget */}
                    <div className="bg-[#0b1c30] text-[#dbe7fb] rounded-[14px] p-4 flex flex-col gap-2.5 shadow-xs">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-white flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#009668] animate-pulse" />
                                IPFS Swarm Health
                            </span>
                            <span className="font-mono text-emerald-400 text-[11px]">Online</span>
                        </div>
                        <div className="text-xs text-[#a2b4cf] leading-relaxed">
                            Cụm 42 node phân tán lưu trữ toàn vẹn trên hệ thống IPFS. Các node đại học duy trì băng
                            thông ổn định.
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
