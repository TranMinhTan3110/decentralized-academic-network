import type { ReactNode } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, Home, LogIn } from 'lucide-react';
import { useAuth } from '../lib/authStore';

export interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { isAuthenticated, currentUser, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    if (!isAuthenticated) {
        const redirectParam = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/login?redirect=${redirectParam}`} replace />;
    }

    if (allowedRoles && allowedRoles.length > 0) {
        const userRole = (currentUser?.role || '').toUpperCase();
        const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());

        if (!normalizedAllowed.includes(userRole)) {
            const redirectParam = encodeURIComponent(location.pathname + location.search);
            return (
                <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-4 font-sans">
                    <div className="max-w-md w-full bg-white border border-[#dce9ff] rounded-2xl shadow-sm p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[#fff0f0] text-[#ba1a1a] flex items-center justify-center border border-[#ffd6d6]">
                            <ShieldAlert size={32} aria-hidden="true" />
                        </div>
                        <p className="text-xs font-bold tracking-wider uppercase text-[#ba1a1a] mb-1.5">
                            Lỗi 403 · Truy cập bị từ chối
                        </p>
                        <h1 className="text-xl font-bold text-[#0b1c30] mb-2">
                            Bạn không có quyền Quản trị viên
                        </h1>
                        <p className="text-sm text-[#5a6a80] leading-relaxed mb-6">
                            Tài khoản{' '}
                            <strong className="text-[#0b1c30]">
                                {currentUser?.name || currentUser?.email || 'hiện tại'}
                            </strong>{' '}
                            không có quyền truy cập vào khu vực quản trị hệ thống. Vui lòng quay về trang học tập hoặc đăng nhập bằng tài khoản Quản trị viên.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => navigate('/', { replace: true })}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-sm font-semibold transition-colors cursor-pointer"
                            >
                                <Home size={16} aria-hidden="true" />
                                <span>Về trang chủ</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    logout();
                                    navigate(`/login?redirect=${redirectParam}`, { replace: true });
                                }}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-[#f1f5f9] text-[#0b1c30] border border-[#cbd5e1] text-sm font-semibold transition-colors cursor-pointer"
                            >
                                <LogIn size={16} aria-hidden="true" />
                                <span>Đổi tài khoản</span>
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
    }

    return <>{children}</>;
}
