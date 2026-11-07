import { useState } from 'react';
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
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'POSTS' | 'REPORTS'>('POSTS');

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 600);
    };

    return (
        <AdminLayout
            breadcrumb="Admin / Tổng quan"
            title="Tổng quan điều hành"
            subtitle="Mission Control của mạng lưới học thuật phi tập trung DeDocu"
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
                    <div className="text-2xl font-bold text-[#0b1c30] tracking-tight">142,580</div>
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
                    <div className="text-2xl font-bold text-[#0b1c30] tracking-tight">1.82M</div>
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
                    <div className="text-2xl font-bold text-[#ba1a1a] tracking-tight">02</div>
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
                                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                                        activeTab === 'REPORTS'
                                            ? 'bg-white text-[#ba1a1a]'
                                            : 'bg-[#ba1a1a] text-white'
                                    }`}
                                >
                                    2
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
                        <div className="divide-y divide-[#eef3ff]">
                            {mockRecentPosts.map((post) => (
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
                    )}

                    {/* Tab 2: Pending Reports Feed */}
                    {activeTab === 'REPORTS' && (
                        <div className="divide-y divide-[#eef3ff]">
                            {mockPendingReports.map((report) => (
                                <div
                                    key={report.id}
                                    className="p-4 sm:px-5 hover:bg-[#fffdfd] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#fee2e2] text-[#ba1a1a] border border-[#fecaca]">
                                                {report.type}
                                            </span>
                                            <div className="text-xs sm:text-sm font-semibold text-[#0b1c30] line-clamp-1">
                                                {report.targetTitle}
                                            </div>
                                        </div>
                                        <div className="text-[11px] text-[#5a6a80] mt-1.5">
                                            <span className="text-[#ba1a1a] font-medium">Lý do:</span> {report.reason}
                                        </div>
                                        <div className="text-[10px] text-[#5a6a80] mt-1 flex items-center gap-2">
                                            <span>Người báo cáo: {report.reporter}</span>
                                            <span>·</span>
                                            <span>{report.timestamp}</span>
                                        </div>
                                    </div>

                                    <div className="shrink-0 self-end sm:self-center">
                                        <Link
                                            to="/admin/reports"
                                            className="px-3 py-1.5 text-xs font-semibold text-white bg-[#ba1a1a] hover:bg-[#9a1414] rounded-[8px] flex items-center gap-1.5 transition-colors shadow-xs"
                                        >
                                            <span>Xử lý báo cáo</span>
                                            <ArrowRight size={13} />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
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
