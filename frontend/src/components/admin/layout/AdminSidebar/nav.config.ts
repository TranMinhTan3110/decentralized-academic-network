import {
    LayoutDashboard,
    FileText,
    AlertTriangle,
    Users,
    GraduationCap,
    Network,
    Settings,
} from 'lucide-react';

export interface AdminNavItem {
    path: string;
    label: string;
    icon: typeof LayoutDashboard;
    badge?: number;
    badgeColor?: string;
}

export const defaultAdminNavItems: AdminNavItem[] = [
    {
        path: '/admin',
        label: 'Tổng quan Admin',
        icon: LayoutDashboard,
    },
    {
        path: '/admin/documents',
        label: 'Quản lý & Kiểm duyệt tài liệu',
        icon: FileText,
        badge: 5,
        badgeColor: 'bg-[#ba1a1a]',
    },
    {
        path: '/admin/reports',
        label: 'Báo cáo vi phạm',
        icon: AlertTriangle,
        badge: 2,
        badgeColor: 'bg-[#ba1a1a]',
    },
    {
        path: '/admin/users',
        label: 'Quản lý người dùng',
        icon: Users,
    },
    {
        path: '/admin/taxonomy',
        label: 'Danh mục học thuật',
        icon: GraduationCap,
    },
    {
        path: '/admin/ipfs',
        label: 'Giám sát Node IPFS',
        icon: Network,
    },
    {
        path: '/admin/settings',
        label: 'Cài đặt & Hồ sơ Admin',
        icon: Settings,
    },
];
