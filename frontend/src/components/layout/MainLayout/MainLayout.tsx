import { useEffect, useRef, useState, type ReactNode, type FormEvent } from 'react';
import { Header } from '../Header';
import { Sidebar } from '../Sidebar';
import { Footer } from '../Footer';
import { Button } from '../../ui';
import { X } from 'lucide-react';
import type { UserProfile } from '../../../types';

export interface MainLayoutProps {
    children?: ReactNode;
    savedCount?: number;
    currentUser?: UserProfile | null;
    isAuthenticated?: boolean;
    onLogout?: () => void;
    toastMessage?: string;
    onCloseToast?: () => void;
    onSearchSubmit?: (query: string) => void;
}

export function MainLayout({
    children,
    savedCount = 0,
    currentUser,
    isAuthenticated = false,
    onLogout,
    toastMessage,
    onCloseToast,
    onSearchSubmit,
}: MainLayoutProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [query, setQuery] = useState('');
    const sidebarRef = useRef<HTMLElement>(null);
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const mainRef = useRef<HTMLElement>(null);

    const [mobile, setMobile] = useState(
        () =>
            typeof window !== 'undefined' &&
            typeof window.matchMedia === 'function' &&
            window.matchMedia('(max-width: 700px)').matches,
    );

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
        const media = window.matchMedia('(max-width: 700px)');
        const onChange = () => setMobile(media.matches);
        media.addEventListener('change', onChange);
        return () => media.removeEventListener('change', onChange);
    }, []);

    useEffect(() => {
        if (!menuOpen || !mobile) return;
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
        if (onSearchSubmit) {
            onSearchSubmit(query);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <a
                href="#main"
                className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-6 focus:z-50 focus:bg-[#121827] focus:text-white focus:p-3"
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
                    className="fixed inset-0 bg-[#292827]/40 z-40 md:hidden border-none cursor-pointer"
                    aria-label="Đóng điều hướng"
                    onClick={() => setMenuOpen(false)}
                />
            )}

            <div className="md:ml-[222px] lg:ml-[238px] flex flex-col min-h-screen">
                <Header
                    menuOpen={menuOpen}
                    onToggleMenu={() => setMenuOpen(!menuOpen)}
                    menuButtonRef={menuButtonRef}
                    query={query}
                    onQueryChange={setQuery}
                    onSearchSubmit={handleSearchSubmit}
                    currentUser={currentUser}
                    isAuthenticated={isAuthenticated}
                    onLogout={onLogout}
                />

                <main
                    id="main"
                    ref={mainRef}
                    tabIndex={-1}
                    className="flex-1 max-w-[1460px] w-full mx-auto p-6 md:p-[42px_42px_30px] focus:outline-none"
                >
                    {children}
                    <Footer />
                </main>
            </div>

            {toastMessage && (
                <div
                    className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-[#121827] text-white p-[7px_10px_7px_20px] rounded-md flex items-center gap-4 text-xs max-w-[calc(100%-24px)] shadow-[5px_5px_0_#cad6f2] border-l-4 border-l-[#ee964b]"
                    role="status"
                >
                    <span>{toastMessage}</span>
                    <Button variant="icon" aria-label="Đóng thông báo" onClick={onCloseToast} icon={<X size={17} />} />
                </div>
            )}
        </div>
    );
}
