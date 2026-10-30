import React, { useState, useEffect } from 'react';
import { Lock, Unlock, X, AlertTriangle } from 'lucide-react';
import { type AdminUser } from '../types';

export interface UserLockModalProps {
    isOpen: boolean;
    user: AdminUser | null;
    action: 'LOCK' | 'UNLOCK';
    onClose: () => void;
    onConfirm: (userId: string, reason?: string) => void;
}

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

    useEffect(() => {
        if (isLock) {
            setReason('Vi phạm quy định nền tảng theo báo cáo kiểm duyệt');
        } else {
            setReason('');
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
        onConfirm(user.id, reason);
    };

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
            <div className="bg-white rounded-2xl p-5 sm:p-7 max-w-md w-full space-y-4 sm:space-y-5 shadow-2xl border border-[#dce9ff] animate-in zoom-in-95 duration-150 relative">
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

                {/* Reason Input (only when locking) */}
                {isLock && (
                    <div className="space-y-1.5">
                        <label htmlFor="lock-reason" className="text-xs font-semibold text-[#0b1c30]">
                            Lý do khóa tài khoản
                        </label>
                        <input
                            id="lock-reason"
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Nhập lý do kiểm duyệt..."
                            className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#c3d0e6] bg-[#fafcff] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ba1a1a]/20 focus:border-[#ba1a1a] text-[#0b1c30]"
                        />
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
                        className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer truncate ${
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

