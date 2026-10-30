import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminUsersPage } from '../../pages/admin/AdminUsersPage/AdminUsersPage';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
    },
}));

describe('AdminUsersPage Component Unit Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders breadcrumb, title, subtitle, search bar, and filter dropdowns', () => {
        render(
            <MemoryRouter>
                <AdminUsersPage />
            </MemoryRouter>
        );

        expect(screen.getByText('Admin / Người dùng')).toBeInTheDocument();
        expect(
            screen.getByRole('heading', { level: 1, name: 'Quản lý người dùng & phân quyền' })
        ).toBeInTheDocument();
        expect(
            screen.getByText('Danh sách sinh viên, phân quyền, khóa tài khoản và điều chỉnh điểm')
        ).toBeInTheDocument();

        // Filters
        expect(
            screen.getByRole('textbox', { name: /tìm kiếm người dùng/i })
        ).toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: /lọc theo trường/i })).toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: /lọc theo vai trò/i })).toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: /lọc theo trạng thái/i })).toBeInTheDocument();
    });

    it('renders initial list of 6 users with full details', () => {
        render(
            <MemoryRouter>
                <AdminUsersPage />
            </MemoryRouter>
        );

        const table = screen.getByRole('table');

        // Names
        expect(within(table).getByText('Âu Dương Tấn')).toBeInTheDocument();
        expect(within(table).getByText('Nguyễn Văn Học Sinh')).toBeInTheDocument();
        expect(within(table).getByText('Phạm Gia Huy')).toBeInTheDocument();
        expect(within(table).getByText('Lê Minh Quân')).toBeInTheDocument();
        expect(within(table).getByText('Hoàng Đức Minh')).toBeInTheDocument();
        expect(within(table).getByText('Trần Thị Bích')).toBeInTheDocument();

        // Usernames
        expect(within(table).getByText('@auduongtan')).toBeInTheDocument();
        expect(within(table).getByText('@hocsinh99')).toBeInTheDocument();
        expect(within(table).getByText('@giahuy_ptit')).toBeInTheDocument();
        expect(within(table).getByText('@quanle')).toBeInTheDocument();
        expect(within(table).getByText('@minhhd')).toBeInTheDocument();
        expect(within(table).getByText('@bichtran')).toBeInTheDocument();

        // Emails
        expect(within(table).getByText('tan.auduong@dedocu.vn')).toBeInTheDocument();
        expect(within(table).getByText('student99@dedocu.vn')).toBeInTheDocument();
        expect(within(table).getByText('minh.hd@dedocu.vn')).toBeInTheDocument();

        // Schools & Faculties
        expect(within(table).getByText('HUST · CNTT')).toBeInTheDocument();
        expect(within(table).getByText('PTIT · An toàn thông tin')).toBeInTheDocument();

        // Avatars
        expect(within(table).getByText('DT')).toBeInTheDocument();
        expect(within(table).getByText('HS')).toBeInTheDocument();
        expect(within(table).getByText('GH')).toBeInTheDocument();
        expect(within(table).getByText('MQ')).toBeInTheDocument();
    });

    it('filters users using search query input', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <AdminUsersPage />
            </MemoryRouter>
        );

        const searchInput = screen.getByRole('textbox', { name: /tìm kiếm người dùng/i });
        await user.type(searchInput, 'Phạm Gia Huy');

        const table = screen.getByRole('table');
        expect(within(table).getByText('Phạm Gia Huy')).toBeInTheDocument();
        expect(within(table).getByText('@giahuy_ptit')).toBeInTheDocument();
        expect(within(table).queryByText('Âu Dương Tấn')).not.toBeInTheDocument();
        expect(within(table).queryByText('Nguyễn Văn Học Sinh')).not.toBeInTheDocument();
    });

    it('filters users by school select dropdown', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <AdminUsersPage />
            </MemoryRouter>
        );

        const schoolSelect = screen.getByRole('combobox', { name: /lọc theo trường/i });
        await user.selectOptions(schoolSelect, 'NEU');

        const table = screen.getByRole('table');
        expect(within(table).getByText('Nguyễn Văn Học Sinh')).toBeInTheDocument();
        expect(within(table).getByText('Lê Minh Quân')).toBeInTheDocument();
        expect(within(table).queryByText('Âu Dương Tấn')).not.toBeInTheDocument();
        expect(within(table).queryByText('Phạm Gia Huy')).not.toBeInTheDocument();
    });

    it('filters users by role select dropdown', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <AdminUsersPage />
            </MemoryRouter>
        );

        const roleSelect = screen.getByRole('combobox', { name: /lọc theo vai trò/i });
        await user.selectOptions(roleSelect, 'VIP');

        const table = screen.getByRole('table');
        expect(within(table).getByText('Phạm Gia Huy')).toBeInTheDocument();
        expect(within(table).queryByText('Âu Dương Tấn')).not.toBeInTheDocument();
        expect(within(table).queryByText('Lê Minh Quân')).not.toBeInTheDocument();
    });

    it('filters users by status select dropdown', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <AdminUsersPage />
            </MemoryRouter>
        );

        const statusSelect = screen.getByRole('combobox', { name: /lọc theo trạng thái/i });
        await user.selectOptions(statusSelect, 'BANNED');

        const table = screen.getByRole('table');
        expect(within(table).getByText('Hoàng Đức Minh')).toBeInTheDocument();
        expect(within(table).queryByText('Âu Dương Tấn')).not.toBeInTheDocument();
        expect(within(table).queryByText('Nguyễn Văn Học Sinh')).not.toBeInTheDocument();
    });

    it('shows empty state when no users match filters', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <AdminUsersPage />
            </MemoryRouter>
        );

        const searchInput = screen.getByRole('textbox', { name: /tìm kiếm người dùng/i });
        await user.type(searchInput, 'nonexistent_user_999');

        expect(screen.getByText('Không tìm thấy người dùng nào phù hợp.')).toBeInTheDocument();
    });

    it('locks an active user and updates their status to BANNED', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <AdminUsersPage />
            </MemoryRouter>
        );

        // Click "Khóa" button for 'Nguyễn Văn Học Sinh'
        const lockBtn = screen.getByRole('button', {
            name: /khóa tài khoản nguyễn văn học sinh/i,
        });
        await user.click(lockBtn);

        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(within(dialog).getByText('Khóa tài khoản người dùng?')).toBeInTheDocument();

        // Confirm lock
        const confirmBtn = within(dialog).getByRole('button', { name: /xác nhận khóa/i });
        await user.click(confirmBtn);

        expect(toast.success).toHaveBeenCalledWith(
            expect.stringContaining('Đã khóa tài khoản: Nguyễn Văn Học Sinh')
        );
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

        // Button should now be "Mở khóa"
        expect(
            screen.getByRole('button', { name: /mở khóa cho nguyễn văn học sinh/i })
        ).toBeInTheDocument();
    });

    it('unlocks a banned user and restores status to ACTIVE', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <AdminUsersPage />
            </MemoryRouter>
        );

        // Click "Mở khóa" button for 'Hoàng Đức Minh'
        const unlockBtn = screen.getByRole('button', {
            name: /mở khóa cho hoàng đức minh/i,
        });
        await user.click(unlockBtn);

        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(within(dialog).getByText('Mở khóa tài khoản?')).toBeInTheDocument();

        // Confirm unlock
        const confirmBtn = within(dialog).getByRole('button', { name: /xác nhận mở khóa/i });
        await user.click(confirmBtn);

        expect(toast.success).toHaveBeenCalledWith(
            expect.stringContaining('Đã mở khóa tài khoản: Hoàng Đức Minh')
        );
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

        // Button should now be "Khóa"
        expect(
            screen.getByRole('button', { name: /khóa tài khoản hoàng đức minh/i })
        ).toBeInTheDocument();
    });

    it('opens role modal and changes user role', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <AdminUsersPage />
            </MemoryRouter>
        );

        // Click "Phân quyền" button for 'Lê Minh Quân'
        const roleBtn = screen.getByRole('button', {
            name: /phân quyền cho lê minh quân/i,
        });
        await user.click(roleBtn);

        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(within(dialog).getByText('Phân quyền người dùng')).toBeInTheDocument();

        // Select VIP role
        const vipOption = within(dialog).getByText(/VIP \(Thành viên uy tín\)/i);
        await user.click(vipOption);

        // Save
        const saveBtn = within(dialog).getByRole('button', { name: /lưu thay đổi/i });
        await user.click(saveBtn);

        expect(toast.success).toHaveBeenCalledWith(
            expect.stringContaining('Đã cập nhật vai trò VIP cho người dùng Lê Minh Quân')
        );
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('opens adjust modal and updates reputation & token balance', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <AdminUsersPage />
            </MemoryRouter>
        );

        // Click "Điều chỉnh điểm" button for 'Phạm Gia Huy'
        const adjustBtn = screen.getByRole('button', {
            name: /điều chỉnh điểm cho phạm gia huy/i,
        });
        await user.click(adjustBtn);

        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(within(dialog).getByText('Điều chỉnh điểm & Số dư token')).toBeInTheDocument();

        // Change reputation input
        const repInput = within(dialog).getByLabelText(/điểm uy tín/i);
        await user.clear(repInput);
        await user.type(repInput, '800');

        // Confirm
        const confirmBtn = within(dialog).getByRole('button', { name: /xác nhận cập nhật/i });
        await user.click(confirmBtn);

        expect(toast.success).toHaveBeenCalledWith(
            expect.stringContaining('Đã cập nhật điểm uy tín (800)')
        );
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

        const table = screen.getByRole('table');
        expect(within(table).getByText('800')).toBeInTheDocument();
    });

    it('does not display a lock button for root admin user', () => {
        render(
            <MemoryRouter>
                <AdminUsersPage />
            </MemoryRouter>
        );

        expect(
            screen.queryByRole('button', { name: /khóa tài khoản âu dương tấn/i })
        ).not.toBeInTheDocument();
    });
});
