import type { FormEvent, RefObject } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ChevronRight, LogOut, FileUp, UserRoundKey, Bell } from 'lucide-react';
import type { UserProfile } from '../../../types';
import { Avatar, Button, SearchInput } from '../../ui';

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
    subContextText = 'Mục lục',
}: HeaderProps) {
    return (
        <header className="h-[68px] border-b border-[#e2e8f0] flex items-center justify-between gap-4 px-6 lg:px-8 bg-white sticky top-0 z-40">
            <div className="flex items-center gap-3">
                <Button
                    ref={menuButtonRef}
                    variant="icon"
                    className="md:hidden -ml-2"
                    aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
                    aria-expanded={menuOpen}
                    onClick={onToggleMenu}
                    icon={menuOpen ? <X size={20} /> : <Menu size={20} />}
                />

                <span className="hidden md:flex items-center gap-2 text-[#64748b] text-xs font-normal whitespace-nowrap">
                    {contextText} <ChevronRight size={14} className="text-[#94a3b8]" aria-hidden="true" />{' '}
                    <strong className="text-[#0f172a] font-bold">{subContextText}</strong>
                </span>
            </div>

            <div className="flex-1 max-w-xl mx-4">
                <SearchInput
                    variant="topbar"
                    value={query}
                    onChange={(e) => onQueryChange && onQueryChange(e.target.value)}
                    onSearchSubmit={onSearchSubmit}
                    placeholder="Tìm tài liệu..."
                />
            </div>

            <div className="flex items-center gap-4">
                <span className="p-2 text-[#334155] hover:text-[#315dff] hover:bg-[#f1f5f9] rounded-lg transition-colors inline-flex items-center justify-center">
                    <Bell size={20} />
                </span>
                <Link
                    to="/upload"
                    className="p-2 text-[#334155] hover:text-[#315dff] hover:bg-[#f1f5f9] rounded-lg transition-colors inline-flex items-center justify-center"
                    title="Tải tài liệu"
                >
                    <FileUp size={22} strokeWidth={1.8} aria-hidden="true" />
                </Link>

                {isAuthenticated && currentUser ? (
                    <button
                        className="flex items-center gap-2 px-3 py-1.5 border border-[#cbd5e1] text-xs rounded-lg bg-white hover:bg-[#f8fafc] hover:text-[#315dff] transition-colors whitespace-nowrap cursor-pointer"
                        onClick={onLogout}
                        aria-label="Đăng xuất"
                    >
                        <Avatar user={currentUser} size="sm" />
                        <span className="hidden sm:inline font-medium text-[#0f172a]">{currentUser.name}</span>
                        <LogOut size={16} aria-hidden="true" />
                    </button>
                ) : (
                    <Link
                        className="inline-flex items-center gap-2 text-[#315dff] text-xs font-semibold hover:text-[#1d42d8] transition-colors whitespace-nowrap px-2 py-1.5"
                        to="/login"
                    >
                        <UserRoundKey size={20} strokeWidth={1.8} aria-hidden="true" />
                        <span>Đăng nhập</span>
                    </Link>
                )}
            </div>
        </header>
    );
}
