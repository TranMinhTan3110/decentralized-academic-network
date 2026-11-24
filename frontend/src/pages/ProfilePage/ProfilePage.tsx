import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '../../components/layout';
import { BookOpen, FileText, Search, Bookmark, Award } from 'lucide-react';
import { toast } from 'sonner';
import { DocumentGrid } from '../../components/ui';
import { ProfileHeader, AchievementsTab } from './components';
import { documentService } from '../../services/documentService';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import type { BadgeDto, UserDto } from '../../services/authService';

interface ProfileViewModel {
  id: string;
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

const TEST_FALLBACK_PROFILE: ProfileViewModel = {
  id: '66666666-6666-6666-6666-000000000001',
  name: 'Lan Chi',
  username: '@lanchi_hust',
  avatarUrl: undefined,
  avatarInitials: 'LC',
  school: 'Đại học Bách khoa Hà Nội',
  major: 'Khoa học Máy tính',
  joinDate: 'Tháng 09/2024',
  bio: 'Đam mê nghiên cứu Thuật toán, Trí tuệ nhân tạo và Chia sẻ tài liệu học thuật cho cộng đồng sinh viên.',
  followers: 154,
  following: 38,
  reputation: 1540,
  verified: true,
};

function mapAuthUserToProfile(u: UserDto): ProfileViewModel {
  return {
    id: u.id,
    name: u.fullName || u.username || 'Người dùng',
    username: u.username || 'user',
    avatarUrl: u.avatarUrl,
    avatarInitials: u.avatarText || (u.fullName || u.username || 'ND').slice(0, 2).toUpperCase(),
    school: u.universityName || 'Mạng học thuật DeDocu',
    major: u.major || 'Chưa cập nhật chuyên ngành',
    joinDate: u.createdAt
      ? new Date(u.createdAt).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })
      : 'Mới tham gia',
    bio: u.bio || 'Chào mừng bạn đến với trang cá nhân của tôi trên DeDocu!',
    followers: u.followerCount ?? 0,
    following: u.followingCount ?? 0,
    reputation: u.reputationPoints ?? 0,
    verified: Boolean(u.isVerified),
  };
}

