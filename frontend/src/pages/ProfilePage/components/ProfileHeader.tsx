import { Link } from 'react-router-dom';
import { Users, Star, Share2, UserPlus, UserCheck, GraduationCap, Calendar, Edit3 } from 'lucide-react';
import { Button } from '../../../components/ui';
import { Avatar } from '../../../components/ui/Avatar';

export interface UserProfileInfo {
    id?: string;
    name: string;
    username: string;
    avatarUrl?: string;
    avatarInitials: string;
    school: string;
    major: string;
    joinDate: string;
    bio: string;
    followers: number;
    following: number;
    reputation: number;
    verified: boolean;
}

interface ProfileHeaderProps {
    user: UserProfileInfo;
    isOwnProfile?: boolean;
    isFollowing: boolean;
    onToggleFollow: () => void;
    onShareProfile: () => void;
}

export function ProfileHeader({ user, isOwnProfile = false, isFollowing, onToggleFollow, onShareProfile }: ProfileHeaderProps) {
    return (
        <div className="bg-[#f8fafc] rounded-2xl border border-[#e2e8f0] p-4 sm:p-6 md:p-8 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
                {/* Avatar & User Details */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-5">
                    <div className="relative shrink-0">
                        <Avatar
                            avatar={user.avatarUrl}
                            name={user.name || user.avatarInitials}
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full text-2xl sm:text-3xl font-black shadow-sm ring-4 ring-white"
                        />
                    </div>

                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            <h1 className="text-2xl font-extrabold text-[#0f172a]">{user.name}</h1>
                            <span className="text-xs font-semibold text-[#64748b] bg-white border border-[#e2e8f0] px-2.5 py-0.5 rounded-lg">
                                {user.username.startsWith('@') ? user.username : `@${user.username}`}
                            </span>
                        </div>
                        {(user.school || user.major) && (
                            <p className="text-xs sm:text-sm font-semibold text-[#0284c7] flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                                <GraduationCap className="w-4 h-4 text-[#0284c7] shrink-0" />
                                {user.school && <span>{user.school}</span>}
                                {user.school && user.major && <span className="text-slate-300">•</span>}
                                {user.major && <span className="text-slate-600">{user.major}</span>}
                            </p>
                        )}
                        <p className="text-xs text-[#475569] leading-relaxed max-w-2xl pt-0.5">{user.bio || 'Chưa cập nhật tiểu sử.'}</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center sm:justify-start gap-2.5 shrink-0 w-full sm:w-auto">
                    {isOwnProfile ? (
                        <Link to="/settings" className="flex-1 sm:flex-initial">
                            <Button
                                type="button"
                                variant="secondary"
                                className="h-10 px-5 text-xs font-bold shadow-xs w-full sm:w-auto border border-[#cbd5e1] hover:bg-slate-100"
                                icon={<Edit3 className="w-4 h-4" />}
                            >
                                Chỉnh sửa hồ sơ
                            </Button>
                        </Link>
                    ) : (
                        <Button
                            type="button"
                            variant={isFollowing ? 'secondary' : 'primary'}
                            onClick={onToggleFollow}
                            className="h-10 px-6 text-xs font-bold shadow-xs flex-1 sm:flex-initial cursor-pointer"
                            icon={isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                        >
                            {isFollowing ? 'Đang theo dõi' : `Theo dõi ${user.name}`}
                        </Button>
                    )}

                    <button
                        type="button"
                        onClick={onShareProfile}
                        className="p-2.5 rounded-xl border border-[#cbd5e1] bg-white hover:bg-slate-50 text-[#475569] hover:text-[#0f172a] transition-all cursor-pointer shadow-xs shrink-0"
                        title="Chia sẻ hồ sơ"
                    >
                        <Share2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Bottom Meta & Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 sm:pt-5 mt-5 sm:mt-6 border-t border-[#e2e8f0] text-xs text-[#64748b]">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4">
                    <span className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
                        Tham gia {user.joinDate}
                    </span>
                </div>

                <div className="grid grid-cols-3 divide-x divide-[#e2e8f0] sm:flex sm:items-center sm:divide-x sm:divide-[#cbd5e1] sm:justify-end text-xs w-full sm:w-auto py-1">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 px-1 sm:px-0 sm:pr-4 text-center sm:text-left">
                        <Users className="w-4 h-4 text-[#0284c7] shrink-0" />
                        <span className="leading-tight">
                            <strong className="text-sm font-bold text-[#0f172a] block sm:inline">{user.followers}</strong>{' '}
                            <span className="text-[11px] sm:text-xs text-[#64748b] block sm:inline">người theo dõi</span>
                        </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 px-1 sm:px-4 text-center sm:text-left">
                        <Users className="w-4 h-4 text-[#64748b] shrink-0" />
                        <span className="leading-tight">
                            <strong className="text-sm font-bold text-[#0f172a] block sm:inline">{user.following}</strong>{' '}
                            <span className="text-[11px] sm:text-xs text-[#64748b] block sm:inline">đang theo dõi</span>
                        </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 px-1 sm:px-0 sm:pl-4 text-center sm:text-left">
                        <Star className="w-4 h-4 text-[#e11d48] shrink-0" />
                        <span className="leading-tight">
                            <strong className="text-sm font-bold text-[#0f172a] block sm:inline">{user.reputation}</strong>{' '}
                            <span className="text-[11px] sm:text-xs text-[#64748b] block sm:inline">điểm uy tín</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
