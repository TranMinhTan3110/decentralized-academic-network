import { useState } from 'react';
import { UserPlus, UserCheck, Sparkles } from 'lucide-react';

interface SuggestedUser {
  id: string;
  name: string;
  role: string;
  avatar: string;
  followers: number;
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
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  const toggleFollow = (id: string) => {
    setFollowingMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <section className="people-to-follow bg-white border border-[#E2E8F0] rounded-xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#F1F5F9]">
        <Sparkles size={18} className="text-[#0284C7]" />
        <h3 className="font-bold text-[#0F172A] text-base">Gợi ý theo dõi</h3>
      </div>

      <div className="flex flex-col gap-4">
        {initialUsers.map((user) => {
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
                onClick={() => toggleFollow(user.id)}
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
