import { useState } from 'react';
import { FileText } from 'lucide-react';

export interface DocumentThumbnailProps {
  thumbnailUrl?: string | null;
  title?: string;
  /** Nhãn hiển thị trong fallback (mặc định: "Tài liệu") */
  label?: string;
  className?: string;
}

/**
 * Ảnh trang đầu tiên của tài liệu (thumbnail do backend render từ PDFBox lúc upload).
 * - Có ảnh: <img> lazy-load, object-cover, skeleton trong lúc tải.
 * - Ảnh lỗi (IPFS gateway offline/chậm) hoặc không có: fallback về ô icon quen thuộc.
 */
export function DocumentThumbnail({ thumbnailUrl, title, label = 'Tài liệu', className = '' }: DocumentThumbnailProps) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>(
    thumbnailUrl ? 'loading' : 'error'
  );

  if (!thumbnailUrl || status === 'error') {
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
    <div className={`relative overflow-hidden bg-[#F1F5F9] shrink-0 ${className}`} title={title}>
      {status === 'loading' && (
        <div className="absolute inset-0 animate-pulse bg-[#E2E8F0]" aria-hidden="true" />
      )}
      <img
        src={thumbnailUrl}
        alt={title ? `Trang đầu tiên: ${title}` : 'Ảnh trang đầu tiên của tài liệu'}
        loading="lazy"
        onLoad={() => setStatus('ok')}
        onError={() => setStatus('error')}
        className={`w-full h-full object-cover object-top transition-opacity duration-200 ${
          status === 'ok' ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
