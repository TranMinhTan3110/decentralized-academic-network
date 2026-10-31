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
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xs overflow-hidden">
            {/* Table Control Header */}
            <div className="p-4 sm:p-5 border-b border-[#e2e8f0] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#f8fafc]">
                <div>
                    <h3 className="text-base font-bold text-[#0f172a] flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#0284c7]" />
                        <span>Danh Sách Đóng Góp</span>
                    </h3>
                    <p className="text-xs text-[#64748b] mt-0.5">
                        Danh sách chi tiết bảng xếp hạng và các thống kê chia sẻ
                    </p>
                </div>

                {/* Search bar inside leaderboard table */}
                <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Tìm sinh viên hoặc trường..."
                        className="w-full h-9 pl-9 pr-3 bg-white border border-[#cbd5e1] rounded-xl text-xs text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#0284c7] focus:outline-none transition-all shadow-xs"
                    />
                </div>
            </div>

            {/* Table Header Columns (Desktop & Tablet) */}
            <div className="hidden md:grid grid-cols-12 gap-3 md:gap-4 px-6 py-3.5 bg-[#f8fafc] border-b border-[#e2e8f0] text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
                <div className="col-span-1 text-center">Hạng</div>
                <div className="col-span-4">Người chia sẻ</div>
                <div className="col-span-3 text-center">Trường / Tổ chức</div>
                <div className="col-span-4 text-right">Tổng điểm & Thống kê</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-[#f1f5f9]">
                {filteredEntries.length === 0 ? (
                    <div className="p-12 text-center text-[#64748b] space-y-2">
                        <p className="text-sm font-semibold text-[#0f172a]">Không tìm thấy sinh viên nào khớp với từ khóa!</p>
                        <p className="text-xs">Thử tìm kiếm tên khác hoặc xóa bộ lọc.</p>
                    </div>
                ) : (
                    filteredEntries.map((entry) => {
                        return (
                            <div
                                key={entry.userId}
                                className={`p-3.5 sm:p-4 md:px-6 md:py-4 transition-colors flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 items-stretch md:items-center ${
                                    entry.isCurrentUser
                                        ? 'bg-[#f0f9ff] border-l-4 border-l-[#0284c7]'
                                        : 'hover:bg-[#f8fafc]'
                                }`}
                            >
                                {/* Mobile Top Row / Desktop Columns */}
                                <div className="flex items-center justify-between gap-3 md:contents">
                                    {/* Rank Column - Fixed width footprint ensures all rows align in a perfectly straight column */}
                                    <div className="md:col-span-1 flex items-center gap-1.5 sm:gap-2 justify-start md:justify-center shrink-0">
                                        <div
                                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                                entry.rank === 1
                                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                                    : entry.rank === 2
                                                      ? 'bg-slate-200 text-slate-800 border border-slate-300'
                                                      : entry.rank === 3
                                                        ? 'bg-amber-800/10 text-amber-900 border border-amber-800/20'
                                                        : 'bg-[#f8fafc] text-[#64748b] border border-[#e2e8f0]'
                                            }`}
                                        >
                                            {entry.rank}
                                        </div>

                                        {/* Rank change indicator with fixed width so it doesn't push the rank circle out of alignment */}
                                        <div className="w-6 sm:w-7 flex items-center justify-center shrink-0">
                                            {entry.trend === 'up' && (
                                                <span className="inline-flex items-center justify-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded w-full">
                                                    <ArrowUpRight className="w-3 h-3 shrink-0" />
                                                    <span>{entry.change}</span>
                                                </span>
                                            )}
                                            {entry.trend === 'down' && (
                                                <span className="inline-flex items-center justify-center gap-0.5 text-[10px] font-bold text-rose-600 bg-rose-50 px-1 py-0.5 rounded w-full">
                                                    <ArrowDownRight className="w-3 h-3 shrink-0" />
                                                    <span>{Math.abs(entry.change)}</span>
                                                </span>
                                            )}
                                            {entry.trend === 'same' && (
                                                <span className="inline-flex items-center justify-center text-[10px] text-slate-400 bg-slate-100/70 px-1 py-0.5 rounded w-full">
                                                    <Minus className="w-3 h-3 shrink-0" />
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* User Column */}
                                    <div className="md:col-span-4 flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                                         <Avatar name={entry.name} avatar={entry.avatar} size="md" />
                                         <div className="min-w-0 flex-1">
                                             <div className="flex items-center gap-2 flex-wrap">
                                                 <strong className="text-xs sm:text-sm font-bold text-[#0f172a] truncate">
                                                     {entry.name}
                                                 </strong>
                                                 {entry.isCurrentUser && (
                                                     <span className="bg-[#0284c7] text-white px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0">
                                                         Bạn
                                                     </span>
                                                 )}
                                             </div>
                                             <div className="flex items-center gap-1.5 text-[11px] text-[#64748b] mt-0.5 truncate">
                                                 <span>{entry.handle}</span>
                                                 <span className="hidden sm:inline">•</span>
                                                 <span className="hidden sm:inline">{entry.followerCount} người theo dõi</span>
                                             </div>
                                         </div>
                                     </div>

                                     {/* Points on mobile only (Right side) */}
                                     <div className="md:hidden text-right shrink-0">
                                         <div className="flex items-center justify-end gap-1">
                                             <strong className="text-sm font-black text-[#0284c7]">
                                                 {entry.points}
                                             </strong>
                                             <span className="text-[9px] text-[#64748b] font-bold uppercase">đ</span>
                                         </div>
                                     </div>
                                 </div>

                                 {/* School Column (Desktop) */}
                                 <div className="md:col-span-3 text-xs text-[#64748b] truncate hidden md:block text-center px-1 min-w-0">
                                     {entry.school}
                                 </div>

                                 {/* Score & Stats Column (Desktop) / Sub-row on mobile */}
                                 <div className="md:col-span-4 flex items-center justify-between md:justify-end gap-2 sm:gap-2.5 pt-1 md:pt-0 border-t md:border-t-0 border-[#f1f5f9] min-w-0">
                                     <span className="text-[11px] text-[#64748b] truncate md:hidden">
                                         {entry.school}
                                     </span>

                                     <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] text-[#64748b] ml-auto md:ml-0 shrink-0">
                                         <span className="inline-flex items-center gap-1 bg-[#e0f2fe] px-2 py-0.5 rounded-md text-[#0284c7] font-medium text-[10px] sm:text-[11px]">
                                             <UploadCloud className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                             {entry.uploads}
                                         </span>
                                         <span className="inline-flex items-center gap-1 bg-[#fff1f2] px-2 py-0.5 rounded-md text-rose-600 font-medium text-[10px] sm:text-[11px]">
                                             <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                             {entry.likes}
                                         </span>
                                     </div>

                                     {/* Points on desktop */}
                                     <div className="text-right hidden md:flex items-center gap-1.5 shrink-0">
                                         <strong className="text-sm sm:text-base font-black text-[#0284c7]">
                                             {entry.points}
                                         </strong>
                                         <span className="text-[10px] text-[#64748b] font-bold uppercase">điểm</span>
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
