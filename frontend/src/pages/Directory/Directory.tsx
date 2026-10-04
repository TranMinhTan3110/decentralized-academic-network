import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Search } from 'lucide-react';
import { documents, schools, subjects } from '../../data/documents';
import { normalize } from '../../lib/domain';
import { EmptyState } from '../../components/ui';

export function Directory({ type }: { type: 'school' | 'subject' }) {
  const [query, setQuery] = useState('');
  const isSchool = type === 'school';

  const entries = isSchool
    ? schools.map((s) => ({
        ...s,
        detail: s.city || 'Hà Nội',
        code: s.short,
      }))
    : subjects.map((s) => ({
        ...s,
        detail: s.area || 'Môn học',
        code: s.code || s.name.substring(0, 2).toUpperCase(),
      }));

  const found = entries.filter((s) =>
    normalize((s.name ?? '') + ' ' + (s.code ?? '')).includes(normalize(query))
  );

  return (
    <div className="directory page-enter max-w-5xl mx-auto px-4 py-4 space-y-6">
      {/* EYEBROW & TITLE & INTRO */}
      <div>
        <p className="eyebrow text-xs font-bold tracking-widest text-[#0284C7] uppercase mb-1">
          TRA CỨU / {isSchool ? 'TRƯỜNG ĐẠI HỌC' : 'MÔN HỌC'}
        </p>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A] leading-tight">
          {isSchool ? 'Mỗi trường, một kho kiến thức.' : 'Tìm đúng môn. Học đúng phần.'}
        </h1>
        <p className="intro text-sm text-[#64748B] mt-1.5 leading-relaxed">
          {isSchool
            ? 'Chọn trường để xem các tài liệu được gắn nhãn tương ứng trong kho mẫu.'
            : 'Từ kiến thức nền đến bài tập, bắt đầu bằng môn học bạn đang quan tâm.'}
        </p>
      </div>

      {/* SEARCH INPUT BAR */}
      <div className="directory-search flex items-center gap-3 bg-white border border-[#CBD5E1] rounded-2xl px-4 py-3 shadow-xs focus-within:border-[#0284C7] focus-within:ring-2 focus-within:ring-[#0284C7]/20 transition-all max-w-xl">
        <Search size={19} className="text-[#64748B] shrink-0" aria-hidden="true" />
        <input
          aria-label={isSchool ? 'Tìm trường đại học' : 'Tìm môn học'}
          placeholder={isSchool ? 'Tên trường hoặc tên viết tắt' : 'Nhập tên môn học'}
          className="flex-1 border-none outline-none text-sm text-[#0F172A] placeholder-[#94A3B8] bg-transparent"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* DIRECTORY HEADING ROW */}
      <div className="directory-heading pt-6 border-t-2 border-[#0F172A] flex items-center justify-between text-xs font-bold">
        <span className="text-[#475569]">
          {found.length} {isSchool ? 'trường đại học' : 'môn học'}
        </span>
        <span className="text-[#94A3B8] tracking-wider uppercase text-[11px]">
          DANH MỤC TÀI LIỆU MẪU
        </span>
      </div>

      {/* DIRECTORY LIST */}
      <div className="directory-list divide-y divide-[#F1F5F9]">
        {found.map((s, index) => {
          const docCount = documents.filter((d) => d[type] === s.id).length;
          return (
            <Link
              to={`/explore?${type}=${s.id}`}
              key={s.id}
              className="group flex items-center gap-4 md:gap-6 py-4 transition-colors hover:bg-[#F8FAFC] rounded-xl px-2"
            >
              {/* INDEX NUMBER */}
              <span className="directory-number text-xs font-semibold text-[#94A3B8] w-6 shrink-0">
                {String(index + 1).padStart(2, '0')}
              </span>

              {/* CODE BADGE / SQUARE BOX */}
              <span
                className={`directory-code shrink-0 w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-sm md:text-base font-extrabold shadow-xs transition-transform group-hover:scale-105 ${
                  isSchool
                    ? 'school-code bg-[#F0F9FF] text-[#0284C7] border border-[#BAE6FD]'
                    : 'bg-[#2563EB] text-white'
                }`}
              >
                {s.code}
              </span>

              {/* TITLE & DETAIL */}
              <span className="directory-title flex-1 min-w-0">
                <h2 className="text-base font-bold text-[#0F172A] group-hover:text-[#0284C7] transition-colors truncate">
                  {s.name}
                </h2>
                <span className="text-xs text-[#64748B] block mt-0.5">{s.detail}</span>
              </span>

              {/* COUNT & ARROW */}
              <span className="directory-count flex items-center gap-2 text-xs font-semibold text-[#64748B] group-hover:text-[#0284C7] transition-colors shrink-0">
                <span>{docCount} tài liệu</span>
                <ArrowUpRight size={18} className="text-[#0F172A] group-hover:text-[#0284C7] transition-colors" aria-hidden="true" />
              </span>
            </Link>
          );
        })}
      </div>

      {!found.length && (
        <EmptyState
          title="Không có kết quả"
          description="Thử tìm bằng tên ngắn hơn hoặc tên không dấu."
        />
      )}

      <p className="honest-note text-xs text-[#94A3B8] pt-4 border-t border-[#F1F5F9]">
        Danh mục chỉ phản ánh dữ liệu có trong bản trải nghiệm này.
      </p>
    </div>
  );
}
