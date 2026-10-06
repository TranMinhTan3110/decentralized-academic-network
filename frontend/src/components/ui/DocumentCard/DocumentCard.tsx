import { useState } from 'react';
import { Bookmark, FileText, GraduationCap, User, ArrowUpRight } from 'lucide-react';
import { schools, type DocumentItem } from '../../../data/documents';

interface DocumentCardProps {
  document: DocumentItem;
}

export function DocumentCard({ document }: DocumentCardProps) {
  const [saved, setSaved] = useState(false);

  const schoolObj = schools.find((s) => s.id === document.school);
  const schoolName = schoolObj ? schoolObj.name : document.school || 'Đại học Kinh tế Quốc dân';

  const defaultGradients = [
    'from-[#d946ef] via-[#a855f7] to-[#ec4899]',
    'from-[#6366f1] via-[#8b5cf6] to-[#d946ef]',
    'from-[#0284c7] via-[#3b82f6] to-[#8b5cf6]',
    'from-[#0ea5e9] to-[#2563eb]',
  ];

  const gradientClass =
    document.gradient || defaultGradients[Math.abs(document.id.length) % defaultGradients.length];

  return (
    <article className="feed-card bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      {/* CARD TOP BANNER WITH GRADIENT */}
      <div className={`p-6 text-white text-center flex flex-col items-center justify-center min-h-[175px] relative bg-gradient-to-br ${gradientClass}`}>
        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center mb-3 shadow-inner">
          <FileText className="w-7 h-7 text-white" />
        </div>
        <h4 className="text-base font-bold text-white text-center line-clamp-2 px-2 mb-3 leading-snug">
          {document.title}
        </h4>
        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-black/25 text-white/95 rounded-full backdrop-blur-xs">
          {document.kind || 'Đề cương'} • {document.pages} trang
        </span>
      </div>

      {/* CARD BODY & METADATA */}
      <div className="p-4 flex flex-col gap-2 flex-grow justify-between">
        <div>
          {/* TAGS */}
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-[#E0F2FE] text-[#0284C7] rounded-md border border-[#BAE6FD]">
              {document.category}
            </span>
            {document.year && (
              <span className="px-2 py-0.5 text-xs font-medium bg-[#F1F5F9] text-[#64748B] rounded-md">
                {document.year}
              </span>
            )}
          </div>

          {/* TITLE */}
          <h3 className="text-sm md:text-base font-bold text-[#0F172A] leading-snug mb-2 group-hover:text-[#0284C7] transition-colors line-clamp-1">
            {document.title}
          </h3>

          {/* SCHOOL */}
          <div className="flex items-center gap-2 text-xs text-[#64748B] mb-1">
            <GraduationCap size={15} className="shrink-0 text-[#64748B]" />
            <span className="truncate">{schoolName}</span>
          </div>

          {/* AUTHOR */}
          <div className="flex items-center gap-2 text-xs text-[#64748B] mb-2">
            <User size={15} className="shrink-0 text-[#64748B]" />
            <span>Đăng bởi: {document.author.name}</span>
          </div>
        </div>

        {/* FOOTER */}
        <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs text-[#64748B]">
          <span className="flex items-center gap-1.5 font-medium text-[#64748B]">
            <FileText size={15} />
            <span>{document.pages} trang</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSaved(!saved)}
              className={`p-1.5 rounded-lg border border-[#E2E8F0] hover:border-[#0284C7] transition-colors cursor-pointer ${
                saved ? 'bg-[#F0F9FF] text-[#0284C7] border-[#0284C7]' : 'bg-white text-[#64748B]'
              }`}
              aria-label="Lưu bài viết"
            >
              <Bookmark size={15} fill={saved ? 'currentColor' : 'none'} />
            </button>
            <button
              className="w-7 h-7 rounded-full bg-[#0284C7] hover:bg-[#0369A1] text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer"
              aria-label="Xem chi tiết"
            >
              <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
