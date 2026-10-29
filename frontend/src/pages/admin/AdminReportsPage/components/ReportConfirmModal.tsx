import React, { useEffect } from 'react';
import { Gavel, X } from 'lucide-react';
import { type ReportItem } from '../types';

export interface ReportConfirmModalProps {
    isOpen: boolean;
    report: ReportItem | null;
    onClose: () => void;
    onConfirm: (report: ReportItem) => void;
}

export const ReportConfirmModal: React.FC<ReportConfirmModalProps> = ({
    isOpen,
    report,
    onClose,
    onConfirm,
}) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !report) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-confirm-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1c30]/50 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-md w-full space-y-5 shadow-2xl border border-[#dce9ff] animate-in zoom-in-95 duration-150 relative">
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-[#5a6a80] hover:text-[#0b1c30] hover:bg-[#eff4ff] transition-colors cursor-pointer"
                    aria-label="Đóng"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Icon */}
                <div className="w-12 h-12 rounded-2xl border border-[#ffdad6] bg-[#fff5f4] text-[#ba1a1a] flex items-center justify-center mx-auto shadow-xs">
                    <Gavel className="w-6 h-6" />
                </div>

                {/* Text Content */}
                <div className="text-center space-y-2">
                    <h3
                        id="report-confirm-title"
                        className="text-lg font-bold text-[#0b1c30]"
                    >
                        Xác nhận vi phạm & gỡ bỏ?
                    </h3>
                    <p className="text-xs sm:text-sm text-[#5a6a80] leading-relaxed">
                        Tài liệu <strong className="text-[#0b1c30]">"{report.docTitle}"</strong> sẽ bị gỡ (REJECTED) và tài khoản của <strong className="text-[#0b1c30]">{report.author}</strong> sẽ nhận cảnh cáo.
                    </p>
                </div>

                {/* Report Info Snippet */}
                <div className="bg-[#fafcff] border border-[#e5eeff] rounded-xl p-3.5 text-xs text-[#0b1c30] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-[#5a6a80]">
                        <span>Người báo cáo: <strong className="text-[#0b1c30]">{report.reporter}</strong></span>
                        <span className="font-mono text-[#ba1a1a] font-semibold">{report.reason}</span>
                    </div>
                    <p className="italic text-[#44505f]">"{report.note}"</p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2.5 px-4 rounded-xl border border-[#c3d0e6] bg-white hover:bg-[#fafcff] text-xs sm:text-sm font-semibold text-[#0b1c30] transition-colors cursor-pointer"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        type="button"
                        onClick={() => onConfirm(report)}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                        Xác nhận & Gỡ bỏ
                    </button>
                </div>
            </div>
        </div>
    );
};
