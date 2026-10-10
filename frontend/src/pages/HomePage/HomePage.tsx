import { useState } from 'react';
import { ArrowRight, Clock3, Compass, FileUp, Sparkles, TrendingUp, Cpu, ChevronDown, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FeedGrid } from '../../components/FeedCard';
import { PeopleToFollow } from '../../components/PeopleToFollow';
import { documents } from '../../data/documents';
import { useAuth } from '../../lib/authStore';
import { MainLayout } from '../../components/layout';

export function HomePage() {
  const { isAuthenticated, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'for-you' | 'following' | 'trending'>('for-you');
  const [visibleCount, setVisibleCount] = useState<number>(4);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 2);
  };

  return (
    <MainLayout isAuthenticated={isAuthenticated} currentUser={currentUser}>
      <div className="home-page page-enter">
        <section className="home-intro bg-gradient-to-r from-[#F0F9FF] to-[#E0F2FE] border border-[#BAE6FD] rounded-2xl p-6 md:p-8 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="eyebrow text-xs font-bold tracking-wider text-[#0284C7] uppercase mb-2">DÒNG CHIA SẺ HỌC TẬP</p>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A] mb-2">
              {isAuthenticated ? `Chào ${currentUser?.name ?? 'bạn'}, hôm nay học gì?` : 'Hôm nay, bạn học gì?'}
            </h1>
            <p className="home-lede text-sm md:text-base text-[#475569] max-w-2xl leading-relaxed">
              Một nơi để xem tài liệu, chia sẻ cách học và tìm đúng trang ghi chép cho buổi học tiếp theo.
            </p>
          </div>
          <div className="home-intro-actions flex flex-wrap items-center gap-3 shrink-0">
            <Link className="button primary inline-flex items-center gap-2 bg-[#0284C7] hover:bg-[#0369A1] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors" to="/explore">
              <Compass size={17}/>Khám phá tài liệu
            </Link>
            <Link className="button secondary inline-flex items-center gap-2 bg-white hover:bg-[#F8FAFC] text-[#0F172A] border border-[#CBD5E1] px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors" to="/upload">
              <FileUp size={17}/>Chia sẻ tài liệu
            </Link>
          </div>
        </section>

        {!isAuthenticated && (
          <aside className="home-signin-note bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] rounded-xl p-4 mb-6 flex items-center justify-between gap-4 text-sm font-medium">
            <div className="flex items-center gap-2.5">
              <Sparkles size={18} aria-hidden="true" className="text-[#D97706] shrink-0"/>
              <span>Xem preview miễn phí. Đăng nhập khi bạn muốn mở đầy đủ, lưu, thích hoặc bình luận.</span>
            </div>
            <Link to="/login" className="inline-flex items-center gap-1.5 font-bold text-[#B45309] hover:underline shrink-0">
              Đăng nhập <ArrowRight size={15}/>
            </Link>
          </aside>
        )}

        <div className="home-layout grid grid-cols-1 lg:grid-cols-[1fr_310px] gap-6">
          <section className="home-feed" aria-label="Dòng chia sẻ học tập">

            {/* TABS NAVIGATION */}
            <div className="flex border-b border-[#E2E8F0] mb-6">
              <button 
                onClick={() => setActiveTab('for-you')}
                className={`flex-1 flex justify-center items-center gap-2 py-3.5 border-b-2 text-sm transition-all cursor-pointer bg-transparent ${
                  activeTab === 'for-you'
                    ? 'font-semibold text-[#0284C7] border-[#0284C7]'
                    : 'font-medium text-[#64748B] border-transparent hover:text-[#0284C7]'
                }`}
              >
                <Cpu size={18} /> Dành cho bạn
              </button>
              <button 
                onClick={() => setActiveTab('following')}
                className={`flex-1 flex justify-center items-center gap-2 py-3.5 border-b-2 text-sm transition-all cursor-pointer bg-transparent ${
                  activeTab === 'following'
                    ? 'font-semibold text-[#0284C7] border-[#0284C7]'
                    : 'font-medium text-[#64748B] border-transparent hover:text-[#0284C7]'
                }`}
              >
                <UserCheck size={18} /> Đang theo dõi
              </button>
              <button 
                onClick={() => setActiveTab('trending')}
                className={`flex-1 flex justify-center items-center gap-2 py-3.5 border-b-2 text-sm transition-all cursor-pointer bg-transparent ${
                  activeTab === 'trending'
                    ? 'font-semibold text-[#0284C7] border-[#0284C7]'
                    : 'font-medium text-[#64748B] border-transparent hover:text-[#0284C7]'
                }`}
              >
                <TrendingUp size={18} /> Đang thịnh hành
              </button>
            </div>

            {/* TAB CONTENT */}
            <div className="page-enter" key={activeTab}>
              <FeedGrid activeTab={activeTab} limit={visibleCount} />
            </div>

            {/* LOAD MORE BUTTON */}
            {visibleCount < documents.length && (
              <div className="mt-8 flex justify-center">
                <button 
                  onClick={handleLoadMore}
                  className="button secondary inline-flex items-center gap-2 px-6 py-3 bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] text-[#0F172A] font-medium text-sm rounded-xl cursor-pointer transition-colors"
                >
                  <ChevronDown size={18} /> Tải thêm bài viết
                </button>
              </div>
            )}

          </section>

          <aside className="home-aside">
            <PeopleToFollow/>
            <section className="quick-links bg-white border border-[#E2E8F0] rounded-xl p-5">
              <p className="eyebrow text-xs font-bold text-[#0284C7] tracking-wider uppercase mb-3">ĐI NHANH</p>
              <div className="flex flex-col gap-3">
                <Link to="/recent" className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#F8FAFC] transition-colors group">
                  <div className="p-2 rounded-lg bg-[#F0F9FF] text-[#0284C7] group-hover:bg-[#0284C7] group-hover:text-white transition-colors">
                    <Clock3 size={17}/>
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-[#1E293B] block leading-tight">Recent</span>
                    <span className="text-xs text-[#64748B]">Hoạt động của bạn</span>
                  </div>
                </Link>
                <Link to="/quiz" className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#F8FAFC] transition-colors group">
                  <div className="p-2 rounded-lg bg-[#FDF4FF] text-[#C084FC] group-hover:bg-[#C084FC] group-hover:text-white transition-colors">
                    <Sparkles size={17}/>
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-[#1E293B] block leading-tight">Quiz</span>
                    <span className="text-xs text-[#64748B]">Tạo câu hỏi từ tài liệu</span>
                  </div>
                </Link>
              </div>
              <p className="quick-foot mt-4 pt-3 border-t border-[#F1F5F9] text-xs text-[#94A3B8]">
                {documents.length} tài liệu mẫu đang sẵn sàng để xem preview.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </MainLayout>
  );
}

export default HomePage;
