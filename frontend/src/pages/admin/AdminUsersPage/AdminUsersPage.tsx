import { useState, useMemo } from 'react';
import {
    Search,
    Shield,
    SlidersHorizontal,
    Lock,
    Unlock,
    Users,
    KeyRound,
    UserX,
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '../../../components/admin';
import { UserLockModal } from './components/UserLockModal';
import { UserRoleModal } from './components/UserRoleModal';
import { UserAdjustModal } from './components/UserAdjustModal';
import {
    type AdminUser,
    type UserRole,
    type UserStatus,
    type SchoolFilter,
    type RoleFilter,
    type StatusFilter,
} from './types';

export const initialAdminUsers: AdminUser[] = [
    {
        id: 'u1',
        fullName: 'Âu Dương Tấn',
        username: 'auduongtan',
        email: 'tan.auduong@dedocu.vn',
        school: 'HUST',
        faculty: 'CNTT',
        role: 'ADMIN',
        status: 'ACTIVE',
        documentsCount: 12,
        reputation: 999,
        tokenBalance: 9999,
        joinedDate: '01/09/2026',
    },
    {
        id: 'u2',
        fullName: 'Nguyễn Văn Học Sinh',
        username: 'hocsinh99',
        email: 'student99@dedocu.vn',
        school: 'NEU',
        faculty: 'Kinh tế',
        role: 'USER',
        status: 'ACTIVE',
        documentsCount: 2,
        reputation: 45,
        tokenBalance: 20,
        joinedDate: '10/10/2026',
    },
    {
        id: 'u3',
        fullName: 'Phạm Gia Huy',
        username: 'giahuy_ptit',
        email: 'huy.pg@dedocu.vn',
        school: 'PTIT',
        faculty: 'An toàn thông tin',
        role: 'VIP',
        status: 'ACTIVE',
        documentsCount: 48,
        reputation: 612,
        tokenBalance: 340,
        joinedDate: '12/09/2026',
    },
    {
        id: 'u4',
        fullName: 'Lê Minh Quân',
        username: 'quanle',
        email: 'quan.le@dedocu.vn',
        school: 'NEU',
        faculty: 'Kinh tế học',
        role: 'USER',
        status: 'ACTIVE',
        documentsCount: 5,
        reputation: 18,
        tokenBalance: 60,
        joinedDate: '28/09/2026',
    },
    {
        id: 'u5',
        fullName: 'Hoàng Đức Minh',
        username: 'minhhd',
        email: 'minh.hd@dedocu.vn',
        school: 'FTU',
        faculty: 'Kinh tế đối ngoại',
        role: 'USER',
        status: 'BANNED',
        documentsCount: 4,
        reputation: 3,
        tokenBalance: 0,
        joinedDate: '02/10/2026',
    },
    {
        id: 'u6',
        fullName: 'Trần Thị Bích',
        username: 'bichtran',
        email: 'bich.tt@dedocu.vn',
        school: 'UEH',
        faculty: 'Vật lý kỹ thuật',
        role: 'USER',
        status: 'UNVERIFIED',
        documentsCount: 1,
        reputation: 0,
        tokenBalance: 20,
        joinedDate: '15/10/2026',
    },
];

const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
};

