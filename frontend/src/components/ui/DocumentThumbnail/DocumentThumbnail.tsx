import { useState } from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';

export interface DocumentThumbnailProps {
  thumbnailUrl?: string | null;
  title?: string;
  /** Nhãn hiển thị trong fallback (mặc định: "Tài liệu") */
  label?: string;
  /** Phần mở rộng tệp (pdf, docx, xlsx, xls, csv, pptx...) */
  fileExtension?: string | null;
  className?: string;
}

const SPREADSHEET_EXTS = new Set(['xlsx', 'xls', 'csv']);

/**
 * Ảnh trang đầu tiên của tài liệu (thumbnail do backend render từ PDFBox lúc upload).
 * - Tệp bảng tính (.xlsx / .xls / .csv): hiển thị thẻ nhận diện Excel sắc nét thay vì thu nhỏ bảng chữ dày đặc gây vỡ/mờ.
 * - Có ảnh: <img> lazy-load, object-cover, skeleton trong lúc tải.
 * - Ảnh lỗi (IPFS gateway offline/chậm) hoặc không có: fallback về ô icon quen thuộc.
 */
export function DocumentThumbnail({
  thumbnailUrl,
  title,
  label = 'Tài liệu',
  fileExtension,
  className = '',
}: DocumentThumbnailProps) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>(
    thumbnailUrl ? 'loading' : 'error'
  );

  const normalizedExt = (fileExtension || '').replace(/^\./, '').toLowerCase().trim();
  const isSpreadsheet =
    SPREADSHEET_EXTS.has(normalizedExt) ||
    (!normalizedExt && /\.(xlsx|xls|csv)$/i.test(title || ''));
  const extBadge = normalizedExt ? normalizedExt.toUpperCase() : 'XLSX';

  if (!thumbnailUrl || status === 'error') {
    if (isSpreadsheet) {
      return (
        <div
          className={`relative overflow-hidden bg-gradient-to-br from-[#10B981] to-[#047857] flex flex-col items-center justify-center text-white shrink-0 shadow-xs p-2 text-center select-none ${className}`}
          title={title}
        >
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
              backgroundSize: '14px 14px',
            }}
            aria-hidden="true"
          />
          <FileSpreadsheet size={26} className="relative mb-1 stroke-[1.9] drop-shadow-xs" aria-hidden="true" />
          <span className="relative px-1.5 py-0.5 rounded-md bg-white/20 backdrop-blur-[2px] text-[10px] font-extrabold tracking-wider leading-none uppercase border border-white/25">
            {extBadge}
          </span>
        </div>
      );
    }

    return (
      <div
        className={`bg-[#0284c7] flex flex-col items-center justify-center text-white shrink-0 shadow-xs p-1.5 text-center ${className}`}
        title={title}
      >
        <FileText size={28} className="mb-1 stroke-[1.75]" />
        <span className="text-xs font-semibold tracking-wide leading-tight line-clamp-1">{label}</span>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-white border border-[#E2E8F0] shrink-0 ${className}`}
      title={title}
    >
      {status === 'loading' && (
        <div className="absolute inset-0 animate-pulse bg-[#E2E8F0]" aria-hidden="true" />
      )}
      <img
        src={thumbnailUrl?.replace('http://localhost:8080/ipfs', 'http://127.0.0.1:8080/ipfs')}
        alt={title ? `Trang đầu tiên: ${title}` : 'Ảnh trang đầu tiên của tài liệu'}
        loading="lazy"
        onLoad={() => setStatus('ok')}
        onError={() => setStatus('error')}
        className={`w-full h-full object-cover object-top transition-opacity duration-200 ${
          status === 'ok' ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {isSpreadsheet && status === 'ok' && (
        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-[#059669]/90 text-white text-[9px] font-extrabold tracking-wide leading-none shadow-xs">
          {extBadge}
        </span>
      )}
    </div>
  );
}
