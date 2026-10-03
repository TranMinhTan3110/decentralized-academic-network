import type { RefObject } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ArrowUpRight, Dot } from 'lucide-react';
import { navRoutes } from '../../../routes';

export interface SidebarProps {
    menuOpen?: boolean;
    savedCount?: number;
    isAuthenticated?: boolean;
    sidebarRef?: RefObject<HTMLElement | null>;
}

export function Sidebar({ menuOpen = false, savedCount = 0, isAuthenticated = false, sidebarRef }: SidebarProps) {
    return (
        <aside
            ref={sidebarRef}
            className={`w-[222px] lg:w-[238px] fixed left-0 top-0 bottom-0 py-[35px] pb-6 px-0 bg-[#14213d] flex flex-col z-50 text-[#f8fafc] shadow-[8px_0_0_#e7edf7] transition-transform duration-200 ${
                menuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
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
                {navRoutes.map(({ path, label, icon: Icon, public: publicRoute }) => (
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
                        {!publicRoute && !isAuthenticated && (
                            <span className="ml-auto text-[#8fa3bf] text-base leading-none" aria-label="Cần đăng nhập">
                                <Dot />
                            </span>
                        )}
                        {path === '/library' && savedCount > 0 && (
                            <span className="ml-auto text-[11px] text-[#d7e3f5]">{savedCount}</span>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="mx-5 mt-4 border-t border-[rgb(61_90_128_/_30%)] p-4 bg-[#1f3a5f] rounded-[5px]">
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
