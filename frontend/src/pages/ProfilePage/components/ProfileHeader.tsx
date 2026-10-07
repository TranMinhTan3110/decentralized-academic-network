import { Users, Star, Share2, UserPlus, UserCheck, GraduationCap, MapPin, Calendar, ShieldCheck } from 'lucide-react';
import { Button } from '../../../components/ui';

export interface UserProfileInfo {
    name: string;
    username: string;
    avatarInitials: string;
    school: string;
    major: string;
    location: string;
    joinDate: string;
    bio: string;
    followers: number;
    following: number;
    reputation: number;
    verified: boolean;
}

interface ProfileHeaderProps {
    user: UserProfileInfo;
    isFollowing: boolean;
    onToggleFollow: () => void;
    onShareProfile: () => void;
}

export function ProfileHeader({ user, isFollowing, onToggleFollow, onShareProfile }: ProfileHeaderProps) {
    return (
        <div className="bg-[#f8fafc] rounded-2xl border border-[#e2e8f0] p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Avatar & User Details */}
                <div className="flex items-center gap-5">
                    <div className="relative shrink-0">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#0284c7] text-white flex items-center justify-center text-3xl font-black shadow-sm">
                            {user.avatarInitials}
                        </div>
                        {/* {user.verified && (
              <div
                className="absolute -bottom-1 -right-1 bg-sky-500 text-white p-1 rounded-full border-2 border-white shadow-xs"
                title="Tài khoản đã xác thực"
              >
                <ShieldCheck className="w-4 h-4" />
              </div>
            )} */}
                    </div>

                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-extrabold text-[#0f172a]">{user.name}</h1>
                            <span className="text-xs font-semibold text-[#64748b] bg-white border border-[#e2e8f0] px-2.5 py-0.5 rounded-lg">
                                {user.username}
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-[#0284c7] flex items-center gap-1.5">
                            <GraduationCap className="w-4 h-4 text-[#0284c7] shrink-0" />
                            <span>{user.school}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-600">{user.major}</span>
                        </p>
                        <p className="text-xs text-[#475569] leading-relaxed max-w-2xl pt-0.5">{user.bio}</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2.5 shrink-0">
                    <Button
                        type="button"
                        variant={isFollowing ? 'secondary' : 'primary'}
                        onClick={onToggleFollow}
                        className="h-10 px-6 text-xs font-bold shadow-xs"
                        icon={isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    >
                        {isFollowing ? 'Đang theo dõi' : `Theo dõi ${user.name}`}
                    </Button>

                    <button
                        type="button"
                        onClick={onShareProfile}
                        className="p-2.5 rounded-xl border border-[#cbd5e1] bg-white hover:bg-slate-50 text-[#475569] hover:text-[#0f172a] transition-all cursor-pointer shadow-xs"
                        title="Chia sẻ hồ sơ"
                    >
                        <Share2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Bottom Meta & Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-5 mt-6 border-t border-[#e2e8f0] text-xs text-[#64748b]">
                <div className="flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1.5 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-[#0284c7]" />
                        {user.location}
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-[#0284c7]" />
                        Tham gia {user.joinDate}
                    </span>
                </div>

                <div className="flex items-center gap-5">
                    <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-[#0284c7]" />
                        <span>
                            <strong className="text-sm font-bold text-[#0f172a]">{user.followers}</strong> người theo
                            dõi
                        </span>
                    </div>
                    <div className="w-px h-4 bg-[#cbd5e1]" />
                    <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-[#64748b]" />
                        <span>
                            <strong className="text-sm font-bold text-[#0f172a]">{user.following}</strong> đang theo dõi
                        </span>
                    </div>
                    <div className="w-px h-4 bg-[#cbd5e1]" />
                    <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-[#e11d48]" />
                        <span>
                            <strong className="text-sm font-bold text-[#0f172a]">{user.reputation}</strong> điểm uy tín
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
