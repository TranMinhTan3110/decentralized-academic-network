import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Search, SlidersHorizontal, X } from 'lucide-react';
import { documents, schools, subjects, kinds } from '../../data/documents';
import { filterDocuments, type Filters } from '../../lib/domain';
import { DocumentGrid, EmptyState } from '../../components/ui';

export function Discover() {
  const [params, setParams] = useSearchParams();
  const filters = Object.fromEntries(params) as Filters;
  const [query, setQuery] = useState(filters.q ?? '');
  const [lastQuery, setLastQuery] = useState(filters.q ?? '');

  if (lastQuery !== (filters.q ?? '')) {
    setLastQuery(filters.q ?? '');
    setQuery(filters.q ?? '');
  }

  const [more, setMore] = useState(false);
  const items = filterDocuments(documents, filters);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  const activeFiltersCount = Object.entries(filters).filter(([k, v]) => v && k !== 'sort').length;

  return (
    <div className="discover page-enter max-w-7xl mx-auto px-4 py-4 space-y-6">
      {/* PAGE HEADER */}
      <div className="flex items-start justify-between border-b border-[#E2E8F0] pb-4">
        <div>
          <p className="text-xs font-bold tracking-wider text-[#0284C7] uppercase mb-1">TÀI LIỆU HỌC TẬP</p>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A]">Hôm nay, bạn học gì?</h1>
          <p className="text-sm text-[#64748B] mt-1">Tìm một lời giải, một góc nhìn, một trang ghi chép hữu ích.</p>
        </div>
        <span className="hidden md:block text-xs font-bold text-[#94A3B8]" aria-hidden="true">
          01 / KHÁM PHÁ
        </span>
      </div>

      {/* SEARCH BAR */}
      <form
        className="flex items-center gap-3 bg-white border border-[#CBD5E1] rounded-2xl p-2 pl-4 shadow-sm focus-within:border-[#0284C7] focus-within:ring-2 focus-within:ring-[#0284C7]/20 transition-all"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          update('q', query.trim());
        }}
      >
        <Search size={20} className="text-[#64748B] shrink-0" aria-hidden="true" />
        <input
          aria-label="Tìm theo tên tài liệu, môn học hoặc trường"
          placeholder="Tên tài liệu, môn học hoặc trường đại học"
          className="flex-1 border-none outline-none text-sm text-[#0F172A] placeholder-[#94A3B8] bg-transparent"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            type="button"
            className="p-1 rounded-full hover:bg-[#F1F5F9] text-[#64748B] transition-colors cursor-pointer"
            aria-label="Xóa từ khóa"
            onClick={() => {
              setQuery('');
              update('q', '');
            }}
          >
            <X size={17} />
          </button>
        )}
        <button type="submit" className="inline-flex items-center gap-2 bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors cursor-pointer shadow-sm">
          Tìm kiếm <ArrowRight size={17} aria-hidden="true" />
        </button>
      </form>

      {/* BROWSE SHORTCUT BAR */}
      <div className="flex items-center gap-2 flex-wrap text-xs font-semibold text-[#64748B]">
        <span className="text-[#94A3B8] tracking-wider uppercase text-[11px]">ĐI THẲNG ĐẾN</span>
        {subjects.slice(0, 4).map((s) => (
          <button
            key={s.id}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              filters.subject === s.id
                ? 'bg-[#F0F9FF] text-[#0284C7] border-[#BAE6FD]'
                : 'bg-[#F8FAFC] text-[#334155] border-[#E2E8F0] hover:bg-[#F1F5F9]'
            }`}
            onClick={() => update('subject', filters.subject === s.id ? '' : s.id)}
          >
            {s.name}
            <ArrowUpRight size={13} aria-hidden="true" />
          </button>
        ))}
        <Link to="/mon-hoc" className="inline-flex items-center gap-1 text-[#0284C7] hover:underline ml-auto text-xs font-bold" aria-label="Xem tất cả môn học">
          <span>Tất cả môn</span>
          <ArrowRight size={15} />
        </Link>
      </div>

      {/* DISCOVERY LAYOUT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* RESULTS SECTION */}
        <section className="lg:col-span-8 space-y-4" aria-label="Kết quả tài liệu">
          {/* SECTION HEADER & SORT CONTROL */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-xl font-bold text-[#0F172A]">
                {activeFiltersCount ? 'Kết quả tìm kiếm' : 'Dành cho buổi học tiếp theo'}
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5" aria-live="polite">
                {items.length} tài liệu mẫu{filters.q && ` cho “${filters.q}”`}
              </p>
            </div>
            <label className="flex items-center gap-2">
              <span className="sr-only">Sắp xếp tài liệu</span>
              <select
                className="text-xs font-semibold text-[#334155] border border-[#CBD5E1] rounded-lg px-3 py-1.5 bg-white outline-none cursor-pointer hover:border-[#0284C7] transition-colors"
                value={filters.sort ?? 'newest'}
                onChange={(e) => update('sort', e.target.value)}
              >
                <option value="newest">Mới cập nhật</option>
                <option value="oldest">Cũ nhất trước</option>
                <option value="title">Tên A → Z</option>
              </select>
            </label>
          </div>

          {/* FILTERS BAR */}
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex-1 min-w-[200px]">
              <span className="sr-only">Lọc theo trường</span>
              <select
                className="w-full text-xs font-medium text-[#334155] border border-[#CBD5E1] rounded-lg px-3.5 py-2.5 bg-white outline-none cursor-pointer focus:border-[#0284C7] transition-colors"
                value={filters.school ?? ''}
                onChange={(e) => update('school', e.target.value)}
              >
                <option value="">Tất cả trường</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex-1 min-w-[180px]">
              <span className="sr-only">Lọc theo môn</span>
              <select
                className="w-full text-xs font-medium text-[#334155] border border-[#CBD5E1] rounded-lg px-3.5 py-2.5 bg-white outline-none cursor-pointer focus:border-[#0284C7] transition-colors"
                value={filters.subject ?? ''}
                onChange={(e) => update('subject', e.target.value)}
              >
                <option value="">Tất cả môn học</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            <button
              className={`inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-lg border transition-all cursor-pointer ${
                more || filters.kind || filters.year
                  ? 'bg-[#F0F9FF] text-[#0284C7] border-[#0284C7]'
                  : 'bg-white text-[#334155] border-[#CBD5E1] hover:bg-[#F8FAFC]'
              }`}
              aria-expanded={more}
              onClick={() => setMore(!more)}
            >
              <SlidersHorizontal size={15} aria-hidden="true" />
              Bộ lọc{(filters.kind || filters.year) && ' •'}
            </button>
          </div>

          {/* EXTRA FILTERS COLLAPSIBLE */}
          {(more || filters.kind || filters.year) && (
            <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex gap-4 flex-wrap">
              <label className="flex flex-col gap-1 text-[11px] font-bold text-[#475569]">
                Loại tài liệu
                <select
                  className="text-xs font-medium text-[#334155] border border-[#CBD5E1] rounded-lg px-3 py-1.5 bg-white outline-none cursor-pointer"
                  value={filters.kind ?? ''}
                  onChange={(e) => update('kind', e.target.value)}
                >
                  <option value="">Tất cả loại</option>
                  {kinds.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-[11px] font-bold text-[#475569]">
                Năm học
                <select
                  className="text-xs font-medium text-[#334155] border border-[#CBD5E1] rounded-lg px-3 py-1.5 bg-white outline-none cursor-pointer"
                  value={filters.year ?? ''}
                  onChange={(e) => update('year', e.target.value)}
                >
                  <option value="">Tất cả năm</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
              </label>
            </div>
          )}

          {/* ACTIVE FILTERS ACCENT ROW */}
          {activeFiltersCount > 0 && (
            <div className="bg-white border border-[#E2E8F0] border-l-4 border-l-[#0284C7] rounded-r-lg p-3 flex items-center justify-between shadow-xs">
              <span className="text-xs font-medium text-[#334155]">
                Đang áp dụng <strong className="font-bold text-[#0F172A]">{activeFiltersCount}</strong> điều kiện
              </span>
              <button
                className="text-xs font-semibold text-[#0284C7] hover:underline flex items-center gap-1 cursor-pointer"
                onClick={() => {
                  setParams({});
                  setQuery('');
                }}
              >
                Xóa bộ lọc <X size={14} />
              </button>
            </div>
          )}

          {/* DOCUMENT GRID OR EMPTY STATE */}
          {items.length ? (
            <DocumentGrid items={items} />
          ) : (
            <EmptyState
              title="Chưa tìm thấy tài liệu phù hợp"
              description="Thử một từ khóa ngắn hơn hoặc bỏ bớt bộ lọc."
            >
              <button
                className="px-4 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                onClick={() => {
                  setParams({});
                  setQuery('');
                }}
              >
                Xem tất cả tài liệu
              </button>
            </EmptyState>
          )}

          <p className="text-center text-xs text-[#94A3B8] pt-2">
            Bạn đã xem hết {items.length} tài liệu trong danh sách này.
          </p>
        </section>

        {/* ASIDE SIDEBAR */}
        <aside className="lg:col-span-4 space-y-6">
          {/* EDITOR NOTE BANNER CARD */}
          <div className="bg-[#FFF7F2] border-l-4 border-l-[#1E3A8A] rounded-xl p-6 relative overflow-hidden shadow-xs">
            <span className="text-[10px] font-bold tracking-widest text-[#64748B] uppercase mb-3 block">
              MỘT CHÚT GỢI Ý
            </span>
            <h2 className="text-2xl font-bold text-[#0F172A] leading-snug mb-3">
              Bắt đầu từ
              <br />
              điều chưa hiểu.
            </h2>
            <p className="text-xs text-[#475569] leading-relaxed mb-4">
              Chọn một môn học, đọc lại phần kiến thức nền rồi thử giải bài tập bằng cách của bạn.
            </p>
            <Link to="/mon-hoc" className="text-xs font-bold text-[#0284C7] hover:underline inline-flex items-center gap-1">
              Khám phá theo môn <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <span className="absolute right-4 bottom-1 text-4xl font-serif text-[#EA580C]/20 font-bold select-none pointer-events-none" aria-hidden="true">
              a → b
            </span>
          </div>

          {/* SCHOOL INDEX */}
          <section className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold text-[#0F172A]">Theo trường</h2>
              <Link to="/truong" className="text-[#64748B] hover:text-[#0284C7] p-1 rounded transition-colors" aria-label="Xem tất cả trường">
                <ArrowUpRight size={17} />
              </Link>
            </div>

            <div className="space-y-2">
              {schools.map((s) => {
                const isSelected = filters.school === s.id;
                const docCount = documents.filter((d) => d.school === s.id).length;
                return (
                  <button
                    key={s.id}
                    onClick={() => update('school', isSelected ? '' : s.id)}
                    className={`w-full text-left flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#F0F9FF] border-2 border-[#0284C7] shadow-xs'
                        : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <span className="px-2.5 py-1 text-xs font-extrabold bg-[#E0F2FE] text-[#0284C7] rounded-md border border-[#BAE6FD] shrink-0">
                      {s.short}
                    </span>
                    <div className="flex-1 min-w-0 mx-3">
                      <span className="font-bold text-xs md:text-sm text-[#0F172A] block truncate">{s.name}</span>
                      <span className="text-[11px] text-[#64748B]">{docCount} tài liệu mẫu</span>
                    </div>
                    <ArrowUpRight size={16} className={`shrink-0 ${isSelected ? 'text-[#0284C7]' : 'text-[#94A3B8]'}`} aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </section>

          <p className="text-[11px] text-[#94A3B8] leading-relaxed">
            Các tài liệu được tự biên soạn để trải nghiệm sản phẩm. Tên trường dùng để minh họa bộ
            lọc, không phải nguồn phát hành.
          </p>
        </aside>
      </div>
    </div>
  );
}
