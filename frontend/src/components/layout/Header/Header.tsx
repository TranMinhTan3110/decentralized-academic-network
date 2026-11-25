import type { FormEvent, RefObject } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ChevronRight, LogOut, FileUp, UserRoundKey } from 'lucide-react';
import Swal from 'sweetalert2';
import type { UserProfile } from '../../../types';
import { Avatar, Button, SearchInput } from '../../ui';
import { NotificationPopover } from '../../notifications/NotificationPopover';

export interface HeaderProps {
    menuOpen?: boolean;
    onToggleMenu?: () => void;
    menuButtonRef?: RefObject<HTMLButtonElement | null>;
    query?: string;
    onQueryChange?: (val: string) => void;
    onSearchSubmit?: (e: FormEvent) => void;
    currentUser?: UserProfile | null;
    isAuthenticated?: boolean;
    onLogout?: () => void;
    contextText?: string;
    subContextText?: string;
}

export function Header({
    menuOpen = false,
    onToggleMenu,
    menuButtonRef,
    query = '',
    onQueryChange,
    onSearchSubmit,
    currentUser,
    isAuthenticated = false,
    onLogout,
    contextText = 'Không gian học tập',
    subContextText = 'DeDocu Hub',
}: HeaderProps) {
    const handleLogoutClick = () => {
        Swal.fire({
            title: 'Đăng xuất?',
            text: 'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Đăng xuất',
            cancelButtonText: 'Hủy bỏ',
            reverseButtons: true,
        }).then((result) => {
            if (result.isConfirmed) {
                onLogout?.();
            }
        });
    };

    return (
        <header className="h-[64px] border-b border-[#E6E8F0] flex items-center justify-between gap-1.5 sm:gap-4 px-3 sm:px-6 lg:px-8 bg-white/85 backdrop-blur-md sticky top-0 z-40">
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                <Button
                    ref={menuButtonRef}
                    variant="icon"
                    className="lg:hidden -ml-1 sm:-ml-2 p-1.5 sm:p-2"
                    aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
                    aria-expanded={menuOpen}
                    onClick={onToggleMenu}
                    icon={menuOpen ? <X size={20} /> : <Menu size={20} />}
                />

                <span className="hidden md:flex items-center gap-1.5 text-[#64748B] text-xs font-medium whitespace-nowrap">
                    {contextText} <ChevronRight size={14} className="text-[#94A3B8]" aria-hidden="true" />{' '}
                    <strong className="text-[#0F172A] font-bold">{subContextText}</strong>
                </span>
            </div>

            <div className="flex-1 min-w-0 max-w-xl mx-1 sm:mx-4">
                <SearchInput
                    variant="topbar"
                    value={query}
                    onChange={(e) => onQueryChange && onQueryChange(e.target.value)}
                    onSearchSubmit={onSearchSubmit}
                    placeholder="Tìm tài liệu..."
                />
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                {/* Bell hidden on very narrow screens < 380px to provide sufficient space for search input */}
                <div className="hidden min-[380px]:inline-flex items-center justify-center">
                    <NotificationPopover isAuthenticated={isAuthenticated} />
                </div>
                <Link
                    to="/upload"
                    className="p-2 text-[#475569] hover:text-[#4F46E5] hover:bg-[#EEF2FF] rounded-full transition-colors inline-flex items-center justify-center"
                    title="Tải tài liệu"
                >
                    <FileUp size={18} strokeWidth={1.9} aria-hidden="true" />
                </Link>

                {isAuthenticated && currentUser ? (
                    <button
                        className="flex items-center gap-2 pl-1.5 pr-3 py-1 border border-[#E6E8F0] text-xs rounded-full bg-white hover:bg-[#F6F7FB] hover:border-[#C7D2FE] transition-all whitespace-nowrap cursor-pointer shadow-2xs"
                        onClick={handleLogoutClick}
                        aria-label="Đăng xuất"
                    >
                        <Avatar user={currentUser} size="sm" />
                        <span className="hidden md:inline font-semibold text-[#0F172A] max-w-[130px] truncate">{currentUser.name}</span>
                        <LogOut size={15} aria-hidden="true" className="shrink-0 text-[#94A3B8] hover:text-[#F43F5E]" />
                    </button>
                ) : (
                    <Link
                        className="inline-flex items-center gap-1.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold transition-colors whitespace-nowrap px-3.5 py-2 rounded-full shadow-xs"
                        to="/login"
                        title="Đăng nhập"
                    >
                        <UserRoundKey size={16} strokeWidth={2} aria-hidden="true" />
                        <span className="hidden min-[480px]:inline">Đăng nhập</span>
                    </Link>
                )}
            </div>
        </header>
    );
}
