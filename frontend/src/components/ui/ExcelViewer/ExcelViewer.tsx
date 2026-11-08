import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Loader2,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  FileSpreadsheet,
  Lock,
  ShieldCheck,
  Search,
  X,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { documentService } from '../../../services/documentService';

export interface ExcelViewerProps {
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

function getColumnLetter(colIndex: number): string {
  let letter = '';
  let temp = colIndex;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

function normalizeSearch(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function formatCellValue(cell: any): string {
  if (cell === null || cell === undefined) return '';
  if (cell instanceof Date) {
    return cell.toLocaleDateString('vi-VN');
  }
  return String(cell);
}

function isNumericValue(val: any): boolean {
  if (typeof val === 'number') return true;
  if (typeof val === 'string' && val.trim() !== '') {
    return !isNaN(Number(val.replace(/,/g, '')));
  }
  return false;
}

export const ExcelViewer: React.FC<ExcelViewerProps> = ({
  documentId,
  attachmentIndex,
  fileUrl,
  ipfsCid,
  title = 'Tài liệu bảng tính',
  className = '',
  hasUnlocked = false,
  isBlurLocked = false,
  freePagesLimit = 3,
  unlockPoints = 10,
  onUnlockRequest,
  fileExtension = 'xlsx',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState<number>(0);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 100;

  const normalizeGatewayUrl = (url: string): string => {
    return url.replace('http://localhost:8080/ipfs', 'http://127.0.0.1:8080/ipfs');
  };

  const loadAndParseSpreadsheet = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let arrayBuffer: ArrayBuffer | null = null;
      const ipfsGateway =
        (typeof import.meta !== 'undefined' && import.meta.env?.VITE_IPFS_GATEWAY) ||
        'http://127.0.0.1:8080/ipfs';

      // 1. Thử fetch từ fileUrl
      if (fileUrl) {
        try {
          const normalized = normalizeGatewayUrl(fileUrl);
          const res = await fetch(normalized);
          if (res.ok) {
            arrayBuffer = await res.arrayBuffer();
          }
        } catch {
          // Bỏ qua thử tiếp
        }
      }

      // 2. Thử fetch từ ipfsCid
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

      // 3. Thử tải qua backend download API
      if (!arrayBuffer && documentId) {
        try {
          const blob = await documentService.download(documentId, attachmentIndex);
          arrayBuffer = await convertBlobToArrayBuffer(blob);
        } catch {
          // Fallthrough
        }
      }

      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new Error('Không thể tải tệp bảng tính (.xlsx/.csv) từ mạng lưu trữ.');
      }

      // Đọc bảng tính bằng thư viện xlsx
      const wb = XLSX.read(arrayBuffer, {
        type: 'array',
        cellDates: true,
        raw: false,
        dateNF: 'dd/mm/yyyy',
      });

      if (!wb.SheetNames || wb.SheetNames.length === 0) {
        throw new Error('Tệp bảng tính không chứa trang tính (sheet) nào hợp lệ.');
      }

      setWorkbook(wb);
      setSheetNames(wb.SheetNames);
      setActiveSheetIndex(0);
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi xử lý và hiển thị bảng tính.');
      setLoading(false);
    }
  }, [fileUrl, ipfsCid, documentId, attachmentIndex]);

  useEffect(() => {
    loadAndParseSpreadsheet();
  }, [loadAndParseSpreadsheet]);

