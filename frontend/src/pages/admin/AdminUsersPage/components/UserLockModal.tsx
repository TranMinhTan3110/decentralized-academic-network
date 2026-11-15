import React, { useState, useEffect } from 'react';
import { Lock, Unlock, X, AlertTriangle, Link2, CheckCircle2 } from 'lucide-react';
import { type AdminUser } from '../types';

export interface UserLockModalProps {
    isOpen: boolean;
    user: AdminUser | null;
    action: 'LOCK' | 'UNLOCK';
    onClose: () => void;
    onConfirm: (userId: string, reason?: string) => void;
}

export const COMMON_LOCK_REASONS = [
    'Đăng tải tài liệu vi phạm bản quyền / sao chép trái phép',
    'Spam bài viết hoặc tài liệu rác không liên quan học tập',
    'Bình luận quấy rối, ngôn từ thù địch hoặc công kích cá nhân',
    'Gian lận điểm danh vọng, cày tương tác ảo',
    'Bị nhiều người dùng gửi báo cáo vi phạm xác đáng',
];

export const UserLockModal: React.FC<UserLockModalProps> = ({
    isOpen,
    user,
    action,
    onClose,
    onConfirm,
}) => {
    const isLock = action === 'LOCK';
    const [reason, setReason] = useState(
        isLock ? 'Vi phạm quy định nền tảng theo báo cáo kiểm duyệt' : ''
    );
    const [evidence, setEvidence] = useState('');
    const [validationError, setValidationError] = useState('');

    useEffect(() => {
        if (isLock) {
            setReason('Vi phạm quy định nền tảng theo báo cáo kiểm duyệt');
            setEvidence('');
            setValidationError('');
        } else {
            setReason('');
            setEvidence('');
            setValidationError('');
        }
    }, [isLock, user]);

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

    if (!isOpen || !user) return null;

    const handleConfirm = () => {
        if (isLock) {
            const trimmedReason = reason.trim();
            if (!trimmedReason) {
                setValidationError('Vui lòng chọn hoặc tự nhập lý do khóa tài khoản.');
                return;
            }
            const trimmedEvidence = evidence.trim();
            const finalReason = trimmedEvidence
                ? `${trimmedReason} [Bằng chứng: ${trimmedEvidence}]`
                : trimmedReason;
            onConfirm(user.id, finalReason);
        } else {
            onConfirm(user.id);
        }
    };

    const isConfirmDisabled = isLock && !reason.trim();

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-lock-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0b1c30]/50 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-lg w-full space-y-4 shadow-2xl border border-[#dce9ff] animate-in zoom-in-95 duration-150 relative max-h-[90vh] overflow-y-auto">
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-1.5 rounded-lg text-[#5a6a80] hover:text-[#0b1c30] hover:bg-[#eff4ff] transition-colors cursor-pointer"
                    aria-label="Đóng"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Icon */}
                <div
                    className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto shadow-xs ${
                        isLock
                            ? 'border-[#ffdad6] bg-[#fff5f4] text-[#ba1a1a]'
                            : 'border-[#a7f3d0] bg-[#ecfdf5] text-[#009668]'
                    }`}
                >
                    {isLock ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
                </div>

                {/* Text Content */}
                <div className="text-center space-y-1.5 sm:space-y-2">
                    <h3
                        id="user-lock-modal-title"
                        className="text-base sm:text-lg font-bold text-[#0b1c30]"
                    >
                        {isLock ? 'Khóa tài khoản người dùng?' : 'Mở khóa tài khoản?'}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#5a6a80] leading-relaxed">
                        {isLock ? (
                            <>
                                Người dùng <strong className="text-[#0b1c30]">{user.fullName}</strong> (@{user.username}) sẽ bị chuyển sang trạng thái <strong>Bị khóa (BANNED)</strong> và không thể đăng nhập hoặc tải tài liệu.
                            </>
                        ) : (
                            <>
                                Khôi phục quyền truy cập cho <strong className="text-[#0b1c30]">{user.fullName}</strong> (@{user.username}). Trạng thái tài khoản sẽ trở lại <strong>Hoạt động (ACTIVE)</strong>.
                            </>
                        )}
                    </p>
                </div>

                {/* Lock Controls (only when locking) */}
                {isLock && (
                    <div className="space-y-3 pt-1">
                        {/* Quick Presets */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-[#5a6a80] uppercase tracking-wider block">
                                Gợi ý lý do vi phạm (chọn nhanh):
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                {COMMON_LOCK_REASONS.map((preset) => {
                                    const isSelected = reason === preset;
                                    return (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => {
                                                setReason(preset);
                                                setValidationError('');
                                            }}
                                            className={`text-[11px] px-2.5 py-1.5 rounded-lg border transition-all text-left cursor-pointer flex items-center gap-1.5 ${
                                                isSelected
                                                    ? 'border-[#ba1a1a] bg-[#fff5f4] text-[#ba1a1a] font-semibold shadow-2xs'
                                                    : 'border-[#dce9ff] bg-[#fafcff] text-[#5a6a80] hover:border-[#a2b4cf] hover:bg-white'
                                            }`}
                                        >
                                            {isSelected && <CheckCircle2 size={12} className="text-[#ba1a1a] shrink-0" />}
                                            <span>{preset}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Reason Textarea (Required) */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label htmlFor="lock-reason" className="text-xs font-semibold text-[#0b1c30]">
                                    Lý do chi tiết <span className="text-[#ba1a1a]">*</span>
                                </label>
                                <span className="text-[11px] text-[#ba1a1a] font-medium">Bắt buộc</span>
                            </div>
                            <textarea
                                id="lock-reason"
                                rows={2}
                                value={reason}
                                onChange={(e) => {
                                    setReason(e.target.value);
                                    if (e.target.value.trim()) setValidationError('');
                                }}
                                placeholder="Chọn một gợi ý ở trên hoặc tự điền lý do chi tiết..."
                                className={`w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border bg-[#fafcff] focus:bg-white focus:outline-none transition-all text-[#0b1c30] resize-none ${
                                    validationError
                                        ? 'border-[#ba1a1a] ring-1 ring-[#ba1a1a]'
                                        : 'border-[#c3d0e6] focus:ring-2 focus:ring-[#ba1a1a]/20 focus:border-[#ba1a1a]'
                                }`}
                            />
                            {validationError && (
                                <p className="text-[11px] text-[#ba1a1a] font-medium flex items-center gap-1">
                                    <AlertTriangle size={12} /> {validationError}
                                </p>
                            )}
                        </div>

                        {/* Evidence Input (Optional) */}
                        <div className="space-y-1">
                            <label htmlFor="lock-evidence" className="text-xs font-semibold text-[#5a6a80] flex items-center justify-between">
                                <span className="flex items-center gap-1 text-[#0b1c30]">
                                    <Link2 size={13} className="text-[#5a6a80]" />
                                    Bằng chứng / Mã báo cáo
                                </span>
                                <span className="text-[11px] text-[#8e9aaf] font-normal">(Tùy chọn)</span>
                            </label>
                            <input
                                id="lock-evidence"
                                type="text"
                                value={evidence}
                                onChange={(e) => setEvidence(e.target.value)}
                                placeholder="VD: Link bài đăng vi phạm, URL ảnh chụp màn hình hoặc mã #REP-102..."
                                className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-[#c3d0e6] bg-[#fafcff] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5] text-[#0b1c30]"
                            />
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2.5 sm:gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2.5 px-3 sm:px-4 rounded-xl border border-[#c3d0e6] bg-white hover:bg-[#fafcff] text-xs sm:text-sm font-semibold text-[#0b1c30] transition-colors cursor-pointer truncate"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isConfirmDisabled}
                        className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-white text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer truncate disabled:opacity-50 disabled:cursor-not-allowed ${
                            isLock
                                ? 'bg-[#ba1a1a] hover:bg-[#93000a]'
                                : 'bg-[#009668] hover:bg-[#007d56]'
                        }`}
                    >
                        {isLock ? 'Xác nhận khóa' : 'Xác nhận mở khóa'}
                    </button>
                </div>
            </div>
        </div>
    );
};
