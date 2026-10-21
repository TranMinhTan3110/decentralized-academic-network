import type { RefObject } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Network, X } from 'lucide-react';
import { defaultAdminNavItems, type AdminNavItem } from './nav.config';

export type { AdminNavItem };

export interface AdminSidebarProps {
    menuOpen?: boolean;
    onCloseMenu?: () => void;
    sidebarRef?: RefObject<HTMLElement | null>;
    navItems?: AdminNavItem[];
    pendingReviewsCount?: number;
    openReportsCount?: number;
    activeNodeId?: string;
    activeNodeLocation?: string;
    nodeSla?: string;
    isNodeConnected?: boolean;
}

export function AdminSidebar({
    menuOpen = false,
    onCloseMenu,
    sidebarRef,
    navItems,
    pendingReviewsCount,
    openReportsCount,
    activeNodeId = 'QmZtmD2...82Fq',
    activeNodeLocation = 'ĐH Bách Khoa HN',
    nodeSla = '99.98%',
    isNodeConnected = true,
}: AdminSidebarProps) {
    // If pendingReviewsCount or openReportsCount are provided, override badge numbers
    const items = (navItems || defaultAdminNavItems).map((item) => {
        if (item.path === '/admin/documents' && pendingReviewsCount !== undefined) {
            return { ...item, badge: pendingReviewsCount };
        }
        if (item.path === '/admin/reports' && openReportsCount !== undefined) {
            return { ...item, badge: openReportsCount };
        }
        return item;
    });

    return (
        <aside
            ref={sidebarRef}
            className={`w-[256px] fixed left-0 top-0 bottom-0 bg-white border-r border-[#dce9ff] flex flex-col z-50 transition-transform duration-200 ease-in-out py-5 px-3.5 gap-1.5 ${
                menuOpen
                    ? 'translate-x-0 shadow-2xl'
                    : '-translate-x-full lg:translate-x-0 pointer-events-none lg:pointer-events-auto'
            }`}
            aria-label="Điều hướng quản trị"
        >
            {/* Header / Brand Logo */}
            <div className="flex items-center justify-between px-2 pt-1 pb-3 mb-1">
                <Link
                    to="/admin"
                    className="flex items-center gap-2.5 text-[#0b1c30] hover:opacity-90 transition-opacity"
                    aria-label="DeDocu Hub Admin"
                >
                    <div className="w-9 h-9 rounded-[10px] bg-[#0b1c30] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Network size={20} className="text-white" aria-hidden="true" />
                    </div>
                    <div>
                        <div className="text-base font-bold tracking-tight leading-tight text-[#0b1c30]">
                            DeDocu Hub
                        </div>
                        <div className="text-[11px] font-medium text-[#5a6a80]">
                            Admin Governance Node v2.4
                        </div>
                    </div>
                </Link>

                {/* Mobile close button */}
                {menuOpen && (
                    <button
                        type="button"
                        onClick={onCloseMenu}
                        className="lg:hidden p-1.5 text-[#5a6a80] hover:text-[#0b1c30] hover:bg-[#eff4ff] rounded-lg transition-colors cursor-pointer"
                        aria-label="Đóng menu"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Navigation items */}
            <nav
                aria-label="Điều hướng quản trị"
                className="flex flex-col gap-1 w-full flex-1 overflow-y-auto pr-0.5"
            >
                {items.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/admin'}
                            onClick={() => {
                                if (menuOpen && onCloseMenu) {
                                    onCloseMenu();
                                }
                            }}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-all group ${
                                    isActive
                                        ? 'bg-[#0b1c30] text-white shadow-xs'
                                        : 'text-[#44505f] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
                                }`
                            }
                        >
                            <Icon size={18} className="shrink-0" aria-hidden="true" />
                            <span className="truncate flex-1 text-left leading-snug">{item.label}</span>
                            {typeof item.badge === 'number' && item.badge > 0 && (
                                <span
                                    className={`shrink-0 ml-auto text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                                        item.badgeColor || 'bg-[#ba1a1a]'
                                    }`}
                                >
                                    {item.badge}
                                </span>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Bottom Node Status Box */}
            <div className="mt-auto border border-[#dce9ff] rounded-xl p-3 bg-[#f8f9ff] text-xs">
                <div className="flex items-center gap-2 font-semibold text-[#0b1c30]">
                    <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                            isNodeConnected ? 'bg-[#009668] animate-pulse' : 'bg-[#ba1a1a]'
                        }`}
                        aria-hidden="true"
                    />
                    <span>Node 8492: {isNodeConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
                <div className="font-mono text-xs text-[#0051d5] font-medium mt-1.5 truncate">
                    {activeNodeId}
                </div>
                <div className="text-[#5a6a80] text-[11px] mt-0.5">
                    {activeNodeLocation} · SLA {nodeSla}
                </div>
            </div>
        </aside>
    );
}
