import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Swal from 'sweetalert2';
import { AdminSidebar } from '../../components/admin/layout/AdminSidebar/AdminSidebar';

describe('AdminSidebar Component', () => {
    it('renders logo branding, title, and "Giao diện Quản trị"', () => {
        render(
            <MemoryRouter>
                <AdminSidebar />
            </MemoryRouter>
        );

        expect(screen.getByText('DeDocu Hub')).toBeInTheDocument();
        expect(screen.getByText('Giao diện Quản trị')).toBeInTheDocument();
    });

    it('renders all admin navigation links with correct labels', () => {
        render(
            <MemoryRouter>
                <AdminSidebar />
            </MemoryRouter>
        );

        const nav = screen.getByRole('navigation', { name: /điều hướng quản trị/i });
        expect(within(nav).getByRole('link', { name: /tổng quan admin/i })).toBeInTheDocument();
        expect(within(nav).getByRole('link', { name: /quản lý bài đăng/i })).toBeInTheDocument();
        expect(within(nav).getByRole('link', { name: /báo cáo vi phạm/i })).toBeInTheDocument();
        expect(within(nav).getByRole('link', { name: /quản lý người dùng/i })).toBeInTheDocument();
        expect(within(nav).getByRole('link', { name: /danh mục học thuật/i })).toBeInTheDocument();
        expect(within(nav).getByRole('link', { name: /giám sát node ipfs/i })).toBeInTheDocument();
        expect(within(nav).getByRole('link', { name: /cài đặt & hồ sơ admin/i })).toBeInTheDocument();
    });

    it('renders custom badge counts when provided', () => {
        render(
            <MemoryRouter>
                <AdminSidebar pendingReviewsCount={12} openReportsCount={7} />
            </MemoryRouter>
        );

        expect(screen.getByText('12')).toBeInTheDocument();
        expect(screen.getByText('7')).toBeInTheDocument();
    });

    it('does not render bottom IPFS node status information box', () => {
        render(
            <MemoryRouter>
                <AdminSidebar />
            </MemoryRouter>
        );

        expect(screen.queryByText(/Node 8492/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/SLA 99/i)).not.toBeInTheDocument();
    });

    it('prompts SweetAlert2 confirmation dialog and calls onLogout when confirmed', async () => {
        const handleLogout = vi.fn();
        const swalSpy = vi.spyOn(Swal, 'fire').mockResolvedValue({ isConfirmed: true } as any);
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminSidebar onLogout={handleLogout} />
            </MemoryRouter>
        );

        const logoutBtn = screen.getByRole('button', { name: /đăng xuất/i });
        expect(logoutBtn).toBeInTheDocument();

        await user.click(logoutBtn);

        expect(swalSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Đăng xuất?',
                icon: 'question',
                showCancelButton: true,
            })
        );
        expect(handleLogout).toHaveBeenCalledTimes(1);
    });

    it('calls onCloseMenu when clicking mobile close button', async () => {
        const handleClose = vi.fn();
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminSidebar menuOpen={true} onCloseMenu={handleClose} />
            </MemoryRouter>
        );

        const closeButton = screen.getByRole('button', { name: /đóng menu/i });
        await user.click(closeButton);

        expect(handleClose).toHaveBeenCalledTimes(1);
    });
});
