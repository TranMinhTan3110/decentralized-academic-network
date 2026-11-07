import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminSettingsPage } from '../../pages/admin/AdminSettingsPage/AdminSettingsPage';

describe('AdminSettingsPage Component', () => {
    it('renders page header, breadcrumb, subtitle, and profile section', () => {
        render(
            <MemoryRouter>
                <AdminSettingsPage />
            </MemoryRouter>
        );

        expect(screen.getByText('Admin / Cài đặt')).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 1, name: 'Cài đặt & Hồ sơ quản trị viên' })).toBeInTheDocument();
        expect(screen.getByText('Hồ sơ cá nhân, bảo mật tài khoản và chính sách hệ thống')).toBeInTheDocument();

        // Tabs
        expect(screen.getByRole('button', { name: /hồ sơ cá nhân/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /mật khẩu & bảo mật/i })).toBeInTheDocument();
    });

    it('switches between Profile and Security tabs smoothly', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminSettingsPage />
            </MemoryRouter>
        );

        // Initially in Profile tab - should show profile fields but exclude academic fields
        expect(screen.getByText(/tên hiển thị/i)).toBeInTheDocument();
        expect(screen.queryByLabelText(/trường đại học \/ tổ chức/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/chuyên ngành/i)).not.toBeInTheDocument();

        // Switch to Security tab
        const securityTabBtn = screen.getByRole('button', { name: /mật khẩu & bảo mật/i });
        await user.click(securityTabBtn);

        // Should now show security fields from SecurityTab but exclude delete account
        expect(screen.getByText(/mật khẩu hiện tại/i)).toBeInTheDocument();
        expect(screen.getByText(/^mật khẩu mới/i)).toBeInTheDocument();
        expect(screen.getByText(/xác nhận mật khẩu mới/i)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /xóa tài khoản này/i })).not.toBeInTheDocument();
        expect(screen.queryByText(/khu vực nguy hiểm: xóa tài khoản/i)).not.toBeInTheDocument();
    });

    it('updates system configuration parameters and confirms absence of moderation mode and pdf size limit', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminSettingsPage />
            </MemoryRouter>
        );

        expect(screen.getByText(/Cấu hình hệ thống & Chính sách học liệu/i)).toBeInTheDocument();

        const uploadInput = screen.getByLabelText(/điểm thưởng upload/i);
        const unlockInput = screen.getByLabelText(/điểm mở khóa tài liệu/i);

        expect(uploadInput).toHaveValue(20);
        expect(unlockInput).toHaveValue(10);

        // Ensure moderation mode and PDF size limit options are removed
        expect(screen.queryByLabelText(/giới hạn dung lượng pdf/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Chế độ kiểm duyệt/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Hậu kiểm \(Post-moderation\)/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Tiền kiểm \(Pre-moderation\)/i)).not.toBeInTheDocument();

        // Modify input values
        await user.clear(uploadInput);
        await user.type(uploadInput, '30');
        expect(uploadInput).toHaveValue(30);

        // Submit form
        const saveBtn = screen.getByRole('button', { name: /lưu cấu hình/i });
        await user.click(saveBtn);

        expect(screen.getByRole('button', { name: /đã lưu cấu hình/i })).toBeInTheDocument();
    });
});
