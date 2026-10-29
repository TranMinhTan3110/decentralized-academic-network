import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { type AdminDocument } from '../types';

export interface DocumentRejectModalProps {
    isOpen: boolean;
    document: AdminDocument | null;
    onClose: () => void;
    onConfirm: (docId: string, reason: string) => void;
}

export const DocumentRejectModal: React.FC<DocumentRejectModalProps> = ({
    isOpen,
    document: doc,
    onClose,
    onConfirm,
}) => {
    const [reason, setReason] = useState('Vi phạm bản quyền theo báo cáo xác thực');

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

    if (!isOpen || !doc) return null;

    const handleConfirm = () => {
        onConfirm(doc.id, reason);
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-doc-modal-title"
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
                    <Trash2 className="w-6 h-6" />
                </div>

                {/* Text Content */}
                <div className="text-center space-y-2">
                    <h3
                        id="reject-doc-modal-title"
                        className="text-lg font-bold text-[#0b1c30]"
                    >
                        Gỡ bỏ khỏi mạng lưới?
                    </h3>
                    <p className="text-xs sm:text-sm text-[#5a6a80] leading-relaxed">
                        Tài liệu <strong className="text-[#0b1c30]">"{doc.title}"</strong> sẽ chuyển sang trạng thái <strong>Đã gỡ bỏ (REJECTED)</strong> và thu hồi điểm thưởng của tác giả.
                    </p>
                </div>

                {/* Reason Input */}
                <div className="space-y-1.5">
                    <label htmlFor="reject-reason" className="text-xs font-semibold text-[#0b1c30]">
                        Lý do gỡ bỏ
                    </label>
                    <input
                        id="reject-reason"
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Nhập lý do kiểm duyệt..."
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#c3d0e6] bg-[#fafcff] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ba1a1a]/20 focus:border-[#ba1a1a] text-[#0b1c30]"
                    />
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
                        onClick={handleConfirm}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                        Xác nhận gỡ bỏ
                    </button>
                </div>
            </div>
        </div>
    );
};
