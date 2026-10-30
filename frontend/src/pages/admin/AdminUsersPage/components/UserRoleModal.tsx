import React, { useState, useEffect } from 'react';
import { Shield, X, Check, User, Crown } from 'lucide-react';
import { type AdminUser, type UserRole } from '../types';

export interface UserRoleModalProps {
    isOpen: boolean;
    user: AdminUser | null;
    onClose: () => void;
    onConfirm: (userId: string, newRole: UserRole) => void;
}

export const UserRoleModal: React.FC<UserRoleModalProps> = ({
    isOpen,
    user,
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

    const handleConfirm = () => {
        onConfirm(user.id, selectedRole);
    };

    const roles: { role: UserRole; title: string; desc: string; icon: React.ReactNode; color: string }[] = [
        {
            role: 'USER',
            title: 'USER (Người dùng thông thường)',
            desc: 'Thành viên sinh viên tiêu chuẩn, tìm kiếm, đọc và đăng tải tài liệu học tập.',
            icon: <User className="w-5 h-5 text-[#0051d5]" />,
            color: 'border-[#dce9ff] bg-[#fafcff]',
        },
        {
            role: 'VIP',
            title: 'VIP (Thành viên uy tín)',
            desc: 'Người đóng góp tích cực, ưu tiên hiển thị tài liệu và quyền lợi học thuật nâng cao.',
            icon: <Crown className="w-5 h-5 text-[#b45309]" />,
            color: 'border-[#fde68a] bg-[#fffdf5]',
        },
        {
            role: 'ADMIN',
            title: 'ADMIN (Quản trị viên)',
            desc: 'Quyền cao nhất: kiểm duyệt tài liệu, phân quyền và quản lý người dùng toàn hệ thống.',
            icon: <Shield className="w-5 h-5 text-[#ba1a1a]" />,
            color: 'border-[#fecaca] bg-[#fff8f8]',
        },
    ];

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

                {/* Role options list */}
                <div className="space-y-2.5 pt-1">
                    {roles.map((item) => {
                        const isSelected = selectedRole === item.role;
                        return (
                            <button
                                key={item.role}
                                type="button"
                                onClick={() => setSelectedRole(item.role)}
                                className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                                    isSelected
                                        ? 'border-[#0051d5] bg-[#eff4ff] ring-2 ring-[#0051d5]/20 shadow-xs'
                                        : `${item.color} hover:border-[#0051d5]/50`
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
                                        {item.desc}
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
                        className="flex-1 py-2.5 px-3 sm:px-4 rounded-xl bg-[#0051d5] hover:bg-[#003da0] text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer truncate"
                    >
                        Lưu thay đổi
                    </button>
                </div>
            </div>
        </div>
    );
};

