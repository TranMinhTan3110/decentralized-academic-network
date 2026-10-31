import { useState } from 'react';
import { Bookmark, FileText, GraduationCap, User, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DocumentItem } from '../../../data/documents';
import { docTypeLabel } from '../../../lib/docTypes';

interface DocumentCardProps {
    document: DocumentItem;
}

export function DocumentCard({ document }: DocumentCardProps) {
  const [saved, setSaved] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);

  const anyDoc = document as any;
  const pageCount = Array.isArray(document.pages) ? document.pages.length : (anyDoc.totalPages ?? document.pages ?? 1);
  const schoolName = anyDoc.universityName || document.school || 'Chưa phân loại trường';
  const authorName = anyDoc.author?.fullName || document.author?.name || 'Thành viên';
  const categoryName = anyDoc.courseName || document.category || 'Học thuật';
  const detailUrl = `/detail/${document.id}`;

  return (
    <article className="feed-card bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      {/* CARD TOP BANNER — chỉ ảnh trang đầu; fallback banner xanh cho tài liệu thiếu thumbnail */}
      <Link
        to={detailUrl}
        className={`relative block min-h-[175px] overflow-hidden ${
          anyDoc.thumbnailUrl && !thumbnailFailed ? '' : 'text-white text-center flex flex-col items-center justify-center p-6 bg-[#0284c7] hover:bg-[#0369a1] transition-colors'
        }`}
      >
        {anyDoc.thumbnailUrl && !thumbnailFailed ? (
          <img
            src={anyDoc.thumbnailUrl}
            alt={`Trang đầu tiên: ${document.title}`}
            loading="lazy"
            onError={() => setThumbnailFailed(true)}
            className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-200 group-hover:scale-[1.02]"
          />
        ) : (
          <>
            <div className="relative w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center mb-3 shadow-inner">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <h4 className="relative text-base font-bold text-white text-center line-clamp-2 px-2 mb-3 leading-snug">
              {document.title}
            </h4>
            <span className="relative inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-black/20 text-white/95 rounded-full">
              {docTypeLabel(anyDoc.docType || document.kind)} • {pageCount} trang
            </span>
          </>
        )}
      </Link>

      {/* CARD BODY & METADATA */}
      <div className="p-4 flex flex-col gap-2 flex-grow justify-between">
        <div>
          {/* TAGS */}
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-[#E0F2FE] text-[#0284C7] rounded-md border border-[#BAE6FD]">
              {categoryName}
            </span>
            {(anyDoc.academicYear || document.year) && (
              <span className="px-2 py-0.5 text-xs font-medium bg-[#F1F5F9] text-[#64748B] rounded-md">
                {anyDoc.academicYear || document.year}
              </span>
            )}
          </div>

          {/* TITLE */}
          <Link to={detailUrl} className="block">
            <h3 className="text-sm md:text-base font-bold text-[#0F172A] leading-snug mb-2 hover:text-[#0284C7] transition-colors line-clamp-1">
              {document.title}
            </h3>
          </Link>

          {/* SCHOOL */}
          <div className="flex items-center gap-2 text-xs text-[#64748B] mb-1">
            <GraduationCap size={15} className="shrink-0 text-[#64748B]" />
            <span className="truncate">{schoolName}</span>
          </div>

          {/* AUTHOR */}
          <div className="flex items-center gap-2 text-xs text-[#64748B] mb-2">
            <User size={15} className="shrink-0 text-[#64748B]" />
            <span>Đăng bởi: {authorName}</span>
          </div>
        </div>

        {/* FOOTER */}
        <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs text-[#64748B]">
          <span className="flex items-center gap-1.5 font-medium text-[#64748B]">
            <FileText size={15} />
            <span>{pageCount} trang</span>
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
            <Link
              to={detailUrl}
              className="w-7 h-7 rounded-full bg-[#0284C7] hover:bg-[#0369A1] text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer"
              aria-label="Xem chi tiết"
            >
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
