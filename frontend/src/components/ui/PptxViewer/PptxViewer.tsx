import React, { useEffect, useState, useCallback } from 'react';
import {
  Loader2,
  AlertCircle,
  ExternalLink,
  Lock,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { documentService } from '../../../services/documentService';
import { authService } from '../../../services/authService';

export interface PptxViewerProps {
  documentId?: string;
  attachmentIndex?: number;
  fileUrl?: string | null;
  ipfsCid?: string | null;
  title?: string;
  className?: string;
  hasUnlocked?: boolean;
  isBlurLocked?: boolean;
  freePagesLimit?: number;
  totalPages?: number;
  unlockPoints?: number;
  onUnlockRequest?: () => void;
  fileExtension?: string;
}

export const PptxViewer: React.FC<PptxViewerProps> = ({
  documentId,
  attachmentIndex = 0,
  title = 'Bài trình chiếu PowerPoint',
  className = '',
  hasUnlocked = false,
  isBlurLocked = false,
  freePagesLimit = 3,
  totalPages,
  unlockPoints = 10,
  onUnlockRequest,
}) => {
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [reloadNonce, setReloadNonce] = useState<number>(0);

  const loadConvertedPdf = useCallback(() => {
    setReloadNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!documentId) {
      setError('Không tìm thấy mã tài liệu để tải bản xem trước.');
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let active = true;

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const previewUrl = documentService.getAttachmentPreviewUrl(documentId, attachmentIndex);
        const token = authService.getAccessToken();
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(previewUrl, { headers, signal: controller.signal });
        if (!res.ok) {
          throw new Error(`Không thể tạo bản xem trước PDF cho tệp PowerPoint (mã lỗi ${res.status}).`);
        }

        const blob = await res.blob();
        if (!active) return;
        if (!blob || blob.size === 0) {
          throw new Error('Bản xem trước PDF trả về rỗng.');
        }

        const pdfBlob = blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });
        const nextUrl = URL.createObjectURL(pdfBlob);

        setPdfBlobUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return nextUrl;
        });
        setLoading(false);
      } catch (err: any) {
        if (!active || err?.name === 'AbortError') return;
        setError(err?.message || 'Đã xảy ra lỗi khi chuyển đổi bản xem trước PowerPoint.');
        setLoading(false);
      }
    };

    run();

    return () => {
      active = false;
      controller.abort();
    };
  }, [documentId, attachmentIndex, hasUnlocked, reloadNonce]);

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  const showDrmBar = !hasUnlocked && isBlurLocked && (!totalPages || freePagesLimit < totalPages);

  return (
    <div
      data-testid="pptx-viewer"
      className={`relative w-full bg-[#334155] flex flex-col ${className}`}
    >
      {loading && (
        <div className="flex flex-col items-center justify-center bg-[#1E293B] text-white min-h-[420px] gap-3 p-6 text-center">
          <Loader2 size={32} className="animate-spin text-amber-400" />
          <p className="text-sm font-semibold text-slate-200">
            Đang dựng bản xem trước PDF chuẩn cho PowerPoint...
          </p>
          <p className="text-xs text-slate-400 max-w-sm">
            Hệ thống đang chuyển đổi slide sang định dạng PDF để giữ nguyên 100% bố cục và phông chữ. Lần tải về vẫn giữ nguyên tệp .PPTX gốc.
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center justify-center bg-[#1E293B] text-white min-h-[360px] gap-3 p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
            <AlertCircle size={24} />
          </div>
          <h4 className="text-sm font-bold text-white">Không thể tải bản xem trước PowerPoint</h4>
          <p className="text-xs text-slate-300 max-w-md leading-relaxed">{error}</p>
          <button
            type="button"
            onClick={loadConvertedPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs cursor-pointer transition-colors"
          >
            <RefreshCw size={14} />
            <span>Thử tải lại</span>
          </button>
        </div>
      )}

      {!loading && !error && pdfBlobUrl && (
        <div className="relative w-full flex flex-col">
          <div className="bg-[#1E293B] border-b border-slate-700/80 px-4 py-2 flex items-center justify-between text-xs text-slate-300">
            <span>
              Đang hiển thị dưới dạng PDF chuẩn (tải về vẫn là tệp <strong className="text-amber-300">.PPTX gốc</strong>)
            </span>
            <a
              href={pdfBlobUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sky-300 hover:text-white font-semibold transition-colors"
            >
              <ExternalLink size={13} />
              <span>Mở tab mới</span>
            </a>
          </div>
          <iframe
            key={pdfBlobUrl}
            src={`${pdfBlobUrl}#view=FitH`}
            title={title}
            data-testid="pptx-pdf-iframe"
            className="w-full h-[650px] sm:h-[750px] border-0 bg-slate-800"
          />
        </div>
      )}

      {showDrmBar && !loading && !error && (
        <div className="bg-gradient-to-r from-slate-900 to-sky-950 text-white p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center shrink-0">
              <Lock size={18} />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">
                Đang xem trước {freePagesLimit} slide đầu miễn phí
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-300">
                Mở khóa để xem trọn vẹn toàn bộ bài trình chiếu và tải tệp .PPTX gốc.
              </p>
            </div>
          </div>
          {onUnlockRequest && (
            <button
              type="button"
              onClick={onUnlockRequest}
              className="w-full sm:w-auto px-4 py-2 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shrink-0 cursor-pointer transition-colors"
            >
              <ShieldCheck size={15} />
              <span>Mở khóa ({unlockPoints === 0 ? 'Miễn phí' : `${unlockPoints} điểm`})</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
