import React, { useState, useEffect } from 'react';
import { Shield, X, Check, User, AlertTriangle } from 'lucide-react';
import { type AdminUser, type UserRole } from '../types';

export interface UserRoleModalProps {
    isOpen: boolean;
    user: AdminUser | null;
    isCurrentUser?: boolean;
    onClose: () => void;
    onConfirm: (userId: string, newRole: UserRole) => void;
}

export const UserRoleModal: React.FC<UserRoleModalProps> = ({
    isOpen,
    user,
    isCurrentUser = false,
    onClose,
    onConfirm,
}) => {
    const [selectedRole, setSelectedRole] = useState<UserRole>('USER');

    useEffect(() => {
        if (user) {
            setSelectedRole(user.role);
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

    const isSelfAdmin = isCurrentUser && user.role === 'ADMIN';

    const handleConfirm = () => {
        if (isSelfAdmin && selectedRole !== 'ADMIN') {
            return;
        }
        onConfirm(user.id, selectedRole);
    };

    const roles: { role: UserRole; title: string; desc: string; icon: React.ReactNode; color: string }[] = [
        {
            role: 'USER',
            title: 'USER (Người dùng thông thường)',
            desc: 'Thành viên sinh viên tiêu chuẩn, tìm kiếm, đọc và đăng tải bài đăng học tập.',
            icon: <User className="w-5 h-5 text-[#0051d5]" />,
            color: 'border-[#dce9ff] bg-[#fafcff]',
        },
        {
            role: 'ADMIN',
            title: 'ADMIN (Quản trị viên)',
            desc: 'Quyền quản trị: quản lý bài đăng, xử lý báo cáo vi phạm, phân quyền và quản lý người dùng.',
            icon: <Shield className="w-5 h-5 text-[#ba1a1a]" />,
            color: 'border-[#fecaca] bg-[#fff8f8]',
        },
    ];

    const isConfirmDisabled = isSelfAdmin && selectedRole !== 'ADMIN';

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-role-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0b1c30]/50 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="bg-white rounded-2xl p-5 sm:p-7 max-w-lg w-full space-y-4 sm:space-y-5 shadow-2xl border border-[#dce9ff] animate-in zoom-in-95 duration-150 relative">
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
                    <div className="w-11 h-11 rounded-xl bg-[#eff4ff] border border-[#dce9ff] text-[#0051d5] flex items-center justify-center shrink-0 shadow-xs">
                        <Shield className="w-6 h-6" />
                    </div>
                    <div>
                        <h3
                            id="user-role-modal-title"
                            className="text-base sm:text-lg font-bold text-[#0b1c30]"
                        >
                            Phân quyền người dùng
                        </h3>
                        <p className="text-xs text-[#5a6a80]">
                            {user.fullName} (@{user.username}) · {user.email}
                        </p>
                    </div>
                </div>

                {/* Self-Admin Notice */}
                {isSelfAdmin && (
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#fff8e1] border border-[#ffe082] text-xs text-[#8d6e19]">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-[#f59e0b] mt-0.5" />
                        <div>
                            <span className="font-semibold">Lưu ý quản trị viên:</span> Bạn đang phân quyền cho tài khoản của chính mình. Hệ thống không cho phép quản trị viên tự thu hồi quyền Admin của bản thân.
                        </div>
                    </div>
                )}

                {/* Role options list */}
                <div className="space-y-2.5 pt-1">
                    {roles.map((item) => {
                        const isSelected = selectedRole === item.role;
                        const isRoleDisabled = isSelfAdmin && item.role === 'USER';

                        return (
                            <button
                                key={item.role}
                                type="button"
                                disabled={isRoleDisabled}
                                onClick={() => {
                                    if (!isRoleDisabled) {
                                        setSelectedRole(item.role);
                                    }
                                }}
                                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                                    isRoleDisabled
                                        ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200'
                                        : isSelected
                                        ? 'border-[#0051d5] bg-[#eff4ff] ring-2 ring-[#0051d5]/20 shadow-xs cursor-pointer'
                                        : `${item.color} hover:border-[#0051d5]/50 cursor-pointer`
                                }`}
                            >
                                <div className="mt-0.5 shrink-0">{item.icon}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs sm:text-sm font-bold text-[#0b1c30]">
                                            {item.title}
                                        </div>
                                        {isSelected && (
                                             <div className="w-5 h-5 rounded-full bg-[#0051d5] text-white flex items-center justify-center shrink-0">
                                                <Check className="w-3.5 h-3.5" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[11px] sm:text-xs text-[#5a6a80] mt-0.5 leading-relaxed">
                                        {isRoleDisabled
                                            ? 'Quản trị viên không thể tự giáng chức chính mình về người dùng thông thường.'
                                            : item.desc}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
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
                        disabled={isConfirmDisabled}
                        className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors truncate ${
                            isConfirmDisabled
                                ? 'bg-[#94a3b8] cursor-not-allowed'
                                : 'bg-[#0051d5] hover:bg-[#003da0] cursor-pointer'
                        }`}
                    >
                        Lưu thay đổi
                    </button>
                </div>
            </div>
        </div>
    );
};
