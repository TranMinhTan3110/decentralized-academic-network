import { Users, Search, UploadCloud, Heart, TrendingUp, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Avatar } from '../../../components/ui';
import type { LeaderboardEntry } from '../../../data/leaderboard';

interface LeaderboardTableProps {
    filteredEntries: LeaderboardEntry[];
    searchQuery: string;
    onSearchChange: (q: string) => void;
}

export function LeaderboardTable({ filteredEntries, searchQuery, onSearchChange }: LeaderboardTableProps) {
    return (
        <div className="bg-white rounded-2xl border border-[#d8deea] shadow-xs overflow-hidden">
            {/* Table Control Header */}
            <div className="p-4 sm:p-5 border-b border-[#d8deea] flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#f8fafc]">
                <div>
                    <h3 className="text-base font-bold text-[#121827] flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#315dff]" />
                        <span>Danh Sách Đóng Góp</span>
                    </h3>
                    <p className="text-xs text-[#5f6878] mt-0.5">
                        Danh sách chi tiết bảng xếp hạng và các thống kê chia sẻ
                    </p>
                </div>

                {/* Search bar inside leaderboard table */}
                <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5f6878]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Tìm sinh viên hoặc trường..."
                        className="w-full h-9 pl-9 pr-3 bg-white border border-[#d8deea] rounded-xl text-xs text-[#121827] placeholder:text-[#94a3b8] focus:border-[#315dff] focus:outline-none transition-all shadow-2xs"
                    />
                </div>
            </div>

            {/* Table Header Columns */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3.5 bg-[#f1f5f9] border-b border-[#e2e8f0] text-[11px] font-bold text-[#5f6878] uppercase tracking-wider">
                <div className="col-span-1 text-center">Hạng</div>
                <div className="col-span-5">Người chia sẻ</div>
                <div className="col-span-3 text-center">Trường / Tổ chức</div>
                <div className="col-span-3 text-right">Tổng điểm & Thống kê</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-[#f1f5f9]">
                {filteredEntries.length === 0 ? (
                    <div className="p-12 text-center text-[#5f6878] space-y-2">
                        <p className="text-sm font-semibold">Không tìm thấy sinh viên nào khớp với từ khóa!</p>
                        <p className="text-xs">Thử tìm kiếm tên khác hoặc xóa bộ lọc.</p>
                    </div>
                ) : (
                    filteredEntries.map((entry) => {
                        return (
                            <div
                                key={entry.userId}
                                className={`p-4 md:px-6 md:py-4 transition-colors grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center ${
                                    entry.isCurrentUser
                                        ? 'bg-[#f0f6ff] border-l-4 border-l-[#315dff]'
                                        : 'hover:bg-[#f8fafc]'
                                }`}
                            >
                                {/* Rank Column */}
                                <div className="md:col-span-1 flex items-center gap-2 justify-start md:justify-center">
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                            entry.rank === 1
                                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                                : entry.rank === 2
                                                  ? 'bg-slate-200 text-slate-800 border border-slate-300'
                                                  : entry.rank === 3
                                                    ? 'bg-amber-800/10 text-amber-900 border border-amber-800/20'
                                                    : 'bg-[#f8fafc] text-[#5f6878] border border-[#e2e8f0]'
                                        }`}
                                    >
                                        {entry.rank}
                                    </div>

                                    {/* Rank change indicator */}
                                    {entry.trend === 'up' && (
                                        <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">
                                            <ArrowUpRight className="w-3 h-3" />
                                            {entry.change}
                                        </span>
                                    )}
                                    {entry.trend === 'down' && (
                                        <span className="inline-flex items-center text-[10px] font-bold text-rose-600 bg-rose-50 px-1 py-0.5 rounded">
                                            <ArrowDownRight className="w-3 h-3" />
                                            {Math.abs(entry.change)}
                                        </span>
                                    )}
                                    {entry.trend === 'same' && (
                                        <span className="inline-flex items-center text-[10px] text-slate-400">
                                            <Minus className="w-3 h-3" />
                                        </span>
                                    )}
                                </div>

                                {/* User Column */}
                                <div className="md:col-span-5 flex items-center gap-3">
                                    <Avatar name={entry.name} avatar={entry.avatar} size="md" />
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <strong className="text-xs sm:text-sm font-bold text-[#121827] truncate">
                                                {entry.name}
                                            </strong>
                                            {entry.isCurrentUser && (
                                                <span className="bg-[#315dff] text-white px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0">
                                                    Bạn
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] text-[#5f6878] mt-0.5">
                                            <span>{entry.handle}</span>
                                            <span>•</span>
                                            <span>{entry.followerCount} người theo dõi</span>
                                        </div>
                                    </div>
                                </div>

                                {/* School Column */}
                                <div className="md:col-span-3 text-xs text-[#5f6878] truncate hidden md:block text-center">
                                    {entry.school}
                                </div>

                                {/* Score & Stats Column */}
                                <div className="md:col-span-3 flex items-center justify-between md:justify-end gap-4">
                                    <div className="flex items-center gap-2 text-[11px] text-[#5f6878]">
                                        <span className="inline-flex items-center gap-1 bg-[#f0f4ff] px-2 py-1 rounded-md text-[#315dff] font-medium">
                                            <UploadCloud className="w-3.5 h-3.5" />
                                            {entry.uploads}
                                        </span>
                                        <span className="inline-flex items-center gap-1 bg-[#fff1f2] px-2 py-1 rounded-md text-rose-600 font-medium">
                                            <Heart className="w-3.5 h-3.5" />
                                            {entry.likes}
                                        </span>
                                    </div>

                                    <div className="text-right flex items-center gap-1.5">
                                        <strong className="text-base sm:text-lg font-black text-[#315dff]">
                                            {entry.points}
                                        </strong>
                                        <span className="text-[10px] text-slate-500 font-bold uppercase">điểm</span>
                                        <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
