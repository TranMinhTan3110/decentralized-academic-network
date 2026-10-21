import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MainLayout } from '../../components/layout';
import { BookOpen, FileText, Search, Bookmark, Award } from 'lucide-react';
import { toast } from 'sonner';
import { documents } from '../../data/documents';
import { DocumentGrid } from '../../components/ui';
import { ProfileHeader, AchievementsTab } from './components';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import type { BadgeDto } from '../../services/authService';

export function ProfilePage() {
  const { username } = useParams<{ username?: string }>();
  const { userDto: authUser, isAuthenticated } = useAuth();

  const isViewingOtherUser = useMemo(() => {
    if (!username) return false;
    if (!authUser) return true;
    const cleanParam = username.startsWith('@') ? username.slice(1).toLowerCase() : username.toLowerCase();
    return (
      cleanParam !== authUser.username?.toLowerCase() &&
      cleanParam !== authUser.id?.toLowerCase()
    );
  }, [username, authUser]);

  const isOwnProfile = !isViewingOtherUser && Boolean(authUser);

  const [activeTab, setActiveTab] = useState<'shared' | 'saved' | 'achievements'>('shared');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [badges, setBadges] = useState<BadgeDto[]>([]);

  // Default initial profile (Lan Chi sample as reliable fallback)
  const [userProfile, setUserProfile] = useState({
    id: '66666666-6666-6666-6666-000000000001',
    name: 'Lan Chi',
    username: '@lanchi_hust',
    avatarUrl: undefined as string | undefined,
    avatarInitials: 'LC',
    school: 'Đại học Bách khoa Hà Nội',
    major: 'Khoa học Máy tính',
    joinDate: 'Tháng 09/2024',
    bio: 'Đam mê nghiên cứu Thuật toán, Trí tuệ nhân tạo và Chia sẻ tài liệu học thuật cho cộng đồng sinh viên.',
    followers: 154,
    following: 38,
    reputation: 1540,
    verified: true,
  });

  // Load profile data from Backend
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (isOwnProfile) {
        if (isAuthenticated) {
          try {
            const data = await userService.getProfile();
            if (!isMounted) return;
            setUserProfile({
              id: data.id,
              name: data.fullName || 'Người dùng',
              username: data.username || 'user',
              avatarUrl: data.avatarUrl,
              avatarInitials: data.avatarText || data.fullName?.slice(0, 2).toUpperCase() || 'SC',
              school: data.universityName || 'Mạng học thuật DeDocu',
              major: data.major || 'Chưa cập nhật chuyên ngành',
              joinDate: data.createdAt ? new Date(data.createdAt).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' }) : 'Mới tham gia',
              bio: data.bio || 'Chào mừng bạn đến với trang cá nhân của tôi trên DeDocu!',
              followers: data.followerCount ?? 0,
              following: data.followingCount ?? 0,
              reputation: data.reputationPoints ?? 0,
              verified: Boolean(data.isVerified),
            });
            if (data.badges) {
              setBadges(data.badges);
            }
          } catch {
            // Use session user as fallback if offline
            if (authUser && isMounted) {
              setUserProfile((prev) => ({
                ...prev,
                name: authUser.fullName,
                username: authUser.username,
                avatarUrl: authUser.avatarUrl,
                avatarInitials: authUser.avatarText || 'SC',
                school: authUser.universityName || prev.school,
                major: authUser.major || prev.major,
                bio: authUser.bio || prev.bio,
              }));
            }
          }
        }
      } else if (username) {
        try {
          const target = await userService.getPublicProfile(username);
          if (!isMounted) return;
          setUserProfile({
            id: target.id,
            name: target.fullName || target.username,
            username: target.username,
            avatarUrl: target.avatarUrl,
            avatarInitials: target.avatarText || target.fullName?.slice(0, 2).toUpperCase() || 'SC',
            school: target.universityName || 'Đại học Bách khoa Hà Nội',
            major: target.major || 'Khoa học Máy tính',
            joinDate: target.createdAt ? new Date(target.createdAt).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' }) : 'Tháng 09/2024',
            bio: target.bio || 'Đam mê nghiên cứu và chia sẻ tài liệu học thuật cho cộng đồng sinh viên.',
            followers: target.followerCount ?? 154,
            following: target.followingCount ?? 38,
            reputation: target.reputationPoints ?? 1540,
            verified: Boolean(target.isVerified),
          });
          if (target.badges) {
            setBadges(target.badges);
          }

          if (isAuthenticated) {
            const followStatus = await userService.isFollowing(username);
            if (isMounted) {
              setIsFollowing(followStatus);
            }
          }
        } catch {
          // If public profile not found in DB, retain fallback
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [username, isOwnProfile, isAuthenticated, authUser]);

  // If viewing other user's profile and currently on saved tab, reset to shared
  useEffect(() => {
    if (isViewingOtherUser && activeTab === 'saved') {
      setActiveTab('shared');
    }
  }, [isViewingOtherUser, activeTab]);

  const userDocs = useMemo(() => {
    return documents.filter(
      (doc) =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const savedDocs = useMemo(() => {
    return documents.slice(0, 4);
  }, []);

  const handleToggleFollow = async () => {
    if (isAuthenticated) {
      try {
        const targetIdentifier = username || userProfile.username;
        const res = await userService.toggleFollow(targetIdentifier);
        setIsFollowing(res.isFollowing);
        setUserProfile((prev) => ({
          ...prev,
          followers: res.followerCount,
        }));

        if (res.isFollowing) {
          toast.success(`Đã theo dõi ${userProfile.name}!`, {
            description: 'Bạn sẽ nhận được thông báo khi người dùng này đăng tài liệu mới.',
          });
        } else {
          toast.info(`Đã hủy theo dõi ${userProfile.name}.`);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Không thể thực hiện theo dõi';
        toast.error(msg);
      }
    } else {
      // Cho phép trải nghiệm thử / unit test
      setIsFollowing((prev) => {
        const next = !prev;
        setUserProfile((p) => ({
          ...p,
          followers: next ? p.followers + 1 : Math.max(0, p.followers - 1),
        }));
        if (next) {
          toast.success(`Đã theo dõi ${userProfile.name}!`, {
            description: 'Bạn sẽ nhận được thông báo khi người dùng này đăng tài liệu mới.',
          });
        } else {
          toast.info(`Đã hủy theo dõi ${userProfile.name}.`);
        }
        return next;
      });
    }
  };

  const handleShareProfile = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
    toast.success('Đã sao chép liên kết hồ sơ vào khay nhớ tạm!');
  };

  return (
    <MainLayout>
      <div className="max-w-[1280px] mx-auto space-y-6 pb-12">
        {/* Profile Header Sub-component */}
        <ProfileHeader
          user={userProfile}
          isOwnProfile={isOwnProfile}
          isFollowing={isFollowing}
          onToggleFollow={handleToggleFollow}
          onShareProfile={handleShareProfile}
        />

        {/* Navigation Tabs Bar */}
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-[#e2e8f0] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto no-scrollbar pb-1 lg:pb-0">
            {/* Tab 1: Tài liệu đã chia sẻ */}
            <button
              type="button"
              onClick={() => setActiveTab('shared')}
              className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'shared'
                  ? 'bg-[#0284c7] text-white shadow-xs'
                  : 'bg-[#f0f9ff] text-[#0369a1] hover:bg-[#e0f2fe]'
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>Tài liệu đã chia sẻ ({userDocs.length})</span>
            </button>

            {/* Tab 2: Tài liệu đã lưu (CHỈ HIỆN KHI XEM HỒ SƠ CHÍNH MÌNH) */}
            {!isViewingOtherUser && (
              <button
                type="button"
                onClick={() => setActiveTab('saved')}
                className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  activeTab === 'saved'
                    ? 'bg-[#0284c7] text-white shadow-xs'
                    : 'bg-[#f0f9ff] text-[#0369a1] hover:bg-[#e0f2fe]'
                }`}
              >
                <Bookmark className="w-4 h-4 shrink-0" />
                <span>Tài liệu đã lưu ({savedDocs.length})</span>
              </button>
            )}

            {/* Tab 3: Thành tích & Huy hiệu */}
            <button
              type="button"
              onClick={() => setActiveTab('achievements')}
              className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'achievements'
                  ? 'bg-[#0284c7] text-white shadow-xs'
                  : 'bg-[#f0f9ff] text-[#0369a1] hover:bg-[#e0f2fe]'
              }`}
            >
              <Award className="w-4 h-4 shrink-0" />
              <span>Thành tích & Huy hiệu</span>
            </button>
          </div>

          {/* Search filter input */}
          {activeTab === 'shared' && (
            <div className="relative w-full lg:w-72 shrink-0">
              <Search className="w-3.5 h-3.5 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Tìm tài liệu của ${userProfile.name}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#0284c7] focus:bg-white rounded-xl text-xs font-medium text-[#0f172a] outline-none transition-all"
              />
            </div>
          )}
        </div>

        {/* Tab Contents */}
        {activeTab === 'shared' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#0f172a]">Tài liệu đã chia sẻ</h2>
                <p className="text-xs text-[#64748b]">Tất cả đóng góp kiến thức học thuật từ {userProfile.name}</p>
              </div>
            </div>

            {userDocs.length > 0 ? (
              <DocumentGrid items={userDocs} cols={4} />
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-[#e2e8f0] text-center space-y-3">
                <FileText className="w-10 h-10 text-[#94a3b8] mx-auto" />
                <h3 className="text-sm font-bold text-[#0f172a]">Không tìm thấy tài liệu phù hợp</h3>
                <p className="text-xs text-[#64748b]">Thử tìm kiếm với từ khóa khác.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'saved' && !isViewingOtherUser && (
          <div className="space-y-3">
            <div>
              <h2 className="text-base font-bold text-[#0f172a]">Tài liệu đã lưu</h2>
              <p className="text-xs text-[#64748b]">Danh sách tài liệu mà {userProfile.name} đã đánh dấu yêu thích</p>
            </div>
            <DocumentGrid items={savedDocs} cols={4} />
          </div>
        )}

        {activeTab === 'achievements' && <AchievementsTab badges={badges} />}
      </div>
    </MainLayout>
  );
}
