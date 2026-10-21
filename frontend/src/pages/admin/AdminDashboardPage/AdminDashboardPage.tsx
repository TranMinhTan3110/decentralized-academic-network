import { useState } from 'react';
import { BookOpen, Download, Server, ShieldAlert, RefreshCw, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import { AdminLayout } from '../../../components/admin';
import { Button } from '../../../components/ui';

interface QueueItem {
    id: string;
    title: string;
    author: string;
    cid: string;
    faculty: string;
    timestamp: string;
    size: string;
}

const mockQueue: QueueItem[] = [
    {
        id: 'doc-01',
        title: 'Giáo trình Cấu trúc dữ liệu và Giải thuật (Bản chỉnh sửa 2026)',
        author: 'TS. Nguyễn Văn Hùng',
        cid: 'QmZtmD2...82Fq',
        faculty: 'Khoa CNTT - ĐH Bách Khoa',
        timestamp: '15 phút trước',
        size: '14.2 MB',
    },
    {
        id: 'doc-02',
        title: 'Đề cương & Bài tập Giải tích 1 có lời giải chi tiết',
        author: 'ThS. Trần Thị Mai',
        cid: 'QmRw3Lc...9hVn',
        faculty: 'Khoa Toán Tin - ĐH Khoa học Tự nhiên',
        timestamp: '42 phút trước',
        size: '8.7 MB',
    },
    {
        id: 'doc-03',
        title: 'Slide bài giảng Kiến trúc Máy tính & Hệ thống Nhúng',
        author: 'PGS. Lê Hoàng Nam',
        cid: 'QmXk9aP...4rTe',
        faculty: 'Khoa Điện tử - ĐH Bách Khoa',
        timestamp: '2 giờ trước',
        size: '26.4 MB',
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
    const [queue, setQueue] = useState(mockQueue);

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 600);
    };

    const handleApprove = (id: string) => {
        setQueue((prev) => prev.filter((item) => item.id !== id));
    };

    const handleReject = (id: string) => {
        setQueue((prev) => prev.filter((item) => item.id !== id));
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
                {/* KPI 1 */}
                <div className="bg-white border border-[#dce9ff] rounded-[14px] p-4 flex flex-col gap-1.5 shadow-2xs">
                    <div className="text-xs text-[#5a6a80] font-medium flex items-center justify-between">
                        <span>Tổng tài liệu IPFS</span>
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

                {/* KPI 2 */}
                <div className="bg-white border border-[#dce9ff] rounded-[14px] p-4 flex flex-col gap-1.5 shadow-2xs">
                    <div className="text-xs text-[#5a6a80] font-medium flex items-center justify-between">
                        <span>Lượt tải xác thực</span>
                        <Download size={17} className="text-[#0051d5]" />
                    </div>
                    <div className="text-2xl font-bold text-[#0b1c30] tracking-tight">1.82M</div>
                    <div className="text-xs text-[#5a6a80]">Lượt qua Node IPFS</div>
                </div>

                {/* KPI 3 (Warn) */}
                <div className="bg-[#fffbeb] border border-[#fde68a] rounded-[14px] p-4 flex flex-col gap-1.5 shadow-2xs">
                    <div className="text-xs text-[#b45309] font-medium flex items-center justify-between">
                        <span>Hàng đợi kiểm duyệt</span>
                        <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse" />
                    </div>
                    <div className="text-2xl font-bold text-[#b45309] tracking-tight">{queue.length}</div>
                    <div className="text-xs text-[#b45309]">Tài liệu đang chờ duyệt</div>
                </div>

                {/* KPI 4 */}
                <div className="bg-white border border-[#dce9ff] rounded-[14px] p-4 flex flex-col gap-1.5 shadow-2xs">
                    <div className="text-xs text-[#5a6a80] font-medium flex items-center justify-between">
                        <span>Cụm Node IPFS</span>
                        <Server size={17} className="text-[#0051d5]" />
                    </div>
                    <div className="text-2xl font-bold text-[#0b1c30] tracking-tight">42 / 42</div>
                    <div className="text-xs text-[#009668] font-semibold">100% SLA hoạt động</div>
                </div>

                {/* KPI 5 (Danger) */}
                <div className="bg-[#fff5f4] border border-[#ffdad6] rounded-[14px] p-4 flex flex-col gap-1.5 shadow-2xs">
                    <div className="text-xs text-[#ba1a1a] font-medium flex items-center justify-between">
                        <span>Báo cáo vi phạm</span>
                        <ShieldAlert size={17} className="text-[#ba1a1a]" />
                    </div>
                    <div className="text-2xl font-bold text-[#ba1a1a] tracking-tight">02</div>
                    <div className="text-xs text-[#ba1a1a]">Cần xử lý bản quyền</div>
                </div>
            </div>

            {/* Split Section: Queue Table & Traffic Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Queue Table (7 cols) */}
                <div className="lg:col-span-7 bg-white border border-[#dce9ff] rounded-[14px] shadow-2xs overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#e5eeff] flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-bold text-[#0b1c30]">Hàng đợi kiểm duyệt gần đây</h2>
                            <p className="text-xs text-[#5a6a80] mt-0.5">Các tài liệu mới được tải lên chờ thẩm định</p>
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#fef3c7] text-[#b45309] border border-[#fde68a]">
                            {queue.length} tài liệu
                        </span>
                    </div>

                    {queue.length === 0 ? (
                        <div className="p-8 text-center text-xs text-[#5a6a80]">
                            Không còn tài liệu nào cần duyệt trong hàng đợi.
                        </div>
                    ) : (
                        <div className="divide-y divide-[#eef3ff]">
                            {queue.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-4 sm:px-5 hover:bg-[#fafcff] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="text-xs sm:text-sm font-semibold text-[#0b1c30] line-clamp-1">
                                            {item.title}
                                        </div>
                                        <div className="text-[11px] text-[#5a6a80] mt-1 flex flex-wrap items-center gap-2">
                                            <span>{item.author}</span>
                                            <span>•</span>
                                            <span>{item.faculty}</span>
                                            <span>•</span>
                                            <span className="font-mono text-[#0051d5]">{item.cid}</span>
                                            <span>•</span>
                                            <span>{item.size}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                        <button
                                            type="button"
                                            onClick={() => handleApprove(item.id)}
                                            className="px-2.5 py-1 text-xs font-semibold text-white bg-[#009668] hover:bg-[#007d56] rounded-[7px] flex items-center gap-1 transition-colors cursor-pointer"
                                        >
                                            <CheckCircle2 size={13} />
                                            <span>Duyệt</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleReject(item.id)}
                                            className="px-2.5 py-1 text-xs font-semibold text-[#ba1a1a] bg-[#fff5f4] hover:bg-[#ffebe8] border border-[#ffdad6] rounded-[7px] flex items-center gap-1 transition-colors cursor-pointer"
                                        >
                                            <XCircle size={13} />
                                            <span>Từ chối</span>
                                        </button>
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
