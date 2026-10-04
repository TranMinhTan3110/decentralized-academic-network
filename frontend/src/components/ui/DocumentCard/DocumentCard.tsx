import { Link } from 'react-router-dom';
import { Bookmark, FileText, ArrowUpRight } from 'lucide-react';
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
      className={`button secondary flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium cursor-pointer transition-colors ${
        saved ? 'bg-[#F0F9FF] text-[#0284C7] border-[#BAE6FD]' : 'bg-white text-[#334155] border-[#CBD5E1] hover:bg-[#F8FAFC]'
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
    <article className="bg-white border border-[#E2E8F0] rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 hover:border-[#0284C7] transition-all shadow-xs">
      {/* LEFT THUMBNAIL BADGE */}
      <div className="w-full md:w-32 h-28 bg-gradient-to-br from-[#8B5CF6] to-[#C084FC] rounded-xl p-3 flex flex-col justify-between text-white shrink-0 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20 backdrop-blur-xs">
          <FileText size={18} />
        </div>
        <div>
          <p className="font-bold text-xs leading-tight line-clamp-1">{item.title}</p>
          <div className="mt-1 bg-black/20 backdrop-blur-xs text-[10px] px-2 py-0.5 rounded text-white/90 inline-block font-medium">
            {item.kind} • {pageCount} trang
          </div>
        </div>
      </div>

      {/* MIDDLE CONTENT */}
      <div className="flex-1 min-w-0 flex flex-col justify-between gap-1">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-xs font-semibold text-[#0284C7] bg-[#F0F9FF] border border-[#BAE6FD] px-2.5 py-0.5 rounded-md">
            {subjectName(item.subject)}
          </span>
          <span className="text-xs font-semibold text-[#475569] bg-[#F1F5F9] px-2.5 py-0.5 rounded-md">
            {item.kind}
          </span>
        </div>

        <h3 className="font-bold text-[#0F172A] text-base md:text-lg hover:text-[#0284C7] transition-colors leading-snug">
          <Link to={`/detail/${item.id}`}>{item.title}</Link>
        </h3>

        <p className="text-xs md:text-sm text-[#64748B]">{schoolName(item.school)}</p>

        <div className="flex items-center gap-4 text-xs text-[#94A3B8] mt-2">
          <span className="flex items-center gap-1">
            <FileText size={14} /> {pageCount} trang
          </span>
          <span>Năm {item.year}</span>
          <span>{new Date(item.updated).toLocaleDateString('vi-VN')}</span>
        </div>
      </div>

      {/* RIGHT ACTIONS */}
      <div className="flex md:flex-col justify-between items-end gap-3 shrink-0">
        <button
          onClick={() => toggleSave(item.id)}
          className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
            saved
              ? 'bg-[#F0F9FF] text-[#0284C7] border-[#BAE6FD]'
              : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
          }`}
          aria-label={saved ? 'Đã lưu' : 'Lưu tài liệu'}
        >
          <Bookmark size={18} fill={saved ? '#0284C7' : 'none'} />
        </button>

        <Link
          to={`/detail/${item.id}`}
          className="w-10 h-10 rounded-full bg-[#0284C7] hover:bg-[#0369A1] text-white flex items-center justify-center transition-colors shadow-xs"
          aria-label={`Xem chi tiết ${item.title}`}
        >
          <ArrowUpRight size={20} />
        </Link>
      </div>
    </article>
  );
}
