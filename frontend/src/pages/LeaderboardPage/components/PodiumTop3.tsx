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
        ringColor: 'ring-4 ring-amber-400 bg-amber-400 shadow-sm',
        badgeBg: 'bg-amber-500 text-white border-amber-300',
        titleBg: 'text-amber-800 bg-amber-100 border-amber-300',
        pedestalBg: 'bg-[#fef9c3] border-amber-300',
        pointsColor: 'text-amber-900',
        subTextColor: 'text-amber-700',
        statsBg: 'text-amber-950 bg-white/90 border-amber-200',
        height: 'h-36 sm:h-44 md:h-48',
        avatarSize: 'w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24',
        containerMaxW: 'max-w-[130px] sm:max-w-[190px] md:max-w-[220px]',
        animDuration: '2.5s',
        isCenter: true,
    },
    2: {
        badge: '#2',
        crownColor: 'text-slate-400 fill-slate-200',
        ringColor: 'ring-4 ring-slate-300 bg-slate-300 shadow-sm',
        badgeBg: 'bg-slate-600 text-white border-slate-400',
        titleBg: 'text-slate-700 bg-slate-100 border-slate-300',
        pedestalBg: 'bg-[#f1f5f9] border-slate-300',
        pointsColor: 'text-slate-900',
        subTextColor: 'text-slate-600',
        statsBg: 'text-slate-800 bg-white/90 border-slate-200',
        height: 'h-28 sm:h-34 md:h-36',
        avatarSize: 'w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20',
        containerMaxW: 'max-w-[115px] sm:max-w-[170px] md:max-w-[190px]',
        animDuration: '3s',
        isCenter: false,
    },
    3: {
        badge: '#3',
        crownColor: 'text-amber-700 fill-amber-200',
        ringColor: 'ring-4 ring-amber-600 bg-amber-600 shadow-sm',
        badgeBg: 'bg-amber-700 text-white border-amber-600',
        titleBg: 'text-amber-900 bg-amber-100/70 border-amber-300',
        pedestalBg: 'bg-[#ffedd5] border-amber-300',
        pointsColor: 'text-amber-950',
        subTextColor: 'text-amber-800',
        statsBg: 'text-amber-950 bg-white/90 border-amber-200',
        height: 'h-24 sm:h-28 md:h-32',
        avatarSize: 'w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20',
        containerMaxW: 'max-w-[115px] sm:max-w-[170px] md:max-w-[190px]',
        animDuration: '3.5s',
        isCenter: false,
    },
};

export function PodiumItem({ rank, entry }: PodiumItemProps) {
    if (!entry) return null;

    const config = PODIUM_CONFIG[rank];

    return (
        <div
            className={`flex flex-col items-center flex-1 w-0 ${config.containerMaxW} ${config.isCenter ? 'z-10' : ''} group`}
        >
            <div className="relative flex flex-col items-center mb-3">
                <Crown
                    className={`w-6 h-6 sm:w-8 sm:h-8 ${config.crownColor} mb-1 drop-shadow-xs animate-bounce`}
                    style={{ animationDuration: config.animDuration }}
                />

                <div className={`p-1 rounded-full ${config.ringColor}`}>
                    <Avatar
                        name={entry.name}
                        avatar={entry.avatar}
                        className={`${config.avatarSize} border-2 border-white text-xs sm:text-base md:text-lg`}
                    />
                </div>

                <span
                    className={`absolute -bottom-2 text-[10px] sm:text-[11px] font-extrabold px-1.5 sm:px-2.5 py-0.5 rounded-full shadow-xs border ${config.badgeBg} whitespace-nowrap`}
                >
                    {rank === 1 ? (
                        <>
                            <span>#1</span>
                            <span className="hidden sm:inline"> Bá Khí</span>
                        </>
                    ) : (
                        config.badge
                    )}
                </span>
            </div>

            <strong className="text-[11px] sm:text-xs md:text-sm font-bold text-[#0f172a] text-center mt-2 truncate w-full px-1">
                {entry.name}
            </strong>
            <span className={`text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-md mt-1 mb-2 border ${config.titleBg} truncate max-w-full`}>
                {entry.title}
            </span>

            <div
                className={`w-full ${config.height} ${config.pedestalBg} border border-b-0 rounded-t-2xl p-1.5 sm:p-3 flex flex-col items-center justify-center text-center shadow-xs transition-transform group-hover:-translate-y-1`}
            >
                <strong className={`text-base sm:text-xl md:text-2xl font-black ${config.pointsColor}`}>{entry.points}</strong>
                <span className={`text-[9px] sm:text-[11px] font-medium ${config.subTextColor} uppercase tracking-wider`}>điểm</span>

                <div
                    className={`flex items-center justify-center gap-1 sm:gap-2 mt-1.5 sm:mt-2 text-[9px] sm:text-[10px] font-medium px-1 sm:px-2 py-0.5 sm:py-1 rounded-lg border ${config.statsBg} max-w-full truncate`}
                >
                    <span>{entry.uploads}<span className="hidden min-[400px]:inline"> bài</span></span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5 sm:gap-1 text-rose-500 font-semibold animate-pulse">
                        <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
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
        <div className="pt-4 sm:pt-6 pb-2">
            <div className="text-center mb-6">
                <h2 className="text-lg font-extrabold text-[#0f172a] flex items-center justify-center gap-2">
                    <Trophy className="w-5 h-5 text-[#ea580c]" />
                    <span>Top 3 Đóng Góp Xuất Sắc</span>
                </h2>
                <p className="text-xs text-[#64748b] mt-1">
                    Những gương mặt dẫn đầu cuộc đua tri thức{' '}
                    {period === 'weekly' ? 'tuần này' : period === 'monthly' ? 'tháng này' : 'toàn thời gian'}
                </p>
            </div>

            <div className="flex justify-center items-end gap-2 sm:gap-4 md:gap-6 px-1 sm:px-2 min-h-[300px] sm:min-h-[340px]">
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
