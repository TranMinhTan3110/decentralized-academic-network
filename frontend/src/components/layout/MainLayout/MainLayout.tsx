import { useEffect, useRef, useState, type ReactNode, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../Header';
import type { HeaderSearchSuggestion, HeaderSearchUserSuggestion } from '../Header';
import { Sidebar } from '../Sidebar';
import { Button } from '../../ui';
import { X } from 'lucide-react';
import type { UserProfile } from '../../../types';
import { useAuth } from '../../../lib/authStore';
import { documentService } from '../../../services/documentService';
import { userService } from '../../../services/userService';

export interface MainLayoutProps {
    children?: ReactNode;
    savedCount?: number;
    currentUser?: UserProfile | null;
    isAuthenticated?: boolean;
    onLogout?: () => void;
    toastMessage?: string;
    onCloseToast?: () => void;
    onSearchSubmit?: (query: string) => void;
    hideFooter?: boolean;
}

export function MainLayout({
    children,
    savedCount = 0,
    currentUser: propCurrentUser,
    isAuthenticated: propIsAuthenticated,
    onLogout: propOnLogout,
    toastMessage,
    onCloseToast,
    onSearchSubmit,
}: MainLayoutProps) {
    const auth = useAuth();
    const currentUser = propCurrentUser !== undefined ? propCurrentUser : auth.currentUser;
    const isAuthenticated = propIsAuthenticated !== undefined ? propIsAuthenticated : auth.isAuthenticated;
    const onLogout = propOnLogout || auth.logout;
    const [menuOpen, setMenuOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [searchSuggestions, setSearchSuggestions] = useState<HeaderSearchSuggestion[]>([]);
    const [userSuggestions, setUserSuggestions] = useState<HeaderSearchUserSuggestion[]>([]);
    const [recentSearches, setRecentSearches] = useState<string[]>(() =>
        documentService.getRecentSearchKeywords(),
    );
    const navigate = useNavigate();
    const sidebarRef = useRef<HTMLElement>(null);
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const mainRef = useRef<HTMLElement>(null);

    const [mobile, setMobile] = useState(
        () =>
            typeof window !== 'undefined' &&
            typeof window.matchMedia === 'function' &&
            window.matchMedia('(max-width: 1023px)').matches,
    );

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
        const media = window.matchMedia('(max-width: 1023px)');
        const onChange = () => setMobile(media.matches);
        media.addEventListener('change', onChange);
        return () => media.removeEventListener('change', onChange);
    }, []);

    useEffect(() => {
        const keyword = query.trim();
        if (keyword.length < 2) {
            return;
        }

        let active = true;
        const timer = setTimeout(() => {
            Promise.all([
                documentService.getSearchSuggestions(keyword, 5).catch(() => null),
                userService.searchUsers(keyword, 3).catch(() => []),
            ]).then(([docRes, userRes]) => {
                if (!active) return;
                const items = Array.isArray(docRes) ? docRes : docRes?.content ?? [];
                setSearchSuggestions(
                    items.slice(0, 5).map((item: any) => ({
                        id: String(item.id),
                        title: item.title,
                        courseName: item.courseName,
                        universityName: item.universityName,
                        fileExtension: item.fileExtension,
                    })),
                );
                setUserSuggestions(
                    (userRes ?? []).slice(0, 3).map((user: any) => ({
                        id: String(user.id ?? user.username),
                        fullName: user.fullName || user.name || user.username || 'Người dùng',
                        username: user.username,
                        avatarUrl: user.avatarUrl,
                        universityName: user.universityName,
                        badge: user.badge,
                    })),
                );
            });
        }, 250);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [query]);

    const goToSearchResults = (keyword: string) => {
        const cleaned = keyword.trim();
        if (!cleaned) return;
        documentService.recordSearchKeyword(cleaned);
        setRecentSearches(documentService.getRecentSearchKeywords());
        setQuery(cleaned);
        navigate(`/explore?q=${encodeURIComponent(cleaned)}`);
    };

    const handleQueryChange = (value: string) => {
        setQuery(value);
        setSearchSuggestions([]);
        setUserSuggestions([]);
    };

    useEffect(() => {
        if (!menuOpen || !mobile) {
            if (document.body.style.overflow === 'hidden') {
                document.body.style.overflow = '';
            }
            return;
        }
        sidebarRef.current?.querySelector<HTMLElement>('a')?.focus();

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setMenuOpen(false);
                menuButtonRef.current?.focus();
            }
            if (event.key === 'Tab') {
                const links = sidebarRef.current?.querySelectorAll<HTMLElement>('a, button');
                if (!links?.length) return;
                const first = links[0];
                const last = links[links.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [menuOpen, mobile]);

    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault();
        const keyword = query.trim();
        if (!keyword) return;
        onSearchSubmit?.(query);
        goToSearchResults(keyword);
    };

    return (
        <div className="min-h-screen bg-[#F6F7FB]">
            <a
                href="#main"
                className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-6 focus:z-50 focus:bg-[#4F46E5] focus:text-white focus:px-4 focus:py-2 focus:rounded-xl"
            >
                Đến nội dung chính
            </a>

            <Sidebar
                sidebarRef={sidebarRef}
                menuOpen={menuOpen}
                savedCount={savedCount}
                isAuthenticated={isAuthenticated}
            />

            {menuOpen && (
                <button
                    className="fixed inset-0 bg-[#0f172a]/35 z-40 lg:hidden border-none cursor-pointer backdrop-blur-[2px]"
                    aria-label="Đóng điều hướng"
                    onClick={() => setMenuOpen(false)}
                />
            )}

            <div className="lg:ml-[248px] flex flex-col min-h-screen min-w-0">
                <Header
                    menuOpen={menuOpen}
                    onToggleMenu={() => setMenuOpen(!menuOpen)}
                    menuButtonRef={menuButtonRef}
                    query={query}
                    onQueryChange={handleQueryChange}
                    onSearchSubmit={handleSearchSubmit}
                    recentSearches={recentSearches}
                    searchSuggestions={searchSuggestions}
                    onRecentSearchSelect={goToSearchResults}
                    onSuggestionSelect={(suggestion) => navigate(`/detail/${suggestion.id}`)}
                    userSuggestions={userSuggestions}
                    onUserSelect={(user) => navigate(`/profile/${user.username || user.id}`)}
                    onViewAllResults={goToSearchResults}
                    currentUser={currentUser}
                    isAuthenticated={isAuthenticated}
                    onLogout={onLogout}
                />

                <main
                    id="main"
                    ref={mainRef}
                    tabIndex={-1}
                    className="flex-1 max-w-[1380px] w-full mx-auto p-4 sm:p-6 lg:px-8 lg:py-7 focus:outline-none min-w-0 overflow-x-hidden"
                >
                    {children}
                </main>
            </div>

            {toastMessage && (
                <div
                    className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-[#0F172A] text-white px-4 py-2.5 rounded-2xl flex items-center gap-3 text-xs max-w-[calc(100%-24px)] shadow-lg border border-white/10"
                    role="status"
                >
                    <span>{toastMessage}</span>
                    <Button variant="icon" aria-label="Đóng thông báo" onClick={onCloseToast} icon={<X size={16} />} />
                </div>
            )}
        </div>
    );
}
