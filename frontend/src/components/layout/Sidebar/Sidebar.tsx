import type { RefObject } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
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

    // Cách 1: Khi chưa đăng nhập, chỉ hiển thị các mục công khai (Home, Khám phá, Bảng xếp hạng, Quiz)
    // Khi đã đăng nhập, hiển thị đầy đủ các mục cá nhân (Recent, Library, Hồ sơ, Cài đặt)
    const visibleNavRoutes = isAuthenticated
        ? navRoutes
        : navRoutes.filter((route) => route.public);

    return (
        <aside
            ref={sidebarRef}
            className={`w-[222px] lg:w-[238px] fixed left-0 top-0 bottom-0 py-[35px] pb-6 px-0 bg-[#14213d] flex flex-col z-50 text-[#f8fafc] transition-transform duration-200 ${
                menuOpen
                    ? 'translate-x-0 shadow-2xl'
                    : '-translate-x-full lg:translate-x-0 pointer-events-none lg:pointer-events-auto lg:shadow-[8px_0_0_#e7edf7]'
            }`}
        >
            <div className="px-6">
                <Link
                    to="/"
                    className="text-3xl tracking-tighter font-extrabold flex items-center gap-2.5 leading-none text-[#f0f4f8]"
                    aria-label="Mục lục — Trang khám phá"
                >
                    <span className="flex gap-1 h-[29px] items-stretch w-[28px]">
                        <i className="bg-[#3d5a80] w-[6px] not-italic block" />
                        <i className="bg-[#8fa3bf] w-[6px] h-[21px] self-end not-italic block" />
                        <i className="bg-[#3d5a80] w-[6px] not-italic block" />
                    </span>
                    <span>
                        mục lục<span className="text-[#8fa3bf]">.</span>
                    </span>
                </Link>
                <p className="text-[8px] tracking-[1.6px] my-3.5 mb-8 text-[#8fa3bf] font-semibold uppercase">
                    MỘT NƠI CHO VIỆC HỌC
                </p>
            </div>

            <nav aria-label="Điều hướng chính" className="flex flex-col gap-1 w-full">
                {visibleNavRoutes.map(({ path, label, icon: Icon }) => (
                    <NavLink
                        key={path}
                        to={path}
                        end={path === '/'}
                        className={({ isActive }) =>
                            `w-full flex items-center gap-3.5 px-6 py-3.5 text-xs min-h-[46px] transition-colors border-l-4 ${
                                isActive
                                    ? 'text-white bg-[#1f3a5f] border-l-[#ee964b] font-semibold'
                                    : 'text-[#d9e2ee] border-l-transparent hover:text-white hover:bg-[#1f3a5f]'
                            }`
                        }
                    >
                        <Icon size={20} aria-hidden="true" className="shrink-0" />
                        <span>{label}</span>
                        {path === '/library' && savedCount > 0 && (
                            <span className="ml-auto text-[11px] text-[#d7e3f5]">{savedCount}</span>
                        )}
                    </NavLink>
                ))}
            </nav>

            {!isAuthenticated && (
                <div className="mx-5 my-3 p-3.5 bg-[#1f3a5f]/80 border border-[#3d5a80]/50 rounded-xl flex flex-col gap-2">
                    <span className="text-[9px] tracking-[1.3px] font-semibold text-[#ee964b] block uppercase">
                        TRẢI NGHIỆM ĐẦY ĐỦ
                    </span>
                    <p className="text-[11px] text-[#cbd5e1] leading-relaxed">
                        Đăng nhập để xem Thư viện, Lịch sử và Hồ sơ cá nhân của bạn.
                    </p>
                    <Link
                        to="/login"
                        className="text-center py-1.5 px-3 bg-[#ee964b] hover:bg-[#d97d32] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                    >
                        Đăng nhập ngay
                    </Link>
                </div>
            )}

            <div className="mx-5 mt-auto border-t border-[rgb(61_90_128_/_30%)] p-4 bg-[#1f3a5f] rounded-[5px]">
                <span className="text-[9px] tracking-[1.3px] font-semibold text-[#8fa3bf] block uppercase">
                    GÓP MỘT TRANG HAY
                </span>
                <p className="text-xs text-[#c5d2e2] leading-relaxed my-3">
                    Những tài liệu và ghi chép của bạn có thể giúp một người hiểu bài hơn.
                </p>
                <Link
                    to="/upload"
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#f0f4f8] hover:text-[#ee964b] transition-colors"
                >
                    <span>Chia sẻ tài liệu</span>
                    <ArrowUpRight size={17} aria-hidden="true" />
                </Link>
            </div>
        </aside>
    );
}
