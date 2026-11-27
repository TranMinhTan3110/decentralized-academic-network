import { Fragment } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface AdminPaginationProps {
    page: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    disabled?: boolean;
    itemLabel: string;
    pageSizeAriaLabel: string;
}

export function AdminPagination({
    page,
    pageSize,
    totalElements,
    totalPages,
    onPageChange,
    onPageSizeChange,
    disabled = false,
    itemLabel,
    pageSizeAriaLabel,
}: AdminPaginationProps) {
    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-t border-[#eef3ff] bg-[#fafcff] text-xs text-[#5a6a80]">
            <div className="flex items-center gap-3">
                <span>
                    Hiển thị{' '}
                    <strong className="text-[#0b1c30]">
                        {totalElements === 0 ? 0 : (page - 1) * pageSize + 1}
                    </strong>{' '}
                    -{' '}
                    <strong className="text-[#0b1c30]">
                        {Math.min(page * pageSize, totalElements)}
                    </strong>{' '}
                    trong tổng số <strong className="text-[#0b1c30]">{totalElements}</strong> {itemLabel}
                </span>

                {onPageSizeChange && (
                    <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-[#dce9ff]">
                        <span>Hiển thị:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => onPageSizeChange(Number(e.target.value))}
                            aria-label={pageSizeAriaLabel}
                            className="h-7 px-2 text-xs bg-white border border-[#c3d0e6] rounded-[6px] text-[#0b1c30] focus:outline-none focus:ring-1 focus:ring-[#0051d5] cursor-pointer"
                        >
                            <option value={10}>10 / trang</option>
                            <option value={20}>20 / trang</option>
                            <option value={50}>50 / trang</option>
                        </select>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-1.5" aria-label="Điều hướng phân trang">
                <button
                    type="button"
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    disabled={page <= 1 || disabled}
                    aria-label="Trang trước"
                    className="h-8 px-2.5 sm:px-3 rounded-lg border border-[#c3d0e6] bg-white hover:bg-[#eff4ff] text-[#0b1c30] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 font-medium cursor-pointer"
                >
                    <ChevronLeft size={14} />
                    <span className="hidden sm:inline">Trước</span>
                </button>

                <div className="flex items-center gap-1">
                    {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                        .map((p, idx, arr) => {
                            const prev = arr[idx - 1];
                            const showEllipsis = prev && p - prev > 1;
                            return (
                                <Fragment key={p}>
                                    {showEllipsis && <span className="px-1 text-[#8fa3bf]">...</span>}
                                    <button
                                        type="button"
                                        onClick={() => onPageChange(p)}
                                        disabled={disabled}
                                        aria-label={`Trang ${p}`}
                                        aria-current={p === page ? 'page' : undefined}
                                        className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed ${
                                            p === page
                                                ? 'bg-[#0051d5] text-white shadow-xs'
                                                : 'bg-white text-[#5a6a80] border border-[#dce9ff] hover:bg-[#eff4ff] hover:text-[#0051d5]'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                </Fragment>
                            );
                        })}
                </div>

                <button
                    type="button"
                    onClick={() => onPageChange(Math.min(Math.max(1, totalPages), page + 1))}
                    disabled={page >= Math.max(1, totalPages) || disabled}
                    aria-label="Trang sau"
                    className="h-8 px-2.5 sm:px-3 rounded-lg border border-[#c3d0e6] bg-white hover:bg-[#eff4ff] text-[#0b1c30] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 font-medium cursor-pointer"
                >
                    <span className="hidden sm:inline">Sau</span>
                    <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
}

export default AdminPagination;
