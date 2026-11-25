import type { RefObject } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Plus, ShieldCheck, Sparkles } from 'lucide-react';
import { navRoutes } from '../../../routes';
import { useAuth } from '../../../lib/authStore';

export interface SidebarProps {
    menuOpen?: boolean;
    savedCount?: number;
    isAuthenticated?: boolean;
    sidebarRef?: RefObject<HTMLElement | null>;
}

export function Sidebar({ menuOpen = false, savedCount = 0, isAuthenticated: propIsAuthenticated, sidebarRef }: SidebarProps) {
    const auth = useAuth();
    const isAuthenticated = propIsAuthenticated !== undefined ? propIsAuthenticated : auth.isAuthenticated;
    const isAdmin = isAuthenticated && (auth.isAdmin || auth.currentUser?.role?.toUpperCase() === 'ADMIN');

    // Luôn hiển thị đầy đủ các mục điều hướng (Trang chủ, Khám phá, Gần đây, Thư viện, Hồ sơ, Cài đặt, Bảng xếp hạng, Trợ lý AI, Luyện tập trắc nghiệm)
    const visibleNavRoutes = navRoutes;

    return (
        <aside
            ref={sidebarRef}
            className={`w-[236px] lg:w-[248px] fixed left-0 top-0 bottom-0 py-5 px-3.5 bg-white border-r border-[#E6E8F0] flex flex-col z-50 text-[#0F172A] transition-transform duration-200 ${
                menuOpen
                    ? 'translate-x-0 shadow-2xl'
                    : '-translate-x-full lg:translate-x-0 pointer-events-none lg:pointer-events-auto'
            }`}
        >
            {/* BRAND HEADER */}
            <div className="px-2.5 mb-5">
                <Link
                    to="/"
                    className="flex items-center gap-2.5 group"
                    aria-label="DeDocu Hub — Trang chủ"
                >
                    <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center shadow-sm shadow-indigo-500/25 shrink-0 group-hover:scale-[1.03] transition-transform">
                        <span className="flex gap-[3px] h-[16px] items-end">
                            <i className="bg-white/95 w-[3.5px] h-[16px] rounded-full not-italic block" />
                            <i className="bg-indigo-200 w-[3.5px] h-[11px] rounded-full not-italic block" />
                            <i className="bg-white/95 w-[3.5px] h-[16px] rounded-full not-italic block" />
                        </span>
                    </span>
                    <div className="leading-none">
                        <span className="text-[19px] font-extrabold tracking-tight text-[#0F172A] block">
                            DeDocu<span className="text-[#4F46E5]">.</span>
                        </span>
                        <span className="text-[9px] tracking-[0.14em] text-[#64748B] font-semibold uppercase block mt-0.5">
                            MẠNG HỌC THUẬT
                        </span>
                    </div>
                </Link>
            </div>

            {/* PRIMARY SOCIAL POST CTA */}
            <div className="px-1 mb-4">
                <Link
                    to="/upload"
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:from-[#4338CA] hover:to-[#4F46E5] text-white text-xs font-semibold shadow-sm shadow-indigo-500/20 hover:shadow-md hover:shadow-indigo-500/30 transition-all"
                >
                    <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
                    <span>Chia sẻ tài liệu</span>
                </Link>
            </div>

            {/* NAVIGATION */}
            <nav aria-label="Điều hướng chính" className="flex flex-col gap-0.5 w-full flex-1 overflow-y-auto pr-0.5">
                {visibleNavRoutes.map(({ path, label, icon: Icon }) => (
                    <NavLink
                        key={path}
                        to={path}
                        end={path === '/'}
                        className={({ isActive }) =>
                            `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all ${
                                isActive
                                    ? 'bg-[#EEF2FF] text-[#4F46E5] font-semibold shadow-2xs'
                                    : 'text-[#475569] font-medium hover:bg-[#F6F7FB] hover:text-[#0F172A]'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <Icon
                                    size={19}
                                    aria-hidden="true"
                                    className={`shrink-0 ${isActive ? 'text-[#4F46E5]' : 'text-[#64748B]'}`}
                                />
                                <span className="truncate">{label}</span>
                                {path === '/library' && savedCount > 0 && (
                                    <span className="ml-auto px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-[10px] font-bold">
                                        {savedCount}
                                    </span>
                                )}
                            </>
                        )}
                    </NavLink>
                ))}

                {isAdmin && (
                    <NavLink
                        to="/admin"
                        className={({ isActive }) =>
                            `w-full flex items-center gap-3 px-3 py-2.5 mt-1 rounded-xl text-[13px] transition-all border ${
                                isActive
                                    ? 'bg-amber-50 text-amber-800 border-amber-200 font-semibold'
                                    : 'bg-amber-50/50 text-amber-700 border-amber-100 hover:bg-amber-50 font-semibold'
                            }`
                        }
                    >
                        <ShieldCheck size={19} aria-hidden="true" className="shrink-0 text-amber-600" />
                        <span className="truncate">Trang quản trị Admin</span>
                    </NavLink>
                )}
            </nav>

            {/* GUEST CALLOUT OR COMMUNITY CARD */}
            {!isAuthenticated ? (
                <div className="mt-3 p-3.5 bg-gradient-to-br from-[#EEF2FF] to-[#F5F3FF] border border-[#E0E7FF] rounded-2xl flex flex-col gap-2">
                    <span className="text-[10px] tracking-wider font-bold text-[#4F46E5] flex items-center gap-1 uppercase">
                        <Sparkles size={12} /> TRẢI NGHIỆM ĐẦY ĐỦ
                    </span>
                    <p className="text-[11px] text-[#475569] leading-relaxed">
                        Đăng nhập để lưu tài liệu, theo dõi học giả và tích điểm cộng đồng.
                    </p>
                    <Link
                        to="/login"
                        className="text-center py-2 px-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                    >
                        Đăng nhập ngay
                    </Link>
                </div>
            ) : (
                <div className="mt-3 p-3.5 bg-[#F6F7FB] border border-[#E6E8F0] rounded-2xl">
                    <span className="text-[10px] tracking-wider font-bold text-[#4F46E5] block uppercase">
                        GÓP MỘT TRANG HAY
                    </span>
                    <p className="text-[11px] text-[#64748B] leading-relaxed mt-1.5">
                        Mỗi ghi chép bạn chia sẻ giúp cộng đồng học tập nhanh hơn và nhận điểm uy tín.
                    </p>
                </div>
            )}
        </aside>
    );
}
