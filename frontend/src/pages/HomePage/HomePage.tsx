import { useState, useCallback } from 'react';
import { ArrowRight, Clock3, Compass, FileUp, Sparkles, TrendingUp, Cpu, ChevronDown, UserCheck, FileText, BrainCircuit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FeedGrid } from '../../components/FeedCard';
import { PeopleToFollow } from '../../components/PeopleToFollow';
import { useAuth } from '../../lib/authStore';
import { MainLayout } from '../../components/layout';
import { Avatar } from '../../components/ui';

export function HomePage() {
  const { isAuthenticated, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'for-you' | 'following' | 'trending'>('for-you');
  const [page, setPage] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  const handleTabChange = (tab: 'for-you' | 'following' | 'trending') => {
    setActiveTab(tab);
    setPage(0);
    setHasMore(true);
  };

  const handleDataLoaded = useCallback(({ last }: { last: boolean; totalElements: number }) => {
    setHasMore(!last);
  }, []);

  return (
    <MainLayout isAuthenticated={isAuthenticated} currentUser={currentUser}>
      <div className="home-page page-enter">
        {!isAuthenticated && (
          <aside className="home-signin-note bg-gradient-to-r from-[#EEF2FF] via-[#F5F3FF] to-[#EEF2FF] border border-[#C7D2FE] text-[#3730A3] rounded-2xl p-4 mb-5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-medium shadow-2xs">
            <div className="flex items-center gap-2.5">
              <Sparkles size={17} aria-hidden="true" className="text-[#4F46E5] shrink-0" />
              <span>Xem preview miễn phí. Đăng nhập để mở khóa đầy đủ, lưu, thích và thảo luận cùng cộng đồng.</span>
            </div>
            <Link to="/login" className="inline-flex items-center gap-1.5 font-bold text-[#4F46E5] hover:text-[#3730A3] hover:underline shrink-0">
              Đăng nhập <ArrowRight size={15} />
            </Link>
          </aside>
        )}

        <div className="home-layout grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start min-w-0">
          <section className="home-feed min-w-0" aria-label="Dòng chia sẻ học tập">
            {/* SOCIAL COMPOSER CARD — Cảm giác mạng xã hội học thuật thực thụ */}
            <div className="home-intro bg-white border border-[#E6E8F0] rounded-2xl p-4 sm:p-5 mb-5 shadow-2xs">
              <div className="flex items-center gap-3 mb-3.5">
                {isAuthenticated && currentUser ? (
                  <Avatar user={currentUser} size="md" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    D
                  </div>
                )}
                <Link
                  to="/upload"
                  className="flex-1 text-left px-4 py-2.5 rounded-full bg-[#F6F7FB] hover:bg-[#EEF2FF]/70 border border-[#E6E8F0] hover:border-[#C7D2FE] text-xs sm:text-sm text-[#64748B] hover:text-[#312E81] transition-all truncate"
                >
                  {isAuthenticated
                    ? `${currentUser?.name ?? 'Bạn'} ơi, hôm nay có tài liệu hay ghi chép gì muốn chia sẻ không?`
                    : 'Hôm nay, bạn học gì? Chia sẻ tài liệu hoặc ghi chép cho cộng đồng...'}
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#F1F5F9]">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <Link
                    to="/upload"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4F46E5] text-xs font-semibold transition-colors"
                  >
                    <FileUp size={14} />
                    <span>Chia sẻ tài liệu</span>
                  </Link>
                  <Link
                    to="/quiz"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F5F3FF] hover:bg-[#EDE9FE] text-[#7C3AED] text-xs font-semibold transition-colors"
                  >
                    <BrainCircuit size={14} />
                    <span>Tạo Quiz AI</span>
                  </Link>
                  <Link
                    to="/explore"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F6F7FB] hover:bg-[#EEF2FF] text-[#475569] hover:text-[#4F46E5] text-xs font-semibold transition-colors"
                  >
                    <Compass size={14} />
                    <span>Khám phá tài liệu</span>
                  </Link>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-[#94A3B8]">
                  <FileText size={13} /> PDF · DOCX · PPTX · XLSX
                </span>
              </div>
            </div>

            {/* SEGMENTED PILL FEED TABS */}
            <div className="bg-white border border-[#E6E8F0] rounded-2xl p-1.5 mb-5 flex items-center gap-1 shadow-2xs overflow-x-auto scrollbar-none">
              <button
                onClick={() => handleTabChange('for-you')}
                className={`flex-1 min-w-[105px] flex justify-center items-center gap-1.5 sm:gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'for-you'
                    ? 'font-semibold bg-[#4F46E5] text-white shadow-xs shadow-indigo-500/25'
                    : 'font-medium text-[#64748B] bg-transparent hover:bg-[#F6F7FB] hover:text-[#0F172A]'
                }`}
              >
                <Cpu size={16} className="shrink-0" /> <span>Dành cho bạn</span>
              </button>
              <button
                onClick={() => handleTabChange('following')}
                className={`flex-1 min-w-[105px] flex justify-center items-center gap-1.5 sm:gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'following'
                    ? 'font-semibold bg-[#4F46E5] text-white shadow-xs shadow-indigo-500/25'
                    : 'font-medium text-[#64748B] bg-transparent hover:bg-[#F6F7FB] hover:text-[#0F172A]'
                }`}
              >
                <UserCheck size={16} className="shrink-0" /> <span>Đang theo dõi</span>
              </button>
              <button
                onClick={() => handleTabChange('trending')}
                className={`flex-1 min-w-[105px] flex justify-center items-center gap-1.5 sm:gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'trending'
                    ? 'font-semibold bg-[#4F46E5] text-white shadow-xs shadow-indigo-500/25'
                    : 'font-medium text-[#64748B] bg-transparent hover:bg-[#F6F7FB] hover:text-[#0F172A]'
                }`}
              >
                <TrendingUp size={16} className="shrink-0" /> <span>Đang thịnh hành</span>
              </button>
            </div>

            {/* TAB CONTENT */}
            <div className="page-enter" key={activeTab}>
              <FeedGrid activeTab={activeTab} limit={4} page={page} onDataLoaded={handleDataLoaded} />
            </div>

            {/* LOAD MORE BUTTON */}
            {hasMore && (
              <div className="mt-7 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  className="button secondary inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-[#E6E8F0] hover:border-[#C7D2FE] hover:bg-[#EEF2FF]/50 text-[#0F172A] hover:text-[#4F46E5] font-semibold text-xs sm:text-sm rounded-full cursor-pointer transition-all shadow-2xs"
                >
                  <ChevronDown size={17} /> Tải thêm bài viết
                </button>
              </div>
            )}
          </section>

          <aside className="home-aside grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-5 lg:sticky lg:top-[84px]">
            <PeopleToFollow />
            <section className="quick-links bg-white border border-[#E6E8F0] rounded-2xl p-5 shadow-2xs">
              <p className="eyebrow text-[11px] font-bold text-[#4F46E5] tracking-wider uppercase mb-3">ĐI NHANH</p>
              <div className="flex flex-col gap-2">
                <Link to="/recent" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#F6F7FB] transition-colors group">
                  <div className="p-2 rounded-xl bg-[#EEF2FF] text-[#4F46E5] group-hover:bg-[#4F46E5] group-hover:text-white transition-colors">
                    <Clock3 size={17} />
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-[#0F172A] block leading-tight">Gần đây</span>
                    <span className="text-xs text-[#64748B]">Hoạt động của bạn</span>
                  </div>
                </Link>
                <Link to="/quiz" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#F6F7FB] transition-colors group">
                  <div className="p-2 rounded-xl bg-[#F5F3FF] text-[#7C3AED] group-hover:bg-[#7C3AED] group-hover:text-white transition-colors">
                    <Sparkles size={17} />
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-[#0F172A] block leading-tight">Quiz</span>
                    <span className="text-xs text-[#64748B]">Tạo câu hỏi từ tài liệu</span>
                  </div>
                </Link>
              </div>
              <p className="quick-foot mt-4 pt-3 border-t border-[#F1F5F9] text-[11px] text-[#94A3B8] leading-relaxed">
                Tài liệu học thuật phi tập trung luôn sẵn sàng để tra cứu và luyện tập.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </MainLayout>
  );
}

export default HomePage;
