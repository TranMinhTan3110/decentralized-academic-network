import { ArrowRight, Bookmark, Clock, FileUp, UploadCloud, Eye, Download } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { documents } from '../../data/documents';
import { useLibrary } from '../../lib/store';
import { useSocial } from '../../lib/socialStore';
import { useAuth } from '../../lib/authStore';
import { DocumentGrid, EmptyState } from '../../components';
import { MainLayout } from '../../components/layout';

export function LibraryPage() {
  const { isAuthenticated, currentUser } = useAuth();
  const libraryStore = useLibrary();
  const saved = libraryStore?.saved ?? libraryStore?.savedDocIds ?? [];
  const history = libraryStore?.history ?? libraryStore?.viewedDocIds ?? [];

  const socialStore = useSocial();
  const uploadedDocumentIds = socialStore?.uploadedDocumentIds ?? [];

  const [params, setParams] = useSearchParams();
  const currentTabParam = params.get('tab') ?? '';
  const tab = ['saved', 'history'].includes(currentTabParam) ? currentTabParam : 'uploads';

  const ids = tab === 'uploads' ? uploadedDocumentIds : tab === 'saved' ? [...saved].reverse() : history;
  const items = ids.flatMap((id) => {
    const item = documents.find((doc) => doc.id === id);
    return item ? [item] : [];
  });

  const titles = { uploads: 'Tài liệu đã đăng', saved: 'Đã lưu', history: 'Đã xem gần đây' };

  return (
    <MainLayout isAuthenticated={isAuthenticated} currentUser={currentUser}>
      <div className="library-page page-enter max-w-7xl mx-auto">
        <p className="eyebrow text-xs font-bold tracking-wider text-[#0284C7] uppercase mb-1">KHÔNG GIAN CÁ NHÂN</p>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A] mb-1">{titles[tab as keyof typeof titles]}</h1>
        <p className="intro text-sm text-[#64748B] mb-6">Library là nơi giữ lại những tài liệu bạn đã chia sẻ, đã lưu hoặc vừa xem.</p>

        {/* STATS SECTION */}
        {tab === 'uploads' && (
          <div className="grid grid-cols-3 divide-x divide-[#E2E8F0] my-4 sm:my-6 p-3 sm:p-4 md:px-6 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] shadow-xs">
            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1.5 sm:gap-3 px-1 sm:px-4 text-center sm:text-left">
              <div className="p-2 sm:p-2.5 bg-[#E0F2FE] rounded-xl text-[#0284C7] shrink-0">
                <Eye size={18} className="sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <strong className="block text-base sm:text-lg font-bold text-[#0F172A] leading-tight">1.2K</strong>
                <div className="text-[11px] sm:text-xs text-[#64748B] truncate">Lượt xem</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1.5 sm:gap-3 px-1 sm:px-4 text-center sm:text-left">
              <div className="p-2 sm:p-2.5 bg-[#DCFCE7] rounded-xl text-[#16A34A] shrink-0">
                <Download size={18} className="sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <strong className="block text-base sm:text-lg font-bold text-[#0F172A] leading-tight">340</strong>
                <div className="text-[11px] sm:text-xs text-[#64748B] truncate">Lượt tải</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1.5 sm:gap-3 px-1 sm:px-4 text-center sm:text-left">
              <div className="p-2 sm:p-2.5 bg-[#FFE4E6] rounded-xl text-[#E11D48] shrink-0">
                <Bookmark size={18} className="sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <strong className="block text-base sm:text-lg font-bold text-[#0F172A] leading-tight">89</strong>
                <div className="text-[11px] sm:text-xs text-[#64748B] truncate">Lượt lưu</div>
              </div>
            </div>
          </div>
        )}

        {/* TABS NAVIGATION */}
        <div className="flex items-center border-b border-[#E2E8F0] mb-3 overflow-x-auto" aria-label="Loại thư viện">
          <button
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-3 border-b-2 font-semibold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap flex-1 text-center ${
              tab === 'uploads'
                ? 'border-[#0284C7] text-[#0284C7]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
            aria-pressed={tab === 'uploads'}
            onClick={() => setParams({})}
          >
            <UploadCloud size={16} aria-hidden="true" className="shrink-0" />
            <span>Đã đăng</span>
            <span className="ml-1 text-[11px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-[#F1F5F9] font-bold">{uploadedDocumentIds.length}</span>
          </button>

          <button
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-3 border-b-2 font-semibold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap flex-1 text-center ${
              tab === 'saved'
                ? 'border-[#0284C7] text-[#0284C7]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
            aria-pressed={tab === 'saved'}
            onClick={() => setParams({ tab: 'saved' })}
          >
            <Bookmark size={16} aria-hidden="true" className="shrink-0" />
            <span>Đã lưu</span>
            <span className="ml-1 text-[11px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-[#F1F5F9] font-bold">{saved.length}</span>
          </button>

          <button
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-3 border-b-2 font-semibold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap flex-1 text-center ${
              tab === 'history'
                ? 'border-[#0284C7] text-[#0284C7]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
            aria-pressed={tab === 'history'}
            onClick={() => setParams({ tab: 'history' })}
          >
            <Clock size={16} aria-hidden="true" className="shrink-0" />
            <span>Đã xem</span>
            <span className="ml-1 text-[11px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-[#F1F5F9] font-bold">{history.length}</span>
          </button>
        </div>

        <p className="storage-note text-xs text-[#94A3B8] mb-6">Lưu riêng trên trình duyệt này. Chưa đồng bộ giữa các thiết bị.</p>

        {items.length ? (
          <DocumentGrid items={items} />
        ) : (
          <EmptyState
            title={
              tab === 'uploads'
                ? 'Bạn chưa đăng tài liệu nào.'
                : tab === 'saved'
                ? 'Một chỗ trống cho điều hữu ích.'
                : 'Bạn chưa đọc tài liệu nào.'
            }
            description={
              tab === 'uploads'
                ? 'Tải lên một bản PDF để tạo bản nháp cục bộ và theo dõi trạng thái kiểm tra.'
                : tab === 'saved'
                ? 'Nhấn biểu tượng lưu cạnh một tài liệu để tìm lại ở đây.'
                : 'Mở một tài liệu trong Home hoặc Khám phá để bắt đầu lịch sử đọc.'
            }
          >
            <Link
              to={tab === 'uploads' ? '/upload' : '/explore'}
              className="button primary inline-flex items-center gap-2 bg-[#0284C7] hover:bg-[#0369A1] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors mt-2"
            >
              {tab === 'uploads' ? (
                <>
                  <FileUp size={17} /> Chia sẻ tài liệu ngay bây giờ
                </>
              ) : (
                <>
                  Khám phá tài liệu <ArrowRight size={17} />
                </>
              )}
            </Link>
          </EmptyState>
        )}
      </div>
    </MainLayout>
  );
}

export { LibraryPage as Library };
