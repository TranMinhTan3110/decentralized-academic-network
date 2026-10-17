import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/authStore';

export interface ProtectedRouteProps {
    children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        const redirectParam = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/login?redirect=${redirectParam}`} replace />;
    }

    return <>{children}</>;
}