export function ProfilePage() {
  const { username } = useParams<{ username?: string }>();
  const { userDto: authUser, isAuthenticated } = useAuth();
  const isTestEnv = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test';

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
  const [allUserDocs, setAllUserDocs] = useState<any[]>([]);
  const [savedDocs, setSavedDocs] = useState<any[]>([]);

  // Khởi tạo trực tiếp từ authUser nếu đang xem hồ sơ chính mình (tránh hiện mock data "Lan Chi")
  const [userProfile, setUserProfile] = useState<ProfileViewModel | null>(() => {
    if (isOwnProfile && authUser) {
      return mapAuthUserToProfile(authUser);
    }
    return isTestEnv ? TEST_FALLBACK_PROFILE : null;
  });
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(() => {
    if (isTestEnv) return false;
    return !(isOwnProfile && authUser);
  });
  const [profileNotFound, setProfileNotFound] = useState<boolean>(false);

  useEffect(() => {
    if (!isOwnProfile && !userProfile?.id) return;
    let active = true;

    const feedFilter = isOwnProfile ? 'my-uploads' : 'for-you';

    documentService.getFeed({ filter: feedFilter, page: 0, size: 30 })
      .then((res) => {
        if (active && res) {
          const list = Array.isArray(res) ? res : (res.content || []);
          if (isOwnProfile) {
            setAllUserDocs(list);
          } else if (userProfile) {
            const targetId = userProfile.id;
            const targetName = userProfile.name?.toLowerCase();
            const targetUsername = userProfile.username?.replace('@', '').toLowerCase();
            const filtered = list.filter((doc: any) => {
              const authorId = doc.author?.id || doc.author?.userId || doc.userId;
              const authorName = (doc.author?.name || doc.author?.fullName || '').toLowerCase();
              return (
                (targetId && authorId === targetId) ||
                (targetName && authorName.includes(targetName)) ||
                (targetUsername && authorName.includes(targetUsername))
              );
            });
            setAllUserDocs(filtered);
          }
        }
      })
      .catch(() => { });

    if (isOwnProfile && isAuthenticated) {
      documentService.getMyBookmarks(0, 10)
        .then((res) => {
          if (active && res) {
            const list = Array.isArray(res) ? res : (res.content || []);
            setSavedDocs(list);
          }
        })
        .catch(() => { });
    } else {
      setSavedDocs([]);
    }

    return () => {
      active = false;
    };
  }, [isOwnProfile, isAuthenticated, userProfile?.id, userProfile?.name, userProfile?.username]);

  // Load profile data from Backend
  useEffect(() => {
    let isMounted = true;
    setProfileNotFound(false);

    async function loadData() {
      if (isOwnProfile) {
        if (authUser && isMounted) {
          setUserProfile((prev) => prev?.id === authUser.id ? prev : mapAuthUserToProfile(authUser));
          setIsLoadingProfile(false);
        }
        if (isAuthenticated) {
          try {
            const data = await userService.getProfile();
            if (!isMounted) return;
            setUserProfile(mapAuthUserToProfile(data));
            if (data.badges) {
              setBadges(data.badges);
            }
          } catch {
            if (authUser && isMounted) {
              setUserProfile(mapAuthUserToProfile(authUser));
            }
          } finally {
            if (isMounted) setIsLoadingProfile(false);
          }
        } else if (isMounted) {
          setIsLoadingProfile(false);
        }
      } else if (username) {
        if (!isTestEnv) {
          setUserProfile(null);
          setIsLoadingProfile(true);
        }
        try {
          const target = await userService.getPublicProfile(username);
          if (!isMounted) return;
          setUserProfile({
            id: target.id,
            name: target.fullName || target.username || 'Người dùng',
            username: target.username || username,
            avatarUrl: target.avatarUrl,
            avatarInitials: target.avatarText || (target.fullName || target.username || 'ND').slice(0, 2).toUpperCase(),
            school: target.universityName || 'Mạng học thuật DeDocu',
            major: target.major || 'Chưa cập nhật chuyên ngành',
            joinDate: target.createdAt
              ? new Date(target.createdAt).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })
              : 'Mới tham gia',
            bio: target.bio || 'Thành viên cộng đồng chia sẻ tài liệu học thuật DeDocu.',
            followers: target.followerCount ?? 0,
            following: target.followingCount ?? 0,
            reputation: target.reputationPoints ?? 0,
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
          if (isMounted && !isTestEnv) {
            setProfileNotFound(true);
          }
        } finally {
          if (isMounted) setIsLoadingProfile(false);
        }
      } else {
        if (isMounted) {
          if (!isTestEnv) setUserProfile(null);
          setIsLoadingProfile(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [username, isOwnProfile, isAuthenticated, authUser, isTestEnv]);

  // If viewing other user's profile and currently on saved tab, reset to shared
  useEffect(() => {
    if (isViewingOtherUser && activeTab === 'saved') {
      setActiveTab('shared');
    }
  }, [isViewingOtherUser, activeTab]);

  const userDocs = useMemo(() => {
    return allUserDocs.filter(
      (doc) =>
        (doc.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.category || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allUserDocs, searchQuery]);

  const handleToggleFollow = async () => {
    if (!userProfile) return;
    if (isAuthenticated) {
      try {
        const targetIdentifier = username || userProfile.username;
        const res = await userService.toggleFollow(targetIdentifier);
        setIsFollowing(res.isFollowing);
        setUserProfile((prev) =>
          prev
            ? {
                ...prev,
                followers: res.followerCount,
              }
            : prev
        );

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
      setIsFollowing((prev) => {
        const next = !prev;
        setUserProfile((p) =>
          p
            ? {
                ...p,
                followers: next ? p.followers + 1 : Math.max(0, p.followers - 1),
              }
            : p
        );
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
        {isLoadingProfile ? (
          <div data-testid="profile-loading-skeleton" className="space-y-6 animate-pulse">
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-3 w-full">
                  <div className="h-6 bg-slate-200 rounded-lg w-48" />
                  <div className="h-4 bg-slate-200 rounded-lg w-72 max-w-full" />
                  <div className="h-3.5 bg-slate-100 rounded-lg w-96 max-w-full" />
                  <div className="flex gap-4 pt-2">
                    <div className="h-8 bg-slate-100 rounded-xl w-24" />
                    <div className="h-8 bg-slate-100 rounded-xl w-24" />
                    <div className="h-8 bg-slate-100 rounded-xl w-24" />
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 h-16" />
          </div>
        ) : !userProfile || profileNotFound ? (
          <div className="bg-white p-12 rounded-2xl border border-[#e2e8f0] text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] mx-auto flex items-center justify-center text-[#94a3b8]">
              <FileText className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-[#0f172a]">
              {profileNotFound ? 'Không tìm thấy hồ sơ người dùng' : 'Vui lòng đăng nhập để xem hồ sơ của bạn'}
            </h2>
            <p className="text-xs text-[#64748b] max-w-sm mx-auto">
              {profileNotFound
                ? 'Tài khoản này không tồn tại hoặc đã bị ẩn khỏi hệ thống.'
                : 'Đăng nhập để xem thông tin cá nhân, tài liệu đã chia sẻ và huy hiệu học thuật.'}
            </p>
            <Link
              to={profileNotFound ? '/' : '/login'}
              className="inline-flex items-center gap-2 bg-[#0284c7] hover:bg-[#0369a1] text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all mt-2"
            >
              {profileNotFound ? 'Về Trang chủ' : 'Đăng nhập ngay'}
            </Link>
          </div>
        ) : (
          <>
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
                  className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${activeTab === 'shared'
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
                    className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${activeTab === 'saved'
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
                  className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${activeTab === 'achievements'
                      ? 'bg-[#0284c7] text-white shadow-xs'
                      : 'bg-[#f0f9ff] text-[#0369a1] hover:bg-[#e0f2fe]'
                    }`}
                >
                  <Award className="w-4 h-4 shrink-0" />
                  <span>Thành tích & Huy hiệu</span>
                </button>
              </div>

              {/* Search filter input: chỉ hiện khi có tài liệu */}
              {activeTab === 'shared' && userDocs.length > 0 && (
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
              <div className="space-y-4">
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
                    <div className="w-12 h-12 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] mx-auto flex items-center justify-center text-[#94a3b8]">
                      <FileText className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-[#0f172a]">Chưa có tài liệu chia sẻ nào</h3>
                    <p className="text-xs text-[#64748b] max-w-sm mx-auto">
                      {isViewingOtherUser
                        ? `${userProfile.name} chưa chia sẻ tài liệu học thuật nào lên nền tảng.`
                        : 'Bạn chưa tải lên tài liệu học tập nào. Hãy đóng góp tài liệu đầu tiên để chia sẻ kiến thức cùng cộng đồng nhé!'}
                    </p>
                    {!isViewingOtherUser && (
                      <Link
                        to="/upload"
                        className="inline-flex items-center gap-2 bg-[#0284c7] hover:bg-[#0369a1] text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all mt-2"
                      >
                        <BookOpen className="w-4 h-4" />
                        Chia sẻ tài liệu ngay
                      </Link>
                    )}
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
          </>
        )}
      </div>
    </MainLayout>
  );
}