  // Fullscreen event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(containerRef.current && document.fullscreenElement === containerRef.current));
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
      // Bỏ qua lỗi trình duyệt từ chối fullscreen
    }
  };

  // Lấy dữ liệu 2D của sheet đang active
  const currentSheetData: any[][] = useMemo(() => {
    if (!workbook || sheetNames.length === 0) return [];
    const sheetName = sheetNames[activeSheetIndex] || sheetNames[0];
    const ws = workbook.Sheets[sheetName];
    if (!ws) return [];
    return XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: '' });
  }, [workbook, sheetNames, activeSheetIndex]);

  // Số cột tối đa
  const maxCols = useMemo(() => {
    if (!currentSheetData || currentSheetData.length === 0) return 0;
    return Math.max(...currentSheetData.map((row) => (Array.isArray(row) ? row.length : 0)), 0);
  }, [currentSheetData]);

  // Giới hạn DRM Freemium (tương ứng 15 dòng cho mỗi trang miễn phí)
  const freeRowsLimit = Math.max(25, (freePagesLimit || 3) * 15);
  const isRestricted = !hasUnlocked && isBlurLocked && currentSheetData.length > freeRowsLimit;

  // Lọc tìm kiếm
  const normalizedQuery = normalizeSearch(searchQuery);

  const searchStats = useMemo(() => {
    if (!normalizedQuery || currentSheetData.length === 0) return { matchCount: 0 };
    let count = 0;
    for (let r = 0; r < currentSheetData.length; r++) {
      const row = currentSheetData[r];
      if (!Array.isArray(row)) continue;
      for (let c = 0; c < row.length; c++) {
        const valStr = normalizeSearch(row[c]);
        if (valStr.includes(normalizedQuery)) {
          count++;
        }
      }
    }
    return { matchCount: count };
  }, [currentSheetData, normalizedQuery]);

  // Phân trang khi không bị khóa DRM
  const totalDisplayRows = isRestricted ? freeRowsLimit : currentSheetData.length;
  const totalPagesCount = Math.max(1, Math.ceil(totalDisplayRows / PAGE_SIZE));
  const pagedRows = useMemo(() => {
    if (isRestricted) {
      return currentSheetData.slice(0, freeRowsLimit);
    }
    const start = (currentPage - 1) * PAGE_SIZE;
    return currentSheetData.slice(start, start + PAGE_SIZE);
  }, [currentSheetData, isRestricted, freeRowsLimit, currentPage]);

  // Dòng làm mờ giả lập hiệu ứng DRM (10 dòng tiếp theo)
  const blurredSampleRows = useMemo(() => {
    if (!isRestricted) return [];
    return currentSheetData.slice(freeRowsLimit, freeRowsLimit + 10);
  }, [currentSheetData, isRestricted, freeRowsLimit]);

  return (
    <div
      ref={containerRef}
      className={`excel-viewer-container flex flex-col bg-[#0F172A] border border-slate-700 rounded-xl overflow-hidden shadow-2xl relative select-text ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'w-full'
      } ${className}`}
    >
      {/* TOOLBAR HEADER */}
      <div className="bg-[#1E293B] border-b border-slate-700 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-white text-xs select-none">
        {/* Left: Document Info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center shrink-0">
            <FileSpreadsheet size={17} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-white text-xs sm:text-sm truncate max-w-[260px] sm:max-w-md" title={title}>
              {title}
            </h3>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="font-semibold text-emerald-400 uppercase">.{fileExtension}</span>
              <span>•</span>
              <span>
                {currentSheetData.length} dòng × {maxCols} cột
              </span>
              {sheetNames.length > 1 && (
                <>
                  <span>•</span>
                  <span>{sheetNames.length} sheet</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center: Search Box */}
        <div className="relative flex-1 max-w-xs min-w-[160px]">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
            <Search size={14} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm trong bảng tính..."
            className="w-full pl-8 pr-7 py-1.5 bg-[#0F172A] border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-white"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Right: Controls & Search Stats */}
        <div className="flex items-center gap-2">
          {searchQuery && (
            <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[11px] font-medium hidden sm:inline-block">
              {searchStats.matchCount > 0 ? `Tìm thấy ${searchStats.matchCount} ô` : 'Không có kết quả'}
            </span>
          )}

          {/* Zoom controls */}
          <div className="flex items-center bg-[#0F172A] border border-slate-700 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(75, prev - 10))}
              disabled={zoom <= 75}
              title="Thu nhỏ"
              className="p-1.5 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-slate-800"
            >
              <ZoomOut size={14} />
            </button>
            <button
              type="button"
              onClick={() => setZoom(100)}
              title="Khôi phục 100%"
              className="px-2 py-0.5 text-[11px] font-mono text-slate-300 hover:text-white"
            >
              {zoom}%
            </button>
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(150, prev + 10))}
              disabled={zoom >= 150}
              title="Phóng to"
              className="p-1.5 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-slate-800"
            >
              <ZoomIn size={14} />
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
            className="p-1.5 bg-[#0F172A] border border-slate-700 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* SPREADSHEET CONTENT BODY */}
      <div className="flex-1 bg-white relative overflow-auto min-h-[480px] max-h-[700px]">
        {loading && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-3 text-white">
            <Loader2 size={32} className="animate-spin text-emerald-400" />
            <p className="text-xs font-medium">Đang tải và dựng cấu trúc bảng tính...</p>
          </div>
        )}

        {error && (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-3 bg-slate-50 min-h-[480px]">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-200">
              <AlertCircle size={24} />
            </div>
            <h4 className="text-sm font-bold text-slate-800">Không thể hiển thị bảng tính</h4>
            <p className="text-xs text-slate-500 max-w-md">{error}</p>
            <button
              type="button"
              onClick={loadAndParseSpreadsheet}
              className="mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw size={14} />
              <span>Thử tải lại</span>
            </button>
          </div>
        )}

        {!loading && !error && currentSheetData.length === 0 && (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <FileSpreadsheet size={36} className="text-slate-300" />
            <p className="text-xs font-medium">Trang tính này hiện không có dữ liệu.</p>
          </div>
        )}

        {!loading && !error && currentSheetData.length > 0 && (
          <div
            className="w-max min-w-full p-2 origin-top-left transition-transform duration-75"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
          >
            <table className="border-collapse text-xs border border-slate-300 bg-white shadow-sm font-sans">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-semibold sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                  {/* Góc trên bên trái: STT header */}
                  <th className="w-12 min-w-12 px-2 py-1.5 text-center bg-slate-200/90 border border-slate-300 text-[11px] font-mono text-slate-500 sticky left-0 z-20">
                    #
                  </th>
                  {/* Tiêu đề cột kiểu Excel: A, B, C, D... */}
                  {Array.from({ length: maxCols }).map((_, cIdx) => (
                    <th
                      key={cIdx}
                      className="px-3 py-1.5 min-w-[100px] text-center bg-slate-100 border border-slate-300 text-[11px] font-mono text-slate-600 uppercase"
                    >
                      {getColumnLetter(cIdx)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((row, rIdx) => {
                  const actualRowIndex = (currentPage - 1) * PAGE_SIZE + rIdx;
                  const isHeaderRow = actualRowIndex === 0;

                  return (
                    <tr
                      key={actualRowIndex}
                      className={`transition-colors ${
                        isHeaderRow
                          ? 'bg-slate-50/90 font-bold text-slate-900 border-b-2 border-slate-300'
                          : actualRowIndex % 2 === 0
                          ? 'bg-white hover:bg-sky-50/40'
                          : 'bg-slate-50/40 hover:bg-sky-50/40'
                      }`}
                    >
                      {/* Số thứ tự dòng bên trái (Sticky) */}
                      <td className="w-12 min-w-12 px-2 py-1.5 text-center font-mono text-[11px] text-slate-400 bg-slate-50 border border-slate-300 sticky left-0 z-10 select-none">
                        {actualRowIndex + 1}
                      </td>

                      {/* Các ô dữ liệu */}
                      {Array.from({ length: maxCols }).map((_, cIdx) => {
                        const cellRaw = Array.isArray(row) ? row[cIdx] : '';
                        const formatted = formatCellValue(cellRaw);
                        const isNumeric = isNumericValue(cellRaw);

                        const isMatch =
                          normalizedQuery && normalizeSearch(formatted).includes(normalizedQuery);

                        return (
                          <td
                            key={cIdx}
                            className={`px-3 py-1.5 border border-slate-200 text-xs text-slate-800 max-w-sm truncate ${
                              isNumeric ? 'text-right font-mono' : 'text-left'
                            } ${
                              isMatch
                                ? 'bg-amber-100 text-amber-950 font-semibold ring-1 ring-amber-400'
                                : ''
                            }`}
                            title={formatted}
                          >
                            {formatted}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {/* HIỆU ỨNG DÒNG LÀM MỜ NẾU BỊ KHÓA DRM */}
                {isRestricted &&
                  blurredSampleRows.map((row, bIdx) => {
                    const rowNumber = freeRowsLimit + bIdx + 1;
                    return (
                      <tr
                        key={`blur-${bIdx}`}
                        className="filter blur-[4px] opacity-40 select-none pointer-events-none bg-slate-50/50"
                        aria-hidden="true"
                      >
                        <td className="w-12 min-w-12 px-2 py-1.5 text-center font-mono text-[11px] text-slate-400 bg-slate-100 border border-slate-300">
                          {rowNumber}
                        </td>
                        {Array.from({ length: maxCols }).map((_, cIdx) => {
                          const cellRaw = Array.isArray(row) ? row[cIdx] : '';
                          const formatted = formatCellValue(cellRaw);
                          return (
                            <td key={cIdx} className="px-3 py-1.5 border border-slate-200 text-xs text-slate-700">
                              {formatted || '••••••••'}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* DRM LOCK BANNER KHI BẢNG TÍNH BỊ GIỚI HẠN DÒNG */}
        {isRestricted && (
          <div className="sticky bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-r from-slate-900 to-sky-950 text-white flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-700 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center shrink-0">
                <Lock size={18} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">
                  Đang xem trước {freeRowsLimit} / {currentSheetData.length} dòng miễn phí của trang tính
                </h4>
                <p className="text-[11px] text-slate-300">
                  Mở khóa để xem trọn vẹn toàn bộ {currentSheetData.length} dòng và tải tệp .{fileExtension.toUpperCase()} gốc.
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

      {/* FOOTER BAR: SHEET TABS & PAGINATION */}
      <div className="bg-[#1E293B] border-t border-slate-700 px-3 py-2 flex flex-wrap items-center justify-between gap-3 text-xs select-none">
        {/* Sheet Tabs List */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-0.5 scrollbar-thin">
          <div className="flex items-center gap-1 text-slate-400 text-[11px] font-semibold pr-2 border-r border-slate-700 shrink-0">
            <Layers size={13} className="text-emerald-400" />
            <span>Sheets:</span>
          </div>
          {sheetNames.map((name, sIdx) => {
            const isActive = sIdx === activeSheetIndex;
            return (
              <button
                key={name}
                type="button"
                onClick={() => {
                  setActiveSheetIndex(sIdx);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <FileSpreadsheet size={13} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span>{name}</span>
              </button>
            );
          })}
        </div>

        {/* Pagination controls when document has many rows and is unlocked */}
        {!isRestricted && totalPagesCount > 1 && (
          <div className="flex items-center gap-2 text-slate-300 text-xs">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Trang trước"
            >
              <ChevronLeft size={15} />
            </button>
            <span>
              Trang <strong className="text-white">{currentPage}</strong> / {totalPagesCount}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPagesCount}
              onClick={() => setCurrentPage((p) => Math.min(totalPagesCount, p + 1))}
              className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Trang sau"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

