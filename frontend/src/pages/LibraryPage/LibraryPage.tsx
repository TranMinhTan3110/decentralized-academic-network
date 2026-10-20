import { useState, useEffect } from 'react';
import { ArrowRight, Bookmark, Clock, FileUp, UploadCloud, Eye, Download, Unlock, Loader2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLibrary } from '../../lib/store';
import { useSocial } from '../../lib/socialStore';
import { useAuth } from '../../lib/authStore';
import { DocumentGrid, EmptyState } from '../../components';
import { MainLayout } from '../../components/layout';
import { documentService } from '../../services/documentService';

export function LibraryPage() {
  const { isAuthenticated, currentUser } = useAuth();
  const libraryStore = useLibrary();
  const saved = libraryStore?.saved ?? libraryStore?.savedDocIds ?? [];
  const history = libraryStore?.history ?? libraryStore?.viewedDocIds ?? [];

  const socialStore = useSocial();
  const uploadedDocumentIds = socialStore?.uploadedDocumentIds ?? [];

  const [params, setParams] = useSearchParams();
  const currentTabParam = params.get('tab') ?? '';
  const tab = ['saved', 'unlocked', 'history'].includes(currentTabParam) ? currentTabParam : 'uploads';

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);

    const fetchTabData = async () => {
      try {
        let res: any = null;
        if (tab === 'saved') {
          res = await documentService.getMyBookmarks(0, 50);
        } else if (tab === 'unlocked') {
          res = await documentService.getMyUnlockedDocuments(0, 50);
        } else if (tab === 'uploads') {
          res = await documentService.getFeed({ filter: 'my-uploads', page: 0, size: 50 });
        } else if (tab === 'history') {
          if (history.length === 0) {
            if (active) {
              setItems([]);
              setLoading(false);
            }
            return;
          }
          const details = await Promise.all(
            history.map((id) => documentService.getDetail(id).catch(() => null))
          );
          if (active) {
            setItems(details.filter(Boolean));
            setLoading(false);
          }
          return;
        }

        if (active && res && Array.isArray(res.content)) {
          const mapped = res.content.map((item: any) => ({
            ...item,
            category: item.courseName || item.facultyName || item.category || 'Học thuật',
            school: item.universityId || item.school || 'Đại học',
            kind: item.documentType || item.kind || 'Tài liệu',
            year: item.academicYear || item.year || '2026',
            pages: item.pageCount || item.pages || 1,
            author: item.author || { name: 'Thành viên' },
          }));
          setItems(mapped);
        } else if (active) {
          setItems([]);
        }
      } catch {
        if (active) setItems([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchTabData();

    return () => {
      active = false;
    };
  }, [tab, tab === 'history' ? history.join(',') : '']);

  const uploadedCount = tab === 'uploads' ? items.length : uploadedDocumentIds.length;
  const savedCount = tab === 'saved' ? items.length : saved.length;
  const unlockedCount = tab === 'unlocked' ? items.length : 0;
  const historyCount = history.length;

  const titles: Record<string, string> = {
    uploads: 'Tài liệu đã đăng',
    saved: 'Đã lưu',
    unlocked: 'Đã mở khóa',
    history: 'Đã xem gần đây',
  };

  return (
    <MainLayout isAuthenticated={isAuthenticated} currentUser={currentUser}>
      <div className="library-page page-enter max-w-7xl mx-auto">
        <p className="eyebrow text-xs font-bold tracking-wider text-[#0284C7] uppercase mb-1">KHÔNG GIAN CÁ NHÂN</p>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A] mb-1">{titles[tab]}</h1>
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
            <span className="ml-1 text-[11px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-[#F1F5F9] font-bold">{uploadedCount}</span>
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
            <span className="ml-1 text-[11px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-[#F1F5F9] font-bold">{savedCount}</span>
          </button>

          <button
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-3 border-b-2 font-semibold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap flex-1 text-center ${
              tab === 'unlocked'
                ? 'border-[#0284C7] text-[#0284C7]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
            aria-pressed={tab === 'unlocked'}
            onClick={() => setParams({ tab: 'unlocked' })}
          >
            <Unlock size={16} aria-hidden="true" className="shrink-0" />
            <span>Đã mở khóa</span>
            <span className="ml-1 text-[11px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-[#F1F5F9] font-bold">{unlockedCount}</span>
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
            <span className="ml-1 text-[11px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-[#F1F5F9] font-bold">{historyCount}</span>
          </button>
        </div>

        <p className="storage-note text-xs text-[#94A3B8] mb-6">Đồng bộ trực tiếp qua tài khoản học thuật & đám mây IPFS.</p>

        {loading ? (
          <div className="py-16 flex items-center justify-center gap-2 text-sm text-[#64748B]">
            <Loader2 size={20} className="animate-spin text-[#0284C7]" />
            <span>Đang tải danh sách tài liệu...</span>
          </div>
        ) : items.length ? (
          <DocumentGrid items={items} />
        ) : (
          <EmptyState
            title={
              tab === 'uploads'
                ? 'Bạn chưa đăng tài liệu nào.'
                : tab === 'saved'
                ? 'Một chỗ trống cho điều hữu ích.'
                : tab === 'unlocked'
                ? 'Bạn chưa mở khóa tài liệu nào.'
                : 'Bạn chưa đọc tài liệu nào.'
            }
            description={
              tab === 'uploads'
                ? 'Tải lên một bản PDF để tạo bản nháp cục bộ và theo dõi trạng thái kiểm tra.'
                : tab === 'saved'
                ? 'Nhấn biểu tượng lưu cạnh một tài liệu để tìm lại ở đây.'
                : tab === 'unlocked'
                ? 'Mở khóa tài liệu có phí bằng điểm thưởng để đọc toàn bộ nội dung.'
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
