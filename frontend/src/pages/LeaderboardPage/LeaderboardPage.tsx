import { useState, useMemo, useEffect } from 'react';
import { MainLayout } from '../../components/layout';
import { Sparkles, Award, ArrowUpRight } from 'lucide-react';
import { leaderboardData, type LeaderboardEntry } from '../../data/leaderboard';
import { userService } from '../../services/userService';
import { authService } from '../../services/authService';
import { ScoreRulesBar } from './components/ScoreRulesBar';
import { UserRankBanner } from './components/UserRankBanner';
import { PodiumTop3 } from './components/PodiumTop3';
import { LeaderboardTable } from './components/LeaderboardTable';

type PeriodType = 'weekly' | 'monthly' | 'all-time';

export function LeaderboardPage() {
    const authUser = authService.getCurrentUser();
    const [period, setPeriod] = useState<PeriodType>('weekly');
    const [searchQuery, setSearchQuery] = useState('');
    const [apiEntries, setApiEntries] = useState<LeaderboardEntry[] | null>(null);

    useEffect(() => {
        let isMounted = true;
        userService.getLeaderboard(period, 20).then((res) => {
            if (!isMounted) return;
            if (res && Array.isArray(res.entries) && res.entries.length > 0) {
                const enriched = res.entries.map((entry) => {
                    const isMe =
                        Boolean(entry.isCurrentUser) ||
                        Boolean(
                            authUser &&
                                (entry.userId === authUser.id ||
                                    entry.handle.replace('@', '').toLowerCase() ===
                                        (authUser.username || '').replace('@', '').toLowerCase())
                        );
                    const cleanAvatar = (!entry.avatar || entry.avatar.includes('seed=Scholar'))
                        ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(entry.handle?.replace('@', '') || entry.name)}`
                        : entry.avatar;
                    return { ...entry, avatar: cleanAvatar, isCurrentUser: isMe };
                });
                setApiEntries(enriched);
            } else {
                setApiEntries(null);
            }
        });
        return () => {
            isMounted = false;
        };
    }, [period, authUser?.id, authUser?.username]);

    const currentEntries = apiEntries ?? (leaderboardData[period] || leaderboardData.weekly);

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
                {/* Header Banner - Solid elegant styling matching app theme */}
                <div className="bg-[#f8fafc] rounded-2xl border border-[#e2e8f0] p-6 sm:p-8 shadow-xs">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2 max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e0f2fe] text-[#0284c7] text-xs font-semibold">
                                <Sparkles className="w-3.5 h-3.5 text-[#0284c7]" />
                                <span>CÙNG NHAU TIẾN BỘ</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
                                Bảng Xếp Hạng Đóng Góp Học Thuật
                            </h1>
                            <p className="text-xs sm:text-sm text-[#64748b] leading-relaxed">
                                Vinh danh những sinh viên và nghiên cứu sinh tích cực chia sẻ tài liệu, bài giảng và hỗ
                                trợ cộng đồng học tập nhiều nhất.
                            </p>
                        </div>

                        {/* Quick Period Selector Buttons - Responsive */}
                        <div className="grid grid-cols-3 sm:flex bg-white p-1 rounded-xl border border-[#e2e8f0] shadow-xs w-full sm:w-auto shrink-0 gap-1">
                            <button
                                type="button"
                                onClick={() => setPeriod('weekly')}
                                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                                    period === 'weekly'
                                        ? 'bg-[#0284c7] text-white shadow-xs'
                                        : 'text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9]'
                                }`}
                            >
                                Tuần này
                            </button>
                            <button
                                type="button"
                                onClick={() => setPeriod('monthly')}
                                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                                    period === 'monthly'
                                        ? 'bg-[#0284c7] text-white shadow-xs'
                                        : 'text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9]'
                                }`}
                            >
                                Tháng này
                            </button>
                            <button
                                type="button"
                                onClick={() => setPeriod('all-time')}
                                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                                    period === 'all-time'
                                        ? 'bg-[#0284c7] text-white shadow-xs'
                                        : 'text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9]'
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
                <div className="p-4 sm:p-5 rounded-2xl bg-[#f0f9ff] border border-[#bae6fd] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#0369a1]">
                    <div className="flex items-center gap-3">
                        <Award className="w-6 h-6 text-[#0284c7] shrink-0" />
                        <div>
                            <strong className="block font-bold text-[#0f172a]">
                                Bảng xếp hạng cập nhật theo thời gian thực (Real-time)
                            </strong>
                            <p className="text-[11px] text-[#64748b] mt-0.5">
                                Điểm danh tiếng và thứ hạng được cập nhật ngay khi bạn đăng tải tài liệu, nhận lượt thích hoặc hoàn thành bài thi trắc nghiệm AI.
                            </p>
                        </div>
                    </div>

                    <a
                        href="/upload"
                        className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold rounded-xl text-xs transition-colors shrink-0 shadow-sm flex items-center gap-1.5"
                    >
                        <span>Tải tài liệu ngay</span>
                        <ArrowUpRight className="w-4 h-4" />
                    </a>
                </div>
            </div>
        </MainLayout>
    );
}
