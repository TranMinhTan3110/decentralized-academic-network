import { useState, type FormEvent, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ChevronRight, LogOut, FileUp, UserRoundKey, Clock3, FileText, Search } from 'lucide-react';
import Swal from 'sweetalert2';
import type { UserProfile } from '../../../types';
import { Avatar, Button, SearchInput } from '../../ui';
import { NotificationPopover } from '../../notifications/NotificationPopover';

export interface HeaderSearchSuggestion {
    id: string;
    title: string;
    courseName?: string;
    universityName?: string;
    fileExtension?: string;
}

export interface HeaderSearchUserSuggestion {
    id: string;
    fullName: string;
    username?: string;
    avatarUrl?: string;
    universityName?: string;
    badge?: string;
}

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
    recentSearches?: string[];
    searchSuggestions?: HeaderSearchSuggestion[];
    onRecentSearchSelect?: (keyword: string) => void;
    onSuggestionSelect?: (suggestion: HeaderSearchSuggestion) => void;
    userSuggestions?: HeaderSearchUserSuggestion[];
    onUserSelect?: (user: HeaderSearchUserSuggestion) => void;
    onViewAllResults?: (keyword: string) => void;
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
    recentSearches = [],
    searchSuggestions = [],
    onRecentSearchSelect,
    onSuggestionSelect,
    userSuggestions = [],
    onUserSelect,
    onViewAllResults,
}: HeaderProps) {
    const [searchFocused, setSearchFocused] = useState(false);
    const trimmedQuery = query.trim();
    const recentToShow = trimmedQuery.length === 0 ? recentSearches.slice(0, 4) : [];
    const showSuggestions = trimmedQuery.length >= 2 && searchSuggestions.length > 0;
    const showUsers = trimmedQuery.length >= 2 && userSuggestions.length > 0;
    const showViewAll = trimmedQuery.length >= 2;
    const showPanel = searchFocused && (recentToShow.length > 0 || showSuggestions || showUsers || showViewAll);

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

    const closePanel = () => setSearchFocused(false);

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

            <div
                className="relative flex-1 min-w-0 max-w-xl mx-1 sm:mx-4"
                onFocus={() => setSearchFocused(true)}
                onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                        setSearchFocused(false);
                    }
                }}
            >
                <SearchInput
                    variant="topbar"
                    value={query}
                    onChange={(e) => onQueryChange && onQueryChange(e.target.value)}
                    onSearchSubmit={onSearchSubmit}
                    onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                            setSearchFocused(false);
                            (event.target as HTMLInputElement).blur();
                        }
                    }}
                    placeholder="Tìm tài liệu..."
                />

                {showPanel && (
                    <div
                        className="fixed inset-x-3 top-[72px] z-50 bg-white border border-[#E6E8F0] rounded-2xl shadow-xl shadow-[#0F172A]/10 overflow-hidden text-left sm:absolute sm:inset-x-0 sm:top-[calc(100%+8px)]"
                        aria-label="Gợi ý tìm kiếm"
                    >
                        {recentToShow.length > 0 && (
                            <div className="px-2 py-2 border-b border-[#F1F5F9]">
                                <p className="px-2 pt-1 pb-1.5 text-[10px] font-bold tracking-wider uppercase text-[#94A3B8]">
                                    Tìm gần đây
                                </p>
                                {recentToShow.map((keyword) => (
                                    <button
                                        key={keyword}
                                        type="button"
                                        className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs font-medium text-[#475569] hover:bg-[#F6F7FB] hover:text-[#4F46E5] transition-colors text-left"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => {
                                            closePanel();
                                            onRecentSearchSelect?.(keyword);
                                        }}
                                    >
                                        <Clock3 size={14} className="shrink-0 text-[#94A3B8]" aria-hidden="true" />
                                        <span className="truncate">{keyword}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {showSuggestions && (
                            <div className="px-2 py-2">
                                <p className="px-2 pt-1 pb-1.5 text-[10px] font-bold tracking-wider uppercase text-[#94A3B8]">
                                    Tài liệu
                                </p>
                                {searchSuggestions.map((suggestion) => (
                                    <button
                                        key={suggestion.id}
                                        type="button"
                                        className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[#F6F7FB] transition-colors text-left"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => {
                                            closePanel();
                                            onSuggestionSelect?.(suggestion);
                                        }}
                                    >
                                        <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#EEF2FF] text-[#4F46E5] shrink-0">
                                            <FileText size={17} strokeWidth={1.9} aria-hidden="true" />
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block text-xs font-semibold text-[#0F172A] truncate">
                                                {suggestion.title}
                                            </span>
                                            <span className="block text-[11px] text-[#64748B] truncate">
                                                {[suggestion.courseName, suggestion.universityName]
                                                    .filter(Boolean)
                                                    .join(' · ') || 'Tài liệu học tập'}
                                            </span>
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {showUsers && (
                            <div className="px-2 py-2 border-t border-[#F1F5F9]">
                                <p className="px-2 pt-1 pb-1.5 text-[10px] font-bold tracking-wider uppercase text-[#94A3B8]">
                                    Người dùng
                                </p>
                                {userSuggestions.map((user) => (
                                    <button
                                        key={user.id}
                                        type="button"
                                        className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[#F6F7FB] transition-colors text-left"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => {
                                            closePanel();
                                            onUserSelect?.(user);
                                        }}
                                    >
                                        <Avatar name={user.fullName} avatar={user.avatarUrl} size="sm" />
                                        <span className="min-w-0">
                                            <span className="block text-xs font-semibold text-[#0F172A] truncate">
                                                {user.fullName}
                                            </span>
                                            <span className="block text-[11px] text-[#64748B] truncate">
                                                {[
                                                    user.username ? `@${user.username}` : '',
                                                    user.universityName,
                                                ]
                                                    .filter(Boolean)
                                                    .join(' · ') || user.badge || 'Thành viên'}
                                            </span>
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {showViewAll && (
                            <button
                                type="button"
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-t border-[#F1F5F9] bg-[#F8FAFC] hover:bg-[#EEF2FF] text-xs font-semibold text-[#4F46E5] transition-colors"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                    closePanel();
                                    onViewAllResults?.(trimmedQuery);
                                }}
                            >
                                <Search size={14} aria-hidden="true" />
                                <span className="truncate">Xem tất cả kết quả cho “{trimmedQuery}”</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
                {/* Bell stays reachable on every width; the upload shortcut yields space on very narrow screens. */}
                <div className="inline-flex items-center justify-center">
                    <NotificationPopover isAuthenticated={isAuthenticated} />
                </div>
                <Link
                    to="/upload"
                    className="inline-flex items-center justify-center p-1.5 sm:p-2 text-[#475569] hover:text-[#4F46E5] hover:bg-[#EEF2FF] rounded-full transition-colors"
                    title="Tải tài liệu"
                >
                    <FileUp size={18} strokeWidth={1.9} aria-hidden="true" />
                </Link>

                {isAuthenticated && currentUser ? (
                    <button
                        className="flex items-center gap-2 pl-1.5 pr-2 min-[400px]:pr-3 py-1 border border-[#E6E8F0] text-xs rounded-full bg-white hover:bg-[#F6F7FB] hover:border-[#C7D2FE] transition-all whitespace-nowrap cursor-pointer shadow-2xs"
                        onClick={handleLogoutClick}
                        aria-label="Đăng xuất"
                    >
                        <span className="hidden min-[400px]:inline-flex">
                            <Avatar user={currentUser} size="sm" />
                        </span>
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
