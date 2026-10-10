import { useState, useMemo } from 'react';
import { MainLayout } from '../../components/layout';
import { Sparkles, Award, ArrowUpRight } from 'lucide-react';
import { leaderboardData } from '../../data/leaderboard';
import { ScoreRulesBar } from './components/ScoreRulesBar';
import { UserRankBanner } from './components/UserRankBanner';
import { PodiumTop3 } from './components/PodiumTop3';
import { LeaderboardTable } from './components/LeaderboardTable';

type PeriodType = 'weekly' | 'monthly' | 'all-time';

export function LeaderboardPage() {
    const [period, setPeriod] = useState<PeriodType>('weekly');
    const [searchQuery, setSearchQuery] = useState('');

    const currentEntries = leaderboardData[period] || leaderboardData.weekly;

    // Filtered entries based on search query
    const filteredEntries = useMemo(() => {
        if (!searchQuery.trim()) return currentEntries;
        const q = searchQuery.toLowerCase();
        return currentEntries.filter(
            (item) =>
                item.name.toLowerCase().includes(q) ||
                item.handle.toLowerCase().includes(q) ||
                item.school.toLowerCase().includes(q)
        );
    }, [currentEntries, searchQuery]);

    // Top 3 Podium entries
    const top3 = useMemo(() => {
        const first = currentEntries.find((e) => e.rank === 1);
        const second = currentEntries.find((e) => e.rank === 2);
        const third = currentEntries.find((e) => e.rank === 3);
        return { first, second, third };
    }, [currentEntries]);

    // Current logged in user status in current period
    const currentUserEntry = useMemo(() => {
        return currentEntries.find((e) => e.isCurrentUser);
    }, [currentEntries]);

    // Calculate points needed for user to reach next rank
    const nextRankUser = useMemo(() => {
        if (!currentUserEntry || currentUserEntry.rank <= 1) return null;
        return currentEntries.find((e) => e.rank === currentUserEntry.rank - 1);
    }, [currentEntries, currentUserEntry]);

    const pointsToNextRank = nextRankUser && currentUserEntry ? nextRankUser.points - currentUserEntry.points + 1 : 0;

    return (
        <MainLayout>
            <div className="max-w-[1100px] mx-auto space-y-6 pb-12">
                {/* Header Banner */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#14213d] via-[#1f3a5f] to-[#3d5a80] p-6 sm:p-8 text-white shadow-lg">
                    {/* Background glow effects */}
                    <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#ee964b]/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute left-1/3 -top-10 w-48 h-48 bg-[#315dff]/30 rounded-full blur-2xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2 max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#ee964b] text-xs font-semibold backdrop-blur-md border border-white/10">
                                <Sparkles className="w-3.5 h-3.5 text-[#ee964b]" />
                                <span>CÙNG NHAU TIẾN BỘ</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                Bảng Xếp Hạng Đóng Góp Học Thuật
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                Vinh danh những sinh viên và nghiên cứu sinh tích cực chia sẻ tài liệu, bài giảng và hỗ
                                trợ cộng đồng học tập nhiều nhất.
                            </p>
                        </div>

                        {/* Quick Period Selector Buttons */}
                        <div className="flex bg-[#0f172a]/60 p-1.5 rounded-xl border border-white/10 backdrop-blur-md self-start md:self-auto shrink-0">
                            <button
                                type="button"
                                onClick={() => setPeriod('weekly')}
                                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                    period === 'weekly'
                                        ? 'bg-[#315dff] text-white shadow-md'
                                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                Tuần này
                            </button>
                            <button
                                type="button"
                                onClick={() => setPeriod('monthly')}
                                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                    period === 'monthly'
                                        ? 'bg-[#315dff] text-white shadow-md'
                                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                Tháng này
                            </button>
                            <button
                                type="button"
                                onClick={() => setPeriod('all-time')}
                                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                    period === 'all-time'
                                        ? 'bg-[#315dff] text-white shadow-md'
                                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                Tất cả thời gian
                            </button>
                        </div>
                    </div>
                </div>

                {/* Score Rules Breakdown Box */}
                <ScoreRulesBar />

                {/* Current User Live Status Banner */}
                <UserRankBanner
                    currentUserEntry={currentUserEntry}
                    nextRankUser={nextRankUser}
                    pointsToNextRank={pointsToNextRank}
                />

                {/* TOP 3 PODIUM SECTION */}
                <PodiumTop3 top3={top3} period={period} />

                {/* FULL LEADERBOARD TABLE SECTION */}
                <LeaderboardTable
                    filteredEntries={filteredEntries}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                />

                {/* Footer Notice Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#fff7ed] border border-[#ffedd5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#c2410c]">
                    <div className="flex items-center gap-3">
                        <Award className="w-6 h-6 text-[#ea580c] shrink-0" />
                        <div>
                            <strong className="block font-bold text-[#9a3412]">
                                Bảng xếp hạng cập nhật mỗi 24 giờ
                            </strong>
                            <p className="text-[11px] text-[#c2410c]/90 mt-0.5">
                                Chia sẻ thêm tài liệu chất lượng và nhận phản hồi từ cộng đồng để tích lũy điểm thưởng!
                            </p>
                        </div>
                    </div>

                    <a
                        href="/upload"
                        className="px-4 py-2 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold rounded-xl text-xs transition-colors shrink-0 shadow-sm flex items-center gap-1.5"
                    >
                        <span>Tải tài liệu ngay</span>
                        <ArrowUpRight className="w-4 h-4" />
                    </a>
                </div>
            </div>
        </MainLayout>
    );
}
