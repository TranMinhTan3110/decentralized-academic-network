import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, X, Award, Coins } from 'lucide-react';
import { type AdminUser } from '../types';

export interface UserAdjustModalProps {
    isOpen: boolean;
    user: AdminUser | null;
    onClose: () => void;
    onConfirm: (userId: string, newReputation: number, newTokenBalance: number, reason: string) => void;
}

export const UserAdjustModal: React.FC<UserAdjustModalProps> = ({
    isOpen,
    user,
    onClose,
    onConfirm,
}) => {
    const [reputation, setReputation] = useState<number>(0);
    const [tokenBalance, setTokenBalance] = useState<number>(0);
    const [reason, setReason] = useState<string>('Thưởng đóng góp học thuật chất lượng cao');

    useEffect(() => {
        if (user) {
            setReputation(user.reputation);
            setTokenBalance(user.tokenBalance);
            setReason('Thưởng đóng góp học thuật chất lượng cao');
        }
    }, [user]);

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
        onConfirm(user.id, Number(reputation), Number(tokenBalance), reason);
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-adjust-modal-title"
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

                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] text-[#009668] flex items-center justify-center shrink-0 shadow-xs">
                        <SlidersHorizontal className="w-6 h-6" />
                    </div>
                    <div>
                        <h3
                            id="user-adjust-modal-title"
                            className="text-base sm:text-lg font-bold text-[#0b1c30]"
                        >
                            Điều chỉnh điểm & Số dư token
                        </h3>
                        <p className="text-xs text-[#5a6a80]">
                            {user.fullName} (@{user.username})
                        </p>
                    </div>
                </div>

                {/* Inputs Form */}
                <div className="space-y-3 pt-1">
                    {/* Reputation */}
                    <div className="space-y-1.5">
                        <label htmlFor="adjust-reputation" className="text-xs font-semibold text-[#0b1c30] flex items-center gap-1.5">
                            <Award size={14} className="text-[#0051d5]" />
                            <span>Điểm uy tín</span>
                        </label>
                        <input
                            id="adjust-reputation"
                            type="number"
                            min="0"
                            value={reputation}
                            onChange={(e) => setReputation(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#c3d0e6] bg-[#fafcff] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5] text-[#0b1c30]"
                        />
                    </div>

                    {/* Token Balance */}
                    <div className="space-y-1.5">
                        <label htmlFor="adjust-token-balance" className="text-xs font-semibold text-[#0b1c30] flex items-center gap-1.5">
                            <Coins size={14} className="text-[#b45309]" />
                            <span>Số dư token</span>
                        </label>
                        <input
                            id="adjust-token-balance"
                            type="number"
                            min="0"
                            value={tokenBalance}
                            onChange={(e) => setTokenBalance(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#c3d0e6] bg-[#fafcff] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5] text-[#0b1c30]"
                        />
                    </div>

                    {/* Reason */}
                    <div className="space-y-1.5">
                        <label htmlFor="adjust-reason" className="text-xs font-semibold text-[#0b1c30]">
                            Lý do điều chỉnh
                        </label>
                        <input
                            id="adjust-reason"
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Nhập lý do điều chỉnh..."
                            className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#c3d0e6] bg-[#fafcff] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5] text-[#0b1c30]"
                        />
                    </div>
                </div>

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
                        className="flex-1 py-2.5 px-3 sm:px-4 rounded-xl bg-[#009668] hover:bg-[#007d56] text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer truncate"
                    >
                        Xác nhận cập nhật
                    </button>
                </div>
            </div>
        </div>
    );
};

