import { Flame } from 'lucide-react';
import { Avatar } from '../../../components/ui';
import type { LeaderboardEntry } from '../../../data/leaderboard';

interface UserRankBannerProps {
    currentUserEntry?: LeaderboardEntry | null;
    nextRankUser?: LeaderboardEntry | null;
    pointsToNextRank: number;
}

export function UserRankBanner({ currentUserEntry, nextRankUser, pointsToNextRank }: UserRankBannerProps) {
    if (!currentUserEntry) return null;

    return (
        <div className="bg-[#f0f9ff] border border-[#bae6fd] p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative shrink-0">
                    <Avatar name={currentUserEntry.name} avatar={currentUserEntry.avatar} size="lg" />
                    <span className="absolute -bottom-1 -right-1 bg-[#0284c7] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white">
                        #{currentUserEntry.rank}
                    </span>
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#0f172a]">{currentUserEntry.name}</span>
                        <span className="px-2 py-0.5 rounded-md bg-[#0284c7] text-white text-[10px] font-bold">
                            Bạn
                        </span>
                    </div>
                    <p className="text-[11px] text-[#64748b] mt-0.5">
                        Thứ hạng hiện tại: <strong className="text-[#0284c7]">#{currentUserEntry.rank}</strong> với{' '}
                        <strong className="text-[#0f172a]">{currentUserEntry.points} điểm</strong>
                    </p>
                </div>
            </div>

            {nextRankUser && pointsToNextRank > 0 && (
                <div className="w-full sm:w-auto flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-[#bae6fd] shadow-xs">
                    <Flame className="w-5 h-5 text-[#ea580c] shrink-0 animate-pulse" />
                    <div className="text-xs">
                        <span className="text-[#64748b]">Cần thêm </span>
                        <strong className="text-[#0284c7] font-extrabold">{pointsToNextRank} điểm</strong>
                        <span className="text-[#64748b]"> để vượt vị trí </span>
                        <strong className="text-[#0f172a]">
                            #{nextRankUser.rank} ({nextRankUser.name})
                        </strong>
                    </div>
                </div>
            )}
        </div>
    );
}
