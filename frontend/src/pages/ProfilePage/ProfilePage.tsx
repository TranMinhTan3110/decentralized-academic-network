import { useState, useMemo } from 'react';
import { MainLayout } from '../../components/layout';
import { BookOpen, FileText, Search, Bookmark, Award } from 'lucide-react';
import { toast } from 'sonner';
import { documents } from '../../data/documents';
import { DocumentGrid } from '../../components/ui';
import { ProfileHeader, AchievementsTab } from './components';

export function ProfilePage() {
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'shared' | 'saved' | 'achievements'>('shared');
  const [searchQuery, setSearchQuery] = useState('');

  const user = {
    name: 'Lan Chi',
    username: '@lanchi_hust',
    avatarInitials: 'LC',
    school: 'Đại học Bách khoa Hà Nội',
    major: 'Khoa học Máy tính',
    location: 'Hà Nội, Việt Nam',
    joinDate: 'Tháng 09/2024',
    bio: 'Đam mê nghiên cứu Thuật toán, Trí tuệ nhân tạo và Chia sẻ tài liệu học thuật cho cộng đồng sinh viên.',
    followers: isFollowing ? 155 : 154,
    following: 38,
    reputation: 1540,
    verified: true,
  };

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

  const handleToggleFollow = () => {
    setIsFollowing((prev) => !prev);
    if (!isFollowing) {
      toast.success(`Đã theo dõi ${user.name}!`, {
        description: 'Bạn sẽ nhận được thông báo khi người dùng này đăng tài liệu mới.',
      });
    } else {
      toast.info(`Đã hủy theo dõi ${user.name}.`);
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
          user={user}
          isFollowing={isFollowing}
          onToggleFollow={handleToggleFollow}
          onShareProfile={handleShareProfile}
        />

        {/* Navigation Tabs Bar */}
        <div className="bg-white p-4 rounded-2xl border border-[#e2e8f0] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('shared')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'shared'
                  ? 'bg-[#0284c7] text-white shadow-xs'
                  : 'bg-[#f0f9ff] text-[#0369a1] hover:bg-[#e0f2fe]'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Tài liệu đã chia sẻ ({userDocs.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('saved')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'saved'
                  ? 'bg-[#0284c7] text-white shadow-xs'
                  : 'bg-[#f0f9ff] text-[#0369a1] hover:bg-[#e0f2fe]'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>Tài liệu đã lưu ({savedDocs.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('achievements')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'achievements'
                  ? 'bg-[#0284c7] text-white shadow-xs'
                  : 'bg-[#f0f9ff] text-[#0369a1] hover:bg-[#e0f2fe]'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Thành tích & Huy hiệu</span>
            </button>
          </div>

          {/* Search filter input */}
          {activeTab === 'shared' && (
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm tài liệu của Lan Chi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#0284c7] focus:bg-white rounded-xl text-xs font-medium text-[#0f172a] outline-none transition-all"
              />
            </div>
          )}
        </div>

        {/* Tab Contents: Grid layout 4 columns per row */}
        {activeTab === 'shared' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#0f172a]">Tài liệu đã chia sẻ</h2>
                <p className="text-xs text-[#64748b]">Tất cả đóng góp kiến thức học thuật từ {user.name}</p>
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

        {activeTab === 'saved' && (
          <div className="space-y-3">
            <div>
              <h2 className="text-base font-bold text-[#0f172a]">Tài liệu đã lưu</h2>
              <p className="text-xs text-[#64748b]">Danh sách tài liệu mà {user.name} đã đánh dấu yêu thích</p>
            </div>
            <DocumentGrid items={savedDocs} cols={4} />
          </div>
        )}

        {activeTab === 'achievements' && <AchievementsTab />}
      </div>
    </MainLayout>
  );
}
