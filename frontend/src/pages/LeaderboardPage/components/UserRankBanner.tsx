import { Flame } from 'lucide-react';
import { Avatar } from '../../../components/ui';
import type { LeaderboardEntry } from '../../../data/leaderboard';

interface UserRankBannerProps {
    currentUserEntry?: LeaderboardEntry;
    nextRankUser?: LeaderboardEntry;
    pointsToNextRank: number;
}

export function UserRankBanner({ currentUserEntry, nextRankUser, pointsToNextRank }: UserRankBannerProps) {
    if (!currentUserEntry) return null;

    return (
        <div className="bg-gradient-to-r from-[#315dff]/10 via-[#315dff]/5 to-transparent border-2 border-[#315dff]/30 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative">
                    <Avatar name={currentUserEntry.name} avatar={currentUserEntry.avatar} size="lg" />
                    <span className="absolute -bottom-1 -right-1 bg-[#315dff] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white">
                        #{currentUserEntry.rank}
                    </span>
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#121827]">{currentUserEntry.name}</span>
                        <span className="px-2 py-0.5 rounded-md bg-[#315dff] text-white text-[10px] font-bold">
                            Bạn
                        </span>
                    </div>
                    <p className="text-[11px] text-[#5f6878]">
                        Thứ hạng hiện tại: <strong className="text-[#315dff]">#{currentUserEntry.rank}</strong> với{' '}
                        <strong className="text-[#121827]">{currentUserEntry.points} điểm</strong>
                    </p>
                </div>
            </div>

            {nextRankUser && pointsToNextRank > 0 && (
                <div className="w-full sm:w-auto flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-[#d8deea] shadow-2xs">
                    <Flame className="w-5 h-5 text-[#ee964b] shrink-0 animate-pulse" />
                    <div className="text-xs">
                        <span className="text-[#5f6878]">Cần thêm </span>
                        <strong className="text-[#315dff] font-extrabold">{pointsToNextRank} điểm</strong>
                        <span className="text-[#5f6878]"> để vượt vị trí </span>
                        <strong className="text-[#121827]">
                            #{nextRankUser.rank} ({nextRankUser.name})
                        </strong>
                    </div>
                </div>
            )}
        </div>
    );
}
