import { useState } from 'react';
import { Bookmark, FileSpreadsheet, FileText, GraduationCap, User, ArrowUpRight } from 'lucide-react';
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
  const fileExt = String(anyDoc.fileExtension || '').replace(/^\./, '').toLowerCase().trim();
  const isSpreadsheet = fileExt === 'xlsx' || fileExt === 'xls' || fileExt === 'csv';
  const detailUrl = `/detail/${document.id}`;

  const extBadgeConfig: Record<string, { label: string; className: string }> = {
    pdf: { label: '.PDF', className: 'bg-rose-600/90 text-white' },
    docx: { label: '.DOCX', className: 'bg-sky-600/90 text-white' },
    doc: { label: '.DOC', className: 'bg-sky-600/90 text-white' },
    xlsx: { label: '.XLSX', className: 'bg-emerald-600/90 text-white' },
    xls: { label: '.XLS', className: 'bg-emerald-600/90 text-white' },
    csv: { label: '.CSV', className: 'bg-emerald-600/90 text-white' },
    pptx: { label: '.PPTX', className: 'bg-amber-600/90 text-white' },
    ppt: { label: '.PPT', className: 'bg-amber-600/90 text-white' },
    txt: { label: '.TXT', className: 'bg-slate-600/90 text-white' },
  };
  const badgeInfo = fileExt ? extBadgeConfig[fileExt] : undefined;

  return (
    <article className="feed-card bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-[#CBD5E1] transition-all duration-200 flex flex-col justify-between group h-full">
      {/* CARD TOP PREVIEW — khung khay giấy A4 căn giữa giúp thấy trọn trang đầu không bị phóng vỡ */}
      <Link
        to={detailUrl}
        className={`relative block h-[210px] overflow-hidden border-b border-[#E2E8F0] ${
          anyDoc.thumbnailUrl && !thumbnailFailed
            ? 'bg-gradient-to-b from-[#F1F5F9] to-[#E2E8F0]/70 p-3.5 flex items-center justify-center'
            : isSpreadsheet
              ? 'text-white text-center flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#10B981] to-[#047857] hover:from-[#059669] hover:to-[#065F46] transition-colors'
              : 'text-white text-center flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#0284C7] to-[#0369A1] hover:from-[#0369A1] hover:to-[#075985] transition-colors'
        }`}
      >
        {anyDoc.thumbnailUrl && !thumbnailFailed ? (
          <>
            <div className="relative h-full w-auto max-w-full aspect-[3/4] rounded-lg overflow-hidden bg-white shadow-sm ring-1 ring-slate-900/8 transition-transform duration-200 group-hover:scale-[1.03] group-hover:shadow-md">
              <img
                src={anyDoc.thumbnailUrl}
                alt={`Trang đầu tiên: ${document.title}`}
                loading="lazy"
                onError={() => setThumbnailFailed(true)}
                className="w-full h-full object-cover object-top"
              />
            </div>
            {badgeInfo && (
              <span
                className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wide shadow-xs backdrop-blur-[2px] ${badgeInfo.className}`}
              >
                {badgeInfo.label}
              </span>
            )}
          </>
        ) : isSpreadsheet ? (
          <>
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage:
                  'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
              aria-hidden="true"
            />
            <div className="relative w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center mb-3 shadow-inner">
              <FileSpreadsheet className="w-7 h-7 text-white" />
            </div>
            <h4 className="relative text-base font-bold text-white text-center line-clamp-2 px-2 mb-3 leading-snug">
              {document.title}
            </h4>
            <span className="relative inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-black/20 text-white/95 rounded-full">
              <span>.{fileExt.toUpperCase()}</span>
              <span>•</span>
              <span>{docTypeLabel(anyDoc.docType || document.kind)}</span>
            </span>
          </>
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
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <span
              className="px-2 py-0.5 text-[11px] font-semibold bg-[#E0F2FE] text-[#0369A1] rounded-md border border-[#BAE6FD]/80 truncate max-w-[175px]"
              title={categoryName}
            >
              {categoryName}
            </span>
            {(anyDoc.academicYear || document.year) && (
              <span className="px-2 py-0.5 text-[11px] font-medium bg-[#F1F5F9] text-[#64748B] rounded-md shrink-0">
                {anyDoc.academicYear || document.year}
              </span>
            )}
          </div>

          {/* TITLE */}
          <Link to={detailUrl} className="block">
            <h3
              className="text-sm font-bold text-[#0F172A] leading-snug mb-2.5 hover:text-[#0284C7] transition-colors line-clamp-2 min-h-[2.5rem]"
              title={document.title}
            >
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
            <span>
              Đăng bởi:{' '}
              {anyDoc.author?.username || anyDoc.author?.id || anyDoc.userId ? (
                <Link
                  to={`/profile/${String(anyDoc.author?.username || anyDoc.author?.id || anyDoc.userId).replace('@', '')}`}
                  className="font-medium text-[#0F172A] hover:text-[#0284C7] hover:underline transition-colors"
                >
                  {authorName}
                </Link>
              ) : (
                authorName
              )}
            </span>
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
