import { Link } from 'react-router-dom';
import { Bookmark, FileText, ArrowUpRight, GraduationCap, User } from 'lucide-react';
import { type DocumentItem, schoolName, subjectName } from '../../../data/documents';
import { useLibrary } from '../../../lib/store';

export interface DocumentCardProps {
  document: DocumentItem;
}

export function SaveButton({ documentId }: { documentId: string }) {
  const { isSaved, toggleSave } = useLibrary();
  const saved = isSaved(documentId);

  return (
    <button
      onClick={() => toggleSave(documentId)}
      className={`button secondary flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium cursor-pointer transition-colors ${saved ? 'bg-[#F0F9FF] text-[#0284C7] border-[#BAE6FD]' : 'bg-white text-[#334155] border-[#CBD5E1] hover:bg-[#F8FAFC]'
        }`}
    >
      <Bookmark size={16} fill={saved ? '#0284C7' : 'none'} />
      <span>{saved ? 'Đã lưu' : 'Lưu'}</span>
    </button>
  );
}

export function DocumentCard({ document: item }: DocumentCardProps) {
  const { isSaved, toggleSave } = useLibrary();
  const saved = isSaved(item.id);
  const pageCount = Array.isArray(item.pages) ? item.pages.length : item.pages;

  return (
    <article className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden hover:border-[#0284C7] hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full cursor-pointer">
      {/* TOP GRADIENT BANNER */}
      <div className="h-44 bg-gradient-to-br from-[#6366F1] via-[#8B5CF6] to-[#D946EF] p-5 flex flex-col items-center justify-center text-center text-white relative shrink-0">
        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center mb-3 shadow-inner">
          <FileText size={22} className="text-white" />
        </div>
        <h3 className="font-bold text-base md:text-lg leading-snug line-clamp-2 px-2 mb-3 text-white">
          {item.title}
        </h3>
        <span className="bg-black/25 backdrop-blur-xs text-xs px-3 py-1 rounded-full text-white/95 font-medium">
          {item.kind} • {pageCount} trang
        </span>
      </div>

      {/* BODY & FOOTER */}
      <div className="p-4 md:p-5 flex flex-col justify-between flex-1 gap-3">
        <div>
          {/* BADGES */}
          <div className="flex items-center gap-2 flex-wrap mb-2.5">
            <span className="text-xs font-semibold text-[#0284C7] bg-[#F0F9FF] border border-[#BAE6FD] px-2.5 py-0.5 rounded-md">
              {subjectName(item.subject)}
            </span>
            <span className="text-xs font-semibold text-[#475569] bg-[#F1F5F9] px-2.5 py-0.5 rounded-md">
              {item.year}
            </span>
          </div>

          {/* TITLE */}
          <h4 className="font-bold text-[#0F172A] text-base hover:text-[#0284C7] transition-colors leading-snug mb-2 line-clamp-2">
            <Link to={`/detail/${item.id}`}>{item.title}</Link>
          </h4>

          {/* SCHOOL & AUTHOR */}
          <div className="space-y-1 text-xs text-[#64748B]">
            <p className="flex items-center gap-1.5">
              <GraduationCap size={15} className="shrink-0 text-[#94A3B8]" />
              <span className="line-clamp-1">{schoolName(item.school)}</span>
            </p>
            <p className="flex items-center gap-1.5">
              <User size={15} className="shrink-0 text-[#94A3B8]" />
              <span className="line-clamp-1">
                Đăng bởi: <strong className="font-medium text-[#334155]">{item.author?.name || 'Lan Chi'}</strong>
              </span>
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs text-[#64748B] mt-1">
          <span className="flex items-center gap-1.5 font-medium">
            <FileText size={15} className="text-[#94A3B8]" />
            <span>{pageCount} trang</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleSave(item.id)}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${saved
                  ? 'bg-[#F0F9FF] text-[#0284C7] border-[#BAE6FD]'
                  : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                }`}
              aria-label={saved ? 'Đã lưu' : 'Lưu tài liệu'}
            >
              <Bookmark size={16} fill={saved ? '#0284C7' : 'none'} />
            </button>

            <Link
              to={`/detail/${item.id}`}
              className="w-8 h-8 rounded-full bg-[#0284C7] hover:bg-[#0369A1] text-white flex items-center justify-center transition-colors shadow-xs"
              aria-label={`Xem chi tiết ${item.title}`}
            >
              <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
