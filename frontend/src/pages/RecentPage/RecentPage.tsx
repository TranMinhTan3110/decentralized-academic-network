import { useState } from 'react';
import { ArrowRight, Clock3, Heart, MessageCircle, UploadCloud, Bell, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { documents } from '../../data/documents';
import { useLibrary } from '../../lib/store';
import { useSocial } from '../../lib/socialStore';
import { useAuth } from '../../lib/authStore';
import { DocumentGrid, EmptyState } from '../../components';
import { MainLayout } from '../../components/layout';

export function RecentPage() {
  const { isAuthenticated, currentUser } = useAuth();
  const libraryStore = useLibrary();
  const historyList = libraryStore?.history ?? libraryStore?.viewedDocIds ?? [];
  const socialStore = useSocial();
  const activityList = socialStore?.activities ?? [];
  const [showAllActivities, setShowAllActivities] = useState(false);
  
  const viewed = historyList.flatMap((id) => {
    const item = documents.find((document) => document.id === id);
    return item ? [item] : [];
  });
  const recentActions = activityList.slice(0, 15).flatMap((activity, idx) => {
    const item = documents.find((document) => document.id === activity.documentId);
    return item ? [{ activity: { ...activity, id: activity.id ?? `act-${idx}`, createdAt: activity.createdAt ?? Date.now() }, item }] : [];
  });
  
  const visibleActions = showAllActivities ? recentActions : recentActions.slice(0, 3);
  
  return (
    <MainLayout isAuthenticated={isAuthenticated} currentUser={currentUser}>
      <div className="recent-page page-enter p-4 md:p-6 max-w-7xl mx-auto">
        <p className="eyebrow text-xs font-bold tracking-wider text-[#0284C7] uppercase mb-1">DÒNG HOẠT ĐỘNG CỦA BẠN</p>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A] mb-1">Recent</h1>
        <p className="intro text-sm text-[#64748B] mb-6">Những tài liệu bạn đã xem và thông báo tương tác mới nhất.</p>
        
        <div className="recent-layout grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <section className="recent-viewed lg:col-span-8" aria-label="Tài liệu đã xem gần đây">
            <div className="section-heading flex items-center justify-between pb-3 mb-4 border-b border-[#E2E8F0]">
              <div>
                <h2 className="text-lg font-bold text-[#0F172A]">Đã xem gần đây</h2>
                <p className="text-xs text-[#64748B] mt-0.5">{viewed.length} tài liệu trong lịch sử</p>
              </div>
              <Clock3 size={19} className="text-[#0284C7]" aria-hidden="true" />
            </div>
            {viewed.length ? (
              <DocumentGrid items={viewed} />
            ) : (
              <EmptyState title="Chưa có lịch sử xem" description="Mở một tài liệu từ Home hoặc Khám phá để bắt đầu.">
                <Link
                  to="/explore"
                  className="button primary inline-flex items-center gap-1.5 bg-[#0284C7] hover:bg-[#0369A1] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors mt-2"
                >
                  Khám phá tài liệu <ArrowRight size={17} />
                </Link>
              </EmptyState>
            )}
          </section>
          
          <aside className="activity-panel lg:col-span-4 bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs" aria-label="Thông báo & Tương tác" style={{ maxHeight: 'max-content' }}>
            <div className="section-heading pb-3 mb-4 border-b border-[#E2E8F0]">
              <div>
                <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                  <Bell size={18} className="text-[#E11D48]" /> Thông báo & Tương tác
                </h2>
                <p className="text-xs text-[#64748B] mt-1">Có ai đó vừa bình luận hoặc thích tài liệu của bạn</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              {/* Demo Notifications */}
              <div className="activity-row flex gap-3 items-start pb-4 border-b border-[#F1F5F9]">
                <div className="p-2 bg-[#E0F2FE] rounded-full text-[#0284C7] shrink-0 mt-0.5">
                  <MessageCircle size={16} />
                </div>
                <div className="min-w-0">
                  <strong className="block text-sm font-semibold text-[#0F172A] mb-1">Lan Chi vừa bình luận</strong>
                  <Link to="/detail/doc-1" className="text-sm font-medium text-[#0284C7] hover:underline line-clamp-1">
                    Đề cương ôn tập Vĩ mô
                  </Link>
                  <p className="text-xs text-[#475569] my-1 italic">"Tài liệu này cứu tôi qua môn, cảm ơn ad!"</p>
                  <small className="text-[#94A3B8] text-xs">Vừa xong</small>
                </div>
              </div>

              <div className="activity-row flex gap-3 items-start pb-4 border-b border-[#F1F5F9]">
                <div className="p-2 bg-[#FFE4E6] rounded-full text-[#E11D48] shrink-0 mt-0.5">
                  <Heart size={16} />
                </div>
                <div className="min-w-0">
                  <strong className="block text-sm font-semibold text-[#0F172A] mb-1">Đức Minh và 15 người khác đã thích</strong>
                  <Link to="/detail/doc-1" className="text-sm font-medium text-[#0284C7] hover:underline line-clamp-1">
                    Cung, cầu và cân bằng thị trường
                  </Link>
                  <small className="text-[#94A3B8] text-xs block mt-1">2 giờ trước</small>
                </div>
              </div>

              {visibleActions.length ? (
                visibleActions.map(({ activity, item }) => (
                  <div className="activity-row flex gap-3 items-start pb-4 border-b border-[#F1F5F9]" key={activity.id}>
                    <div className="p-2 bg-[#F1F5F9] rounded-full text-[#3B82F6] shrink-0 mt-0.5">
                      {activity.type === 'like' ? (
                        <Heart size={16} />
                      ) : activity.type === 'comment' ? (
                        <MessageCircle size={16} />
                      ) : (
                        <UploadCloud size={16} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <strong className="block text-sm font-semibold text-[#0F172A] mb-1">
                        {activity.type === 'like'
                          ? 'Đã thích'
                          : activity.type === 'comment'
                          ? 'Đã bình luận'
                          : activity.type === 'upload'
                          ? 'Đã đăng tài liệu'
                          : 'Đã tương tác'}
                      </strong>
                      <Link to={`/detail/${item.id}`} className="text-sm font-medium text-[#0284C7] hover:underline line-clamp-1">
                        {item.title}
                      </Link>
                      {activity.text && <p className="text-xs text-[#475569] my-1 italic">"{activity.text}"</p>}
                      <small className="text-[#94A3B8] text-xs block mt-1">
                        {new Date(activity.createdAt).toLocaleDateString('vi-VN')}
                      </small>
                    </div>
                  </div>
                ))
              ) : null}
            </div>

            {recentActions.length > 3 && (
              <button 
                onClick={() => setShowAllActivities(!showAllActivities)} 
                className="button secondary w-full mt-4 flex items-center justify-center gap-1.5 bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] text-[#475569] font-medium text-xs py-2 rounded-xl transition-colors cursor-pointer"
              >
                {showAllActivities ? (
                  <>
                    <ChevronUp size={16} /> Ẩn bớt
                  </>
                ) : (
                  <>
                    <ChevronDown size={16} /> Xem thêm ({recentActions.length - 3} thông báo)
                  </>
                )}
              </button>
            )}
          </aside>
        </div>
      </div>
    </MainLayout>
  );
}

export { RecentPage as Recent };
