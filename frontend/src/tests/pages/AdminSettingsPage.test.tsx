import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminSettingsPage } from '../../pages/admin/AdminSettingsPage/AdminSettingsPage';

describe('AdminSettingsPage Component', () => {
    it('renders page header, breadcrumb, subtitle, and admin profile card', () => {
        render(
            <MemoryRouter>
                <AdminSettingsPage />
            </MemoryRouter>
        );

        expect(screen.getByText('Admin / Cài đặt')).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 1, name: 'Cài đặt & Hồ sơ quản trị viên' })).toBeInTheDocument();
        expect(screen.getByText('Hồ sơ cá nhân, bảo mật và tham số quản trị mạng lưới')).toBeInTheDocument();

        // Profile details
        expect(screen.getByText('AT')).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2, name: 'Âu Dương Tấn' })).toBeInTheDocument();
        expect(screen.getByText('tan.auduong@dedocu.vn')).toBeInTheDocument();
        expect(screen.getByText(/Council Auditor \/ Node Trưởng Đại học/i)).toBeInTheDocument();

        // Key-values
        expect(screen.getByText('Ví Web3')).toBeInTheDocument();
        expect(screen.getByText('0x71C82...4b9')).toBeInTheDocument();
        expect(screen.getByText('Node ID IPFS')).toBeInTheDocument();
        expect(screen.getAllByText('QmZtmD2...82Fq').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText(/ĐH Bách Khoa HN · SLA 99.98%/i).length).toBeGreaterThanOrEqual(1);
    });

    it('handles password change submission with validation', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminSettingsPage />
            </MemoryRouter>
        );

        const currentPwdInput = screen.getByPlaceholderText('••••••••');
        const newPwdInput = screen.getByPlaceholderText('Tối thiểu 12 ký tự');
        const confirmPwdInput = screen.getByPlaceholderText('Nhập lại mật khẩu mới');
        const submitBtn = screen.getByRole('button', { name: /cập nhật mật khẩu/i });

        // Fill inputs correctly
        await user.type(currentPwdInput, 'oldPassword123');
        await user.type(newPwdInput, 'newSecurePassword456');
        await user.type(confirmPwdInput, 'newSecurePassword456');
        await user.click(submitBtn);

        expect(screen.getByRole('button', { name: /đã cập nhật ✓/i })).toBeInTheDocument();
    });

    it('toggles two-factor authentication (2FA) switch', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminSettingsPage />
            </MemoryRouter>
        );

        const tfaSwitch = screen.getByRole('switch', { name: /bật tắt xác thực 2 lớp/i });
        expect(tfaSwitch).toHaveAttribute('aria-checked', 'true');

        await user.click(tfaSwitch);
        expect(tfaSwitch).toHaveAttribute('aria-checked', 'false');

        await user.click(tfaSwitch);
        expect(tfaSwitch).toHaveAttribute('aria-checked', 'true');
    });

    it('renders recent active sessions with device and IP info', () => {
        render(
            <MemoryRouter>
                <AdminSettingsPage />
            </MemoryRouter>
        );

        expect(screen.getByText('Phiên đăng nhập gần nhất')).toBeInTheDocument();
        expect(screen.getByText('MacBook Pro · Chrome 138')).toBeInTheDocument();
        expect(screen.getByText('113.190.24.77')).toBeInTheDocument();
        expect(screen.getByText('Hiện tại')).toBeInTheDocument();

        expect(screen.getByText('iPhone 16 · Safari')).toBeInTheDocument();
        expect(screen.getByText('113.190.24.81')).toBeInTheDocument();

        expect(screen.getByText('Windows 11 · Edge')).toBeInTheDocument();
        expect(screen.getByText('27.72.100.15')).toBeInTheDocument();
    });

    it('updates governance parameters and switches moderation modes', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminSettingsPage />
            </MemoryRouter>
        );

        expect(screen.getByText(/Tham số mạng lưới \(Governance Parameters\)/i)).toBeInTheDocument();

        const uploadInput = screen.getByLabelText(/điểm thưởng upload/i);
        const unlockInput = screen.getByLabelText(/điểm mở khóa tài liệu/i);
        const sizeInput = screen.getByLabelText(/giới hạn dung lượng pdf/i);

        expect(uploadInput).toHaveValue(20);
        expect(unlockInput).toHaveValue(10);
        expect(sizeInput).toHaveValue(50);

        // Modify input values
        await user.clear(uploadInput);
        await user.type(uploadInput, '25');
        expect(uploadInput).toHaveValue(25);

        // Switch to Pre-moderation
        const preBtn = screen.getByRole('button', { name: /tiền kiểm \(pre-moderation\)/i });
        await user.click(preBtn);

        // Submit form
        const saveBtn = screen.getByRole('button', { name: /lưu cấu hình/i });
        await user.click(saveBtn);

        expect(screen.getByRole('button', { name: /đã lưu cấu hình ✓/i })).toBeInTheDocument();
    });
});
