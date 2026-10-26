import { useState, useRef, useEffect, type ReactNode, type FormEvent } from 'react';
import { AdminSidebar, type AdminNavItem } from '../AdminSidebar';
import { AdminHeader } from '../AdminHeader';
import { useAuth } from '../../../../lib/authStore';
import type { UserProfile } from '../../../../types';

export interface AdminLayoutProps {
    children?: ReactNode;
    title?: string;
    breadcrumb?: string;
    subtitle?: string;
    actions?: ReactNode;
    navItems?: AdminNavItem[];
    pendingReviewsCount?: number;
    openReportsCount?: number;
    isNodeConnected?: boolean;
    adminUser?: UserProfile | null;
    adminRole?: string;
    onSearchSubmit?: (query: string) => void;
    onNotificationsClick?: () => void;
    onProfileClick?: () => void;
}

export function AdminLayout({
    children,
    title,
    breadcrumb,
    subtitle,
    actions,
    navItems,
    pendingReviewsCount,
    openReportsCount,
    isNodeConnected = true,
    adminUser: propAdminUser,
    adminRole = 'Council Auditor',
    onSearchSubmit,
    onNotificationsClick,
    onProfileClick,
}: AdminLayoutProps) {
    const auth = useAuth();
    const adminUser = propAdminUser !== undefined ? propAdminUser : auth.currentUser;

    const [menuOpen, setMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const sidebarRef = useRef<HTMLElement>(null);
    const menuButtonRef = useRef<HTMLButtonElement>(null);

    // Keyboard support: Escape closes mobile drawer
    useEffect(() => {
        if (!menuOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setMenuOpen(false);
                menuButtonRef.current?.focus();
            }
        };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [menuOpen]);

    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (onSearchSubmit) {
            onSearchSubmit(searchQuery);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col font-sans">
            {/* Skip to main content accessibility link */}
            <a
                href="#admin-main"
                className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-6 focus:z-50 focus:bg-[#0b1c30] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
            >
                Đến nội dung quản trị
            </a>

            {/* Admin Sidebar */}
            <AdminSidebar
                sidebarRef={sidebarRef}
                menuOpen={menuOpen}
                onCloseMenu={() => setMenuOpen(false)}
                navItems={navItems}
                pendingReviewsCount={pendingReviewsCount}
                openReportsCount={openReportsCount}
                isNodeConnected={isNodeConnected}
            />

            {/* Mobile backdrop overlay */}
            {menuOpen && (
                <button
                    type="button"
                    className="fixed inset-0 bg-[#0b1c30]/50 z-40 lg:hidden border-none cursor-pointer backdrop-blur-[2px] transition-opacity"
                    aria-label="Đóng điều hướng quản trị"
                    onClick={() => setMenuOpen(false)}
                />
            )}

            {/* Main content wrapper */}
            <div className="lg:ml-[256px] flex flex-col min-h-screen min-w-0 transition-all">
                {/* Admin Header */}
                <AdminHeader
                    menuOpen={menuOpen}
                    onToggleMenu={() => setMenuOpen((prev) => !prev)}
                    menuButtonRef={menuButtonRef}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onSearchSubmit={handleSearchSubmit}
                    adminUser={adminUser}
                    adminRole={adminRole}
                    isNodeConnected={isNodeConnected}
                    onNotificationsClick={onNotificationsClick}
                    onProfileClick={onProfileClick}
                />

                {/* Page Content */}
                <main
                    id="admin-main"
                    tabIndex={-1}
                    className="flex-1 p-4 sm:p-6 lg:p-[28px_24px_48px] focus:outline-none min-w-0 overflow-x-hidden flex flex-col gap-6"
                >
                    {/* Optional Standardized Page Head */}
                    {(title || breadcrumb || subtitle || actions) && (
                        <div className="flex flex-wrap gap-4 items-end justify-between border-b border-[#dce9ff]/60 pb-5">
                            <div>
                                {breadcrumb && (
                                    <div className="text-xs text-[#5a6a80] mb-1 font-medium">
                                        {breadcrumb}
                                    </div>
                                )}
                                {title && (
                                    <h1 className="text-xl sm:text-2xl lg:text-[26px] font-bold text-[#0b1c30] tracking-tight leading-tight">
                                        {title}
                                    </h1>
                                )}
                                {subtitle && (
                                    <p className="text-xs sm:text-sm text-[#5a6a80] mt-1 leading-relaxed">
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                            {actions && (
                                <div className="flex flex-wrap items-center gap-2.5">
                                    {actions}
                                </div>
                            )}
                        </div>
                    )}

                    {children}
                </main>
            </div>
        </div>
    );
}
