import { useState, useEffect } from 'react';
import { UserPlus, UserCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { userService } from '../services/userService';
import { authService } from '../services/authService';

interface SuggestedUser {
  id: string;
  username?: string;
  name: string;
  role: string;
  avatar: string;
  followers: number;
  isBackendUser?: boolean;
}

const initialUsers: SuggestedUser[] = [
  {
    id: 'user-1',
    name: 'PGS. TS Lê Hoài Nam',
    role: 'Khoa CNTT - ĐH Bách Khoa',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    followers: 1420,
  },
  {
    id: 'user-2',
    name: 'ThS. Nguyễn Thị Mỹ Linh',
    role: 'Nghiên cứu sinh Khoa Học Dữ Liệu',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    followers: 890,
  },
  {
    id: 'user-3',
    name: 'Vũ Quốc Khánh',
    role: 'Tác giả 15+ Ghi Chép Toán Cao Cấp',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    followers: 650,
  },
];

export function PeopleToFollow() {
  const [users, setUsers] = useState<SuggestedUser[]>(initialUsers);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
    if (isTestEnv) return;

    userService
      .getSuggestedUsers(5)
      .then((res) => {
        if (!active || !Array.isArray(res) || res.length === 0) return;
        const mapped: SuggestedUser[] = res.map((u) => {
          const fullName = u.fullName || u.name || u.username || 'Thành viên';
          const badgeText = u.badge || u.role || 'Học giả';
          const schoolText = (u as any).universityName || '';
          return {
            id: String(u.id || u.username || fullName),
            username: u.username,
            name: fullName,
            role: schoolText ? `${badgeText} • ${schoolText}` : badgeText,
            avatar:
              u.avatarUrl ||
              u.avatar ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.username || fullName)}`,
            followers: u.points ?? u.reputationPoints ?? 0,
            isBackendUser: true,
          };
        });
        setUsers(mapped);
      })
      .catch(() => {
        // Keep initial fallback list if user-service is unreachable
      });

    return () => {
      active = false;
    };
  }, []);

  const toggleFollow = async (user: SuggestedUser) => {
    const nextState = !followingMap[user.id];
    setFollowingMap((prev) => ({
      ...prev,
      [user.id]: nextState,
    }));

    if (user.isBackendUser) {
      if (!authService.isAuthenticated()) {
        setFollowingMap((prev) => ({
          ...prev,
          [user.id]: !nextState,
        }));
        toast.error('Vui lòng đăng nhập để theo dõi học giả này.');
        return;
      }
      try {
        const res = await userService.toggleFollow(user.username || user.id);
        setFollowingMap((prev) => ({
          ...prev,
          [user.id]: Boolean(res.isFollowing),
        }));
      } catch (err: any) {
        setFollowingMap((prev) => ({
          ...prev,
          [user.id]: !nextState,
        }));
        toast.error(err?.message || 'Không thể cập nhật trạng thái theo dõi.');
      }
    }
  };

  return (
    <section className="people-to-follow bg-white border border-[#E6E8F0] rounded-2xl p-5 shadow-2xs">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#F1F5F9]">
        <div className="w-7 h-7 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
          <Sparkles size={15} />
        </div>
        <h3 className="font-bold text-[#0F172A] text-sm">Gợi ý theo dõi</h3>
      </div>

      <div className="flex flex-col gap-3.5">
        {users.map((user) => {
          const isFollowing = !!followingMap[user.id];
          const profileLink = `/profile/${(user.username || user.id).replace('@', '')}`;
          return (
            <div key={user.id} className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <Link to={profileLink} className="shrink-0 hover:opacity-90 transition-opacity">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-[#EEF2FF]"
                  />
                </Link>
                <div className="truncate">
                  <Link
                    to={profileLink}
                    className="text-xs sm:text-sm font-semibold text-[#0F172A] hover:text-[#4F46E5] transition-colors truncate leading-tight block"
                  >
                    {user.name}
                  </Link>
                  <p className="text-[11px] text-[#64748B] truncate leading-tight mt-0.5">{user.role}</p>
                </div>
              </div>

              <button
                onClick={() => toggleFollow(user)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold shrink-0 transition-all cursor-pointer border ${
                  isFollowing
                    ? 'bg-[#F6F7FB] text-[#475569] border-[#E2E8F0] hover:bg-[#E2E8F0]'
                    : 'bg-[#EEF2FF] text-[#4F46E5] border-[#E0E7FF] hover:bg-[#4F46E5] hover:text-white hover:border-[#4F46E5]'
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck size={14} /> Đang theo dõi
                  </>
                ) : (
                  <>
                    <UserPlus size={14} /> Theo dõi
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
