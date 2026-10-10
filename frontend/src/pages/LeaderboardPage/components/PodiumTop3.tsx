import { Trophy, Crown, Heart } from 'lucide-react';
import { Avatar } from '../../../components/ui';
import type { LeaderboardEntry } from '../../../data/leaderboard';

interface PodiumItemProps {
    rank: 1 | 2 | 3;
    entry?: LeaderboardEntry;
}

const PODIUM_CONFIG = {
    1: {
        badge: '#1 Bá Khí',
        crownColor: 'text-amber-500 fill-amber-200',
        ringGradient: 'from-amber-300 via-amber-400 to-yellow-500 shadow-amber-500/20 ring-4 ring-amber-400/30',
        badgeBg: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white border-amber-200',
        titleBg: 'text-amber-800 bg-amber-100 border-amber-300',
        pedestalBg: 'bg-gradient-to-b from-amber-50 via-amber-100 to-yellow-200 border-amber-300',
        pointsColor: 'text-amber-700',
        subTextColor: 'text-amber-600',
        statsBg: 'text-amber-900 bg-white/80 border-amber-200',
        height: 'h-40 sm:h-48',
        avatarSize: 'w-20 h-20 sm:w-24 sm:h-24',
        containerMaxW: 'max-w-[180px] sm:max-w-[220px]',
        animDuration: '2.5s',
        isCenter: true,
    },
    2: {
        badge: '#2',
        crownColor: 'text-slate-400 fill-slate-100',
        ringGradient: 'from-slate-300 to-slate-400',
        badgeBg: 'bg-slate-700 text-white border-slate-300',
        titleBg: 'text-slate-600 bg-slate-100 border-slate-300',
        pedestalBg: 'bg-gradient-to-b from-slate-100 to-slate-200 border-slate-300',
        pointsColor: 'text-slate-700',
        subTextColor: 'text-slate-500',
        statsBg: 'text-slate-600 bg-white/70 border-slate-200',
        height: 'h-32 sm:h-36',
        avatarSize: 'w-16 h-16 sm:w-20 sm:h-20',
        containerMaxW: 'max-w-[160px] sm:max-w-[200px]',
        animDuration: '3s',
        isCenter: false,
    },
    3: {
        badge: '#3',
        crownColor: 'text-amber-700 fill-amber-100',
        ringGradient: 'from-amber-600 to-amber-800',
        badgeBg: 'bg-amber-800 text-white border-amber-300',
        titleBg: 'text-amber-900 bg-amber-50 border-amber-300',
        pedestalBg: 'bg-gradient-to-b from-amber-100/60 to-amber-200/80 border-amber-300',
        pointsColor: 'text-amber-800',
        subTextColor: 'text-amber-700',
        statsBg: 'text-amber-900 bg-white/70 border-amber-200',
        height: 'h-28 sm:h-32',
        avatarSize: 'w-16 h-16 sm:w-20 sm:h-20',
        containerMaxW: 'max-w-[160px] sm:max-w-[200px]',
        animDuration: '3.5s',
        isCenter: false,
    },
};

export function PodiumItem({ rank, entry }: PodiumItemProps) {
    if (!entry) return null;

    const config = PODIUM_CONFIG[rank];

    return (
        <div
            className={`flex flex-col items-center w-full ${config.containerMaxW} ${config.isCenter ? 'z-10' : ''} group`}
        >
            <div className="relative flex flex-col items-center mb-3">
                <Crown
                    className={`w-7 h-7 sm:w-8 sm:h-8 ${config.crownColor} mb-1 drop-shadow-md animate-bounce`}
                    style={{ animationDuration: config.animDuration }}
                />

                <div className={`p-1 rounded-full bg-gradient-to-b ${config.ringGradient} shadow-md`}>
                    <Avatar
                        name={entry.name}
                        avatar={entry.avatar}
                        className={`${config.avatarSize} border-2 border-white text-base sm:text-lg`}
                    />
                </div>

                <span
                    className={`absolute -bottom-2 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm border ${config.badgeBg}`}
                >
                    {config.badge}
                </span>
            </div>

            <strong className="text-xs sm:text-sm font-bold text-[#121827] text-center mt-2 truncate w-full">
                {entry.name}
            </strong>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md mt-1 mb-2 border ${config.titleBg}`}>
                {entry.title}
            </span>

            <div
                className={`w-full ${config.height} ${config.pedestalBg} border border-b-0 rounded-t-2xl p-3 flex flex-col items-center justify-center text-center shadow-inner transition-transform group-hover:-translate-y-1`}
            >
                <strong className={`text-xl sm:text-2xl font-black ${config.pointsColor}`}>{entry.points}</strong>
                <span className={`text-[11px] font-medium ${config.subTextColor} uppercase tracking-wider`}>điểm</span>

                <div
                    className={`flex items-center gap-2 mt-2 text-[10px] font-medium px-2 py-1 rounded-lg border ${config.statsBg}`}
                >
                    <span>{entry.uploads} bài</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-rose-500 font-semibold animate-pulse">
                        <Heart className="w-3 h-3" />
                        {entry.likes}
                    </span>
                </div>
            </div>
        </div>
    );
}

interface PodiumTop3Props {
    top3: {
        first?: LeaderboardEntry;
        second?: LeaderboardEntry;
        third?: LeaderboardEntry;
    };
    period: 'weekly' | 'monthly' | 'all-time';
}

export function PodiumTop3({ top3, period }: PodiumTop3Props) {
    return (
        <div className="pt-6 pb-2">
            <div className="text-center mb-6">
                <h2 className="text-lg font-extrabold text-[#121827] flex items-center justify-center gap-2">
                    <Trophy className="w-5 h-5 text-[#ee964b]" />
                    <span>Top 3 Đóng Góp Xuất Sắc</span>
                </h2>
                <p className="text-xs text-[#5f6878] mt-1">
                    Những gương mặt dẫn đầu cuộc đua tri thức{' '}
                    {period === 'weekly' ? 'tuần này' : period === 'monthly' ? 'tháng này' : 'toàn thời gian'}
                </p>
            </div>

            <div className="flex justify-center items-end gap-3 sm:gap-6 px-2 min-h-[340px]">
                {/* Rank 2 - Silver (Left) */}
                <PodiumItem rank={2} entry={top3.second} />

                {/* Rank 1 - Gold (Center) */}
                <PodiumItem rank={1} entry={top3.first} />

                {/* Rank 3 - Bronze (Right) */}
                <PodiumItem rank={3} entry={top3.third} />
            </div>
        </div>
    );
}
