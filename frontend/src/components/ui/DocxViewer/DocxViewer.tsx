import React, { useEffect, useRef, useState, useCallback } from 'react';
import { renderAsync } from 'docx-preview';
import {
  Loader2,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  FileText,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { documentService } from '../../../services/documentService';

export interface DocxViewerProps {
  documentId?: string;
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
}

async function convertBlobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') {
    try {
      const buf = await blob.arrayBuffer();
      if (buf && buf.byteLength > 0) {
        return buf;
      }
    } catch {
      // Fallback
    }
  }

  return new Promise<ArrayBuffer>((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          resolve(new ArrayBuffer(0));
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    } catch (err) {
      reject(err);
    }
  });
}

export const DocxViewer: React.FC<DocxViewerProps> = ({
  documentId,
  fileUrl,
  ipfsCid,
  title,
  className = '',
  hasUnlocked = false,
  isBlurLocked = false,
  freePagesLimit = 3,
  totalPages: propTotalPages,
  unlockPoints = 10,
  onUnlockRequest,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTargetRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [pageCount, setPageCount] = useState<number>(propTotalPages || 0);

  const normalizeGatewayUrl = (url: string): string => {
    return url.replace('http://localhost:8080/ipfs', 'http://127.0.0.1:8080/ipfs');
  };

  const loadAndRenderDocx = useCallback(async () => {
    if (!renderTargetRef.current) return;
    setLoading(true);
    setError(null);

    try {
      let arrayBuffer: ArrayBuffer | null = null;
      const ipfsGateway =
        (typeof import.meta !== 'undefined' && import.meta.env?.VITE_IPFS_GATEWAY) ||
        'http://127.0.0.1:8080/ipfs';

      // 1. Thử fetch từ fileUrl nếu có
      if (fileUrl) {
        try {
          const normalized = normalizeGatewayUrl(fileUrl);
          const res = await fetch(normalized);
          if (res.ok) {
            arrayBuffer = await res.arrayBuffer();
          }
        } catch {
          // Bỏ qua thử các nguồn tiếp theo
        }
      }

      // 2. Thử fetch từ ipfsCid nếu chưa có dữ liệu
      if (!arrayBuffer && ipfsCid) {
        try {
          const directGatewayUrl = `${normalizeGatewayUrl(ipfsGateway)}/${ipfsCid}`;
          const res = await fetch(directGatewayUrl);
          if (res.ok) {
            arrayBuffer = await res.arrayBuffer();
          }
        } catch {
          // Bỏ qua thử tiếp
        }
      }

      // 3. Thử tải qua backend download API nếu có documentId
      if (!arrayBuffer && documentId) {
        try {
          const blob = await documentService.download(documentId);
          arrayBuffer = await convertBlobToArrayBuffer(blob);
        } catch {
          // Fallthrough
        }
      }

      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new Error('Không thể tải tệp nội dung Word (.docx) từ mạng lưu trữ.');
      }

      // Dọn dẹp DOM cũ trước khi render mới
      if (renderTargetRef.current) {
        renderTargetRef.current.innerHTML = '';
      }

      // Render tệp Docx bằng docx-preview
      await renderAsync(arrayBuffer, renderTargetRef.current, undefined, {
        inWrapper: true,
        ignoreWidth: false,
        ignoreHeight: false,
        breakPages: true,
        experimental: true,
        useBase64URL: true,
        trimXmlDeclaration: true,
        renderHeaders: true,
        renderFooters: true,
        renderFootnotes: true,
        renderEndnotes: true,
      });

      // Đếm số trang đã render và áp dụng DRM làm mờ trang vượt quá giới hạn
      if (renderTargetRef.current) {
        const pageSections = renderTargetRef.current.querySelectorAll<HTMLElement>(
          '.docx-wrapper > section, .docx-wrapper > article'
        );
        const count = pageSections.length || propTotalPages || 1;
        setPageCount(count);

        // Áp dụng Freemium DRM nếu chưa mở khóa
        const isRestricted = !hasUnlocked && isBlurLocked && freePagesLimit > 0 && count > freePagesLimit;
        if (isRestricted) {
          pageSections.forEach((section, index) => {
            if (index >= freePagesLimit) {
              section.style.filter = 'blur(9px)';
              section.style.opacity = '0.35';
              section.style.pointerEvents = 'none';
              section.style.userSelect = 'none';
              section.style.position = 'relative';
              section.setAttribute('aria-hidden', 'true');
            }
          });
        }
      }

      setLoading(false);
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi xử lý và hiển thị tệp Word.');
      setLoading(false);
    }
  }, [fileUrl, ipfsCid, documentId, hasUnlocked, isBlurLocked, freePagesLimit, propTotalPages]);

  useEffect(() => {
    loadAndRenderDocx();
  }, [loadAndRenderDocx]);

  // Lắng nghe sự kiện fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore fullscreen errors
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 160));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 60));
  const handleResetZoom = () => setZoom(100);

  const isRestricted = !hasUnlocked && isBlurLocked && freePagesLimit > 0 && pageCount > freePagesLimit;

  return (
    <div
      ref={containerRef}
      className={`docx-viewer-root relative w-full flex flex-col bg-[#1E293B] text-slate-100 select-text overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen' : 'rounded-b-2xl'
      } ${className}`}
    >
      {/* TOOLBAR ĐIỀU KHIỂN NỘI BỘ */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-[#0F172A] border-b border-slate-700/80 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-300">
            <FileText size={15} className="text-sky-400" />
            <span className="hidden sm:inline">Trình xem Word:</span>
            <span className="text-white font-semibold">{pageCount > 0 ? `${pageCount} trang` : 'Đang xử lý'}</span>
          </span>
          {isRestricted && (
            <span className="text-amber-400 font-medium text-[11px] bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-400/20">
              Đọc thử {freePagesLimit} / {pageCount} trang
            </span>
          )}
          {hasUnlocked && (
            <span className="text-emerald-400 font-medium text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
              Đã mở khóa
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 60}
              aria-label="Thu nhỏ"
              title="Thu nhỏ"
              className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-colors"
            >
              <ZoomOut size={14} />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              title="Đặt lại kích thước 100%"
              className="px-1.5 py-0.5 text-[11px] font-mono text-slate-200 hover:text-sky-400 transition-colors"
            >
              {zoom}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 160}
              aria-label="Phóng to"
              title="Phóng to"
              className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-colors"
            >
              <ZoomIn size={14} />
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetZoom}
            title="Kích thước gốc"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white border border-slate-700 cursor-pointer transition-colors hidden sm:inline-flex"
          >
            <RotateCcw size={14} />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Mở toàn màn hình'}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white border border-slate-700 cursor-pointer transition-colors"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* KHUNG HIỂN THỊ CHÍNH */}
      <div
        className={`relative w-full overflow-auto bg-[#334155] flex justify-center ${
          isFullscreen ? 'flex-1' : 'h-[650px] sm:h-[750px]'
        }`}
      >
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#1E293B]/90 z-20 text-slate-300">
            <Loader2 size={32} className="animate-spin text-sky-400" />
            <p className="text-sm font-medium">Đang nạp và dàn trang tài liệu Word...</p>
            <p className="text-xs text-slate-400">{title || 'Đang dựng nguyên vẹn bảng biểu, font chữ và hình ảnh'}</p>
          </div>
        )}

        {error && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#1E293B] z-20 text-slate-300 p-6 text-center">
            <AlertCircle size={36} className="text-amber-400" />
            <h4 className="text-base font-bold text-white">Không thể hiển thị tài liệu Word</h4>
            <p className="text-xs max-w-md text-slate-400">{error}</p>
            <button
              type="button"
              onClick={loadAndRenderDocx}
              className="mt-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              Thử tải lại
            </button>
          </div>
        )}

        {/* CONTAINER CHỨA NỘI DUNG WORD ĐƯỢC RENDER BỞI DOCX-PREVIEW */}
        <div
          className="w-full flex justify-center transition-transform duration-150 origin-top p-4 sm:p-6"
          style={{
            transform: zoom === 100 ? 'none' : `scale(${zoom / 100})`,
            transformOrigin: 'top center',
          }}
        >
          <div
            ref={renderTargetRef}
            className="docx-content-target w-full flex flex-col items-center"
          />
        </div>
      </div>

      {/* KHUNG THÔNG BÁO MỞ KHÓA DRM Ở DƯỚI CÙNG */}
      {isRestricted && (
        <div className="bg-gradient-to-r from-slate-900 to-sky-950 text-white p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-700 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center shrink-0">
              <Lock size={18} />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">
                Đang xem trước {freePagesLimit} / {pageCount} trang tài liệu Word
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-300">
                Mở khóa để xem trọn vẹn toàn bộ {pageCount} trang và tải tệp gốc về máy.
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

      {/* CSS CUSTOM CHO DOCX-PREVIEW ĐỂ ĐẢM BẢO KHÔNG BỊ TRÀN VÀ ĐẸP MẮT */}
      <style>{`
        .docx-content-target .docx-wrapper {
          background: transparent !important;
          padding: 0 !important;
        }
        .docx-content-target .docx-wrapper > section.docx,
        .docx-content-target .docx-wrapper > article.docx,
        .docx-content-target section.docx {
          background: #ffffff !important;
          color: #1e293b !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3) !important;
          margin: 0 auto 24px auto !important;
          border-radius: 4px !important;
          overflow: hidden !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
        .docx-content-target table {
          border-collapse: collapse !important;
          max-width: 100% !important;
        }
        .docx-content-target img {
          max-width: 100% !important;
          height: auto !important;
        }
      `}</style>
    </div>
  );
};

export default DocxViewer;
