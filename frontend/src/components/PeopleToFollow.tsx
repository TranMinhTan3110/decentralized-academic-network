import { useState, useEffect } from 'react';
import { UserPlus, UserCheck, Sparkles } from 'lucide-react';
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
    <section className="people-to-follow bg-white border border-[#E2E8F0] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#F1F5F9]">
        <Sparkles size={18} className="text-[#0284C7]" />
        <h3 className="font-bold text-[#0F172A] text-base">Gợi ý theo dõi</h3>
      </div>

      <div className="flex flex-col gap-4">
        {users.map((user) => {
          const isFollowing = !!followingMap[user.id];
          return (
            <div key={user.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover border border-[#E2E8F0] shrink-0"
                />
                <div className="truncate">
                  <h4 className="text-sm font-semibold text-[#1E293B] truncate leading-tight">{user.name}</h4>
                  <p className="text-xs text-[#64748B] truncate leading-tight">{user.role}</p>
                </div>
              </div>

              <button
                onClick={() => toggleFollow(user)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer border ${
                  isFollowing
                    ? 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1] hover:bg-[#E2E8F0]'
                    : 'bg-[#0284C7] text-white border-transparent hover:bg-[#0369A1]'
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
