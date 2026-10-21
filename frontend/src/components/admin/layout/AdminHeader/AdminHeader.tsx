import type { FormEvent, RefObject } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowLeft, Bell, Menu } from 'lucide-react';
import { Avatar } from '../../../ui';
import type { UserProfile } from '../../../../types';

export interface AdminHeaderProps {
    menuOpen?: boolean;
    onToggleMenu?: () => void;
    menuButtonRef?: RefObject<HTMLButtonElement | null>;
    searchQuery?: string;
    onSearchChange?: (val: string) => void;
    onSearchSubmit?: (e: FormEvent) => void;
    onNotificationsClick?: () => void;
    onProfileClick?: () => void;
    adminUser?: UserProfile | null;
    adminRole?: string;
    hasUnreadNotifications?: boolean;
    isNodeConnected?: boolean;
}

export function AdminHeader({
    menuOpen = false,
    onToggleMenu,
    menuButtonRef,
    searchQuery = '',
    onSearchChange,
    onSearchSubmit,
    onNotificationsClick,
    onProfileClick,
    adminUser,
    adminRole = 'Council Auditor',
    hasUnreadNotifications = true,
    isNodeConnected = true,
}: AdminHeaderProps) {
    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        if (onSearchSubmit) {
            onSearchSubmit(e);
        }
    };

    const adminName = adminUser?.name || 'Âu Dương Tấn';

    return (
        <header className="h-16 sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-[#dce9ff] px-4 sm:px-6 flex items-center justify-between gap-3 sm:gap-6">
            {/* Left section: mobile hamburger toggle & wide search bar */}
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 max-w-4xl">
                <button
                    ref={menuButtonRef}
                    type="button"
                    className="lg:hidden p-2 -ml-1 text-[#44505f] hover:text-[#0b1c30] hover:bg-[#eff4ff] rounded-[10px] border border-[#dce9ff] transition-colors cursor-pointer shrink-0"
                    aria-label={menuOpen ? 'Đóng menu quản trị' : 'Mở menu quản trị'}
                    aria-expanded={menuOpen}
                    onClick={onToggleMenu}
                >
                    <Menu size={18} />
                </button>

                {/* Global Search Input - Expanded & Responsive */}
                <form
                    onSubmit={handleSearch}
                    role="search"
                    className="w-full h-10 px-3.5 bg-[#eff4ff] border border-[#dce9ff] rounded-[10px] flex items-center gap-2.5 focus-within:border-[#0051d5] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#dce9ff] transition-all shadow-2xs"
                >
                    <Search size={18} className="text-[#5a6a80] shrink-0" aria-hidden="true" />
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                        placeholder="Tìm tài liệu, CID, email, mã hash giao dịch..."
                        aria-label="Tìm kiếm toàn hệ thống"
                        className="w-full bg-transparent border-0 outline-none text-xs sm:text-sm text-[#0b1c30] placeholder:text-[#5a6a80]"
                    />
                    <kbd className="hidden sm:inline-block border border-[#c3d0e6] rounded px-1.5 py-0.5 text-[11px] font-mono text-[#5a6a80] bg-white select-none shrink-0 shadow-2xs">
                        /
                    </kbd>
                </form>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
                {/* Back to User Hub Button */}
                <Link
                    to="/"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0b1c30] bg-white hover:bg-[#eff4ff] border border-[#c3d0e6] rounded-[9px] transition-colors shadow-2xs whitespace-nowrap"
                    title="Quay về giao diện người dùng"
                >
                    <ArrowLeft size={15} aria-hidden="true" />
                    <span className="hidden sm:inline">Về User Hub</span>
                </Link>

                {/* IPFS Node Status Chip */}
                <div
                    className="hidden md:inline-flex items-center gap-2 border border-[#dce9ff] rounded-full px-3 py-1.5 text-xs font-semibold bg-white text-[#009668] shadow-2xs select-none"
                    title="Trạng thái kết nối IPFS Node"
                >
                    <span
                        className={`w-2 h-2 rounded-full ${
                            isNodeConnected ? 'bg-[#009668] animate-pulse' : 'bg-[#ba1a1a]'
                        }`}
                        aria-hidden="true"
                    />
                    <span>IPFS Node: {isNodeConnected ? 'Connected' : 'Disconnected'}</span>
                </div>

                {/* Notifications Button */}
                <button
                    type="button"
                    onClick={onNotificationsClick}
                    aria-label="Thông báo khẩn cấp"
                    className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] border border-[#dce9ff] bg-white hover:bg-[#eff4ff] flex items-center justify-center text-[#0b1c30] transition-colors cursor-pointer shrink-0"
                >
                    <Bell size={18} aria-hidden="true" />
                    {hasUnreadNotifications && (
                        <span
                            className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#ba1a1a] ring-2 ring-white"
                            aria-hidden="true"
                        />
                    )}
                </button>

                {/* Admin Profile Pill */}
                <button
                    type="button"
                    onClick={onProfileClick}
                    aria-label={`Hồ sơ Admin ${adminName}`}
                    className="flex items-center gap-2 sm:gap-2.5 p-1 sm:px-2.5 sm:py-1 rounded-[10px] hover:bg-[#eff4ff] transition-colors cursor-pointer text-left shrink-0"
                >
                    <Avatar
                        user={adminUser}
                        name={adminName}
                        size="sm"
                        className="!w-[34px] !h-[34px] !bg-[#dce9ff] !text-[#0051d5] font-semibold text-xs shrink-0"
                    />
                    <div className="hidden lg:flex flex-col leading-tight">
                        <span className="font-semibold text-xs text-[#0b1c30] truncate max-w-[130px]">
                            {adminName}
                        </span>
                        <span className="inline-block mt-0.5 bg-[#e5eeff] text-[#0051d5] border border-[#c3d6ff] rounded-full px-1.5 py-0.2 text-[10px] font-semibold text-center whitespace-nowrap">
                            {adminRole}
                        </span>
                    </div>
                </button>
            </div>
        </header>
    );
}