export function AdminUsersPage() {
    const [users, setUsers] = useState<AdminUser[]>(initialAdminUsers);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSchool, setSelectedSchool] = useState<SchoolFilter>('ALL');
    const [selectedRole, setSelectedRole] = useState<RoleFilter>('ALL');
    const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('ALL');

    // Modals
    const [lockModalUser, setLockModalUser] = useState<AdminUser | null>(null);
    const [lockAction, setLockAction] = useState<'LOCK' | 'UNLOCK'>('LOCK');
    const [roleModalUser, setRoleModalUser] = useState<AdminUser | null>(null);
    const [adjustModalUser, setAdjustModalUser] = useState<AdminUser | null>(null);

    // Filtering logic
    const filteredUsers = useMemo(() => {
        return users.filter((u) => {
            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchName = u.fullName.toLowerCase().includes(q);
                const matchUsername = u.username.toLowerCase().includes(q);
                const matchEmail = u.email.toLowerCase().includes(q);
                if (!matchName && !matchUsername && !matchEmail) return false;
            }

            // School filter
            if (selectedSchool !== 'ALL' && u.school !== selectedSchool) {
                return false;
            }

            // Role filter
            if (selectedRole !== 'ALL' && u.role !== selectedRole) {
                return false;
            }

            // Status filter
            if (selectedStatus !== 'ALL' && u.status !== selectedStatus) {
                return false;
            }

            return true;
        });
    }, [users, searchQuery, selectedSchool, selectedRole, selectedStatus]);

    // Handlers
    const handleOpenLock = (user: AdminUser) => {
        setLockAction('LOCK');
        setLockModalUser(user);
    };

    const handleOpenUnlock = (user: AdminUser) => {
        setLockAction('UNLOCK');
        setLockModalUser(user);
    };

    const handleConfirmLock = (userId: string) => {
        setUsers((prev) =>
            prev.map((item) =>
                item.id === userId
                    ? { ...item, status: lockAction === 'LOCK' ? 'BANNED' : 'ACTIVE' }
                    : item
            )
        );
        const target = users.find((u) => u.id === userId);
        if (lockAction === 'LOCK') {
            toast.success(`Đã khóa tài khoản: ${target?.fullName ?? ''}`);
        } else {
            toast.success(`Đã mở khóa tài khoản: ${target?.fullName ?? ''}`);
        }
        setLockModalUser(null);
    };

    const handleConfirmRole = (userId: string, newRole: UserRole) => {
        setUsers((prev) =>
            prev.map((item) => (item.id === userId ? { ...item, role: newRole } : item))
        );
        const target = users.find((u) => u.id === userId);
        toast.success(`Đã cập nhật vai trò ${newRole} cho người dùng ${target?.fullName ?? ''}`);
        setRoleModalUser(null);
    };

    const handleConfirmAdjust = (
        userId: string,
        newReputation: number,
        newTokenBalance: number
    ) => {
        setUsers((prev) =>
            prev.map((item) =>
                item.id === userId
                    ? { ...item, reputation: newReputation, tokenBalance: newTokenBalance }
                    : item
            )
        );
        const target = users.find((u) => u.id === userId);
        toast.success(
            `Đã cập nhật điểm uy tín (${newReputation}) và số dư (${newTokenBalance}) cho ${target?.fullName ?? ''}`
        );
        setAdjustModalUser(null);
    };

    return (
        <AdminLayout
            breadcrumb="Admin / Người dùng"
            title="Quản lý người dùng & phân quyền"
            subtitle="Danh sách sinh viên, phân quyền, khóa tài khoản và điều chỉnh điểm"
            pendingReviewsCount={4}
            openReportsCount={3}
        >
            {/* Main Content Card */}
            <div className="bg-white border border-[#dce9ff] rounded-[14px] shadow-2xs overflow-hidden max-w-full">
                {/* Toolbar: Search input & 3 filter dropdowns */}
                <div className="p-3 sm:p-4 border-b border-[#e5eeff] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                    {/* Search box */}
                    <div className="relative flex-1 min-w-[220px]">
                        <Search
                            size={16}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5a6a80]"
                        />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Email, username, họ tên, số điện thoại..."
                            aria-label="Tìm kiếm người dùng"
                            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-[#c3d0e6] rounded-[9px] text-[#0b1c30] placeholder-[#5a6a80] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5] transition-all"
                        />
                    </div>

                    {/* Filter dropdowns */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 w-full lg:w-auto">
                        {/* School Filter */}
                        <select
                            value={selectedSchool}
                            onChange={(e) => setSelectedSchool(e.target.value as SchoolFilter)}
                            aria-label="Lọc theo trường"
                            className="h-9 px-3 text-xs bg-white border border-[#c3d0e6] rounded-[9px] text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5] cursor-pointer"
                        >
                            <option value="ALL">Tất cả trường</option>
                            <option value="HUST">HUST - ĐH Bách Khoa HN</option>
                            <option value="NEU">NEU - ĐH Kinh tế Quốc dân</option>
                            <option value="PTIT">PTIT - Học viện BCVT</option>
                            <option value="FTU">FTU - ĐH Ngoại thương</option>
                            <option value="UEH">UEH - ĐH Kinh tế TP.HCM</option>
                        </select>

                        {/* Role Filter */}
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value as RoleFilter)}
                            aria-label="Lọc theo vai trò"
                            className="h-9 px-3 text-xs bg-white border border-[#c3d0e6] rounded-[9px] text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5] cursor-pointer"
                        >
                            <option value="ALL">Mọi vai trò</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="USER">USER</option>
                            <option value="VIP">VIP</option>
                        </select>

                        {/* Status Filter */}
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value as StatusFilter)}
                            aria-label="Lọc theo trạng thái"
                            className="h-9 px-3 text-xs bg-white border border-[#c3d0e6] rounded-[9px] text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5] cursor-pointer"
                        >
                            <option value="ALL">Mọi trạng thái</option>
                            <option value="ACTIVE">ACTIVE (Hoạt động)</option>
                            <option value="BANNED">BANNED (Đã khóa)</option>
                            <option value="UNVERIFIED">UNVERIFIED (Chưa kích hoạt)</option>
                        </select>
                    </div>
                </div>

                {/* Table Data for Desktop (md:), Cards for Mobile (< md) */}
                <div className="overflow-x-auto w-full">
                    <table className="block md:table w-full text-left border-collapse md:min-w-[880px]">
                        <thead className="hidden md:table-header-group">
                            <tr className="border-b border-[#e5eeff] text-[11px] font-bold text-[#5a6a80] uppercase tracking-wider bg-[#fafcff]">
                                <th scope="col" className="py-3 px-4 sm:px-5">Người dùng</th>
                                <th scope="col" className="py-3 px-4">Email · Trường</th>
                                <th scope="col" className="py-3 px-4">Vai trò / TT</th>
                                <th scope="col" className="py-3 px-4">Chỉ số học thuật</th>
                                <th scope="col" className="py-3 px-4">Tham gia</th>
                                <th scope="col" className="py-3 px-4 sm:px-5 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="block md:table-row-group p-3 sm:p-4 md:p-0 bg-[#f8faff] md:bg-white space-y-3 md:space-y-0 divide-y-0 md:divide-y md:divide-[#eef3ff] text-xs">
                            {filteredUsers.length === 0 ? (
                                <tr className="block md:table-row">
                                    <td colSpan={6} className="block md:table-cell py-12 text-center text-[#5a6a80]">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <UserX size={32} className="text-[#a2b4cf]" />
                                            <p className="font-medium">Không tìm thấy người dùng nào phù hợp.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => {
                                    const isRootAdmin = user.role === 'ADMIN' && user.id === 'u1';
                                    const isBanned = user.status === 'BANNED';

                                    return (
                                        <tr
                                            key={user.id}
                                            className="block md:table-row bg-white rounded-xl md:rounded-none border border-[#dce9ff] md:border-b md:border-x-0 md:border-t-0 md:border-[#eef3ff] p-4 md:py-3.5 md:px-0 shadow-2xs md:shadow-none space-y-3 md:space-y-0 hover:bg-[#fafcff] transition-colors"
                                        >
                                            {/* Cột 1: Người dùng (Avatar, Tên, @username) */}
                                            <td className="block md:table-cell p-0 md:py-3.5 md:px-4 sm:px-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-[#dbe7fb] text-[#0051d5] flex items-center justify-center font-bold text-xs shrink-0">
                                                        {getInitials(user.fullName)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-bold text-[#0b1c30] text-sm md:text-xs">
                                                            {user.fullName}
                                                        </div>
                                                        <div className="text-[11px] font-mono text-[#0051d5]">
                                                            @{user.username}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Cột 2: Email · Trường */}
                                            <td className="block md:table-cell p-0 md:py-3.5 md:px-4">
                                                <div className="text-xs">
                                                    <div className="font-semibold text-[#0b1c30] break-all">
                                                        {user.email}
                                                    </div>
                                                    <div className="text-[11px] text-[#5a6a80] mt-0.5">
                                                        {user.school} · {user.faculty}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Cột 3: Vai trò / Trạng thái */}
                                            <td className="block md:table-cell p-0 md:py-3.5 md:px-4 whitespace-nowrap">
                                                <div className="flex items-center md:flex-col md:items-start gap-1.5">
                                                    {/* Role Badge */}
                                                    {user.role === 'ADMIN' && (
                                                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded bg-[#fee2e2] text-[#ba1a1a] border border-[#fecaca] uppercase">
                                                            ADMIN
                                                        </span>
                                                    )}
                                                    {user.role === 'USER' && (
                                                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded bg-[#eff4ff] text-[#0051d5] border border-[#dce9ff] uppercase">
                                                            USER
                                                        </span>
                                                    )}
                                                    {user.role === 'VIP' && (
                                                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded bg-[#fef3c7] text-[#b45309] border border-[#fde68a] uppercase">
                                                            VIP
                                                        </span>
                                                    )}

                                                    {/* Status Badge */}
                                                    {user.status === 'ACTIVE' && (
                                                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded bg-[#ecfdf5] text-[#009668] border border-[#a7f3d0] uppercase">
                                                            ACTIVE
                                                        </span>
                                                    )}
                                                    {user.status === 'BANNED' && (
                                                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded bg-[#fee2e2] text-[#ba1a1a] border border-[#fecaca] uppercase">
                                                            BANNED
                                                        </span>
                                                    )}
                                                    {user.status === 'UNVERIFIED' && (
                                                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded bg-[#f1f5f9] text-[#64748b] border border-[#e2e8f0] uppercase">
                                                            UNVERIFIED
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Cột 4: Chỉ số học thuật */}
                                            <td className="block md:table-cell p-0 md:py-3.5 md:px-4 whitespace-nowrap">
                                                <div className="text-xs">
                                                    <div className="font-semibold text-[#0b1c30]">
                                                        {user.documentsCount} tài liệu
                                                    </div>
                                                    <div className="text-[11px] text-[#5a6a80] mt-0.5">
                                                        Uy tín <strong className="text-[#0b1c30]">{user.reputation}</strong> · Số dư <strong className="text-[#0b1c30]">{user.tokenBalance}</strong>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Cột 5: Tham gia */}
                                            <td className="block md:table-cell p-0 md:py-3.5 md:px-4 whitespace-nowrap text-xs text-[#5a6a80]">
                                                <span className="md:hidden font-medium text-[11px] text-[#5a6a80] mr-1">
                                                    Tham gia:
                                                </span>
                                                {user.joinedDate}
                                            </td>

                                            {/* Cột 6: Thao tác */}
                                            <td className="block md:table-cell p-0 md:py-3.5 md:px-4 sm:px-5 md:text-right whitespace-nowrap pt-3 md:pt-0 border-t border-[#f0f4fc] md:border-t-0">
                                                <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                                                    {/* Nút Phân quyền (Key icon) */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setRoleModalUser(user)}
                                                        className="p-1.5 text-[#5a6a80] hover:text-[#0051d5] bg-[#fafcff] hover:bg-[#eff4ff] border border-[#dce9ff] rounded-[7px] transition-colors cursor-pointer"
                                                        aria-label={`Phân quyền cho ${user.fullName}`}
                                                        title="Phân quyền tài khoản"
                                                    >
                                                        <KeyRound size={15} />
                                                    </button>

                                                    {/* Nút Điều chỉnh điểm & token (Sliders icon) */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setAdjustModalUser(user)}
                                                        className="p-1.5 text-[#5a6a80] hover:text-[#0051d5] bg-[#fafcff] hover:bg-[#eff4ff] border border-[#dce9ff] rounded-[7px] transition-colors cursor-pointer"
                                                        aria-label={`Điều chỉnh điểm cho ${user.fullName}`}
                                                        title="Điều chỉnh điểm uy tín & số dư"
                                                    >
                                                        <SlidersHorizontal size={15} />
                                                    </button>

                                                    {/* Nút Khóa / Mở khóa (chỉ hiển thị nếu không phải root admin) */}
                                                    {!isRootAdmin && (
                                                        isBanned ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenUnlock(user)}
                                                                className="px-2.5 py-1 text-xs font-semibold text-white bg-[#009668] hover:bg-[#007d56] rounded-[7px] flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                                                                aria-label={`Mở khóa cho ${user.fullName}`}
                                                            >
                                                                <Unlock size={13} />
                                                                <span>Mở khóa</span>
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenLock(user)}
                                                                className="px-2.5 py-1 text-xs font-semibold text-white bg-[#ba1a1a] hover:bg-[#93000a] rounded-[7px] flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                                                                aria-label={`Khóa tài khoản ${user.fullName}`}
                                                            >
                                                                <Lock size={13} />
                                                                <span>Khóa</span>
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            <UserLockModal
                isOpen={!!lockModalUser}
                user={lockModalUser}
                action={lockAction}
                onClose={() => setLockModalUser(null)}
                onConfirm={handleConfirmLock}
            />

            <UserRoleModal
                isOpen={!!roleModalUser}
                user={roleModalUser}
                onClose={() => setRoleModalUser(null)}
                onConfirm={handleConfirmRole}
            />

            <UserAdjustModal
                isOpen={!!adjustModalUser}
                user={adjustModalUser}
                onClose={() => setAdjustModalUser(null)}
                onConfirm={handleConfirmAdjust}
            />
        </AdminLayout>
    );
}

