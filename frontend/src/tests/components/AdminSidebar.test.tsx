import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminSidebar } from '../../components/admin/layout/AdminSidebar/AdminSidebar';

describe('AdminSidebar Component', () => {
    it('renders logo branding, title, and node version', () => {
        render(
            <MemoryRouter>
                <AdminSidebar />
            </MemoryRouter>
        );

        expect(screen.getByText('DeDocu Hub')).toBeInTheDocument();
        expect(screen.getByText('Admin Governance Node v2.4')).toBeInTheDocument();
    });

    it('renders all admin navigation links with correct labels', () => {
        render(
            <MemoryRouter>
                <AdminSidebar />
            </MemoryRouter>
        );

        const nav = screen.getByRole('navigation', { name: /điều hướng quản trị/i });
        expect(within(nav).getByRole('link', { name: /tổng quan admin/i })).toBeInTheDocument();
        expect(within(nav).getByRole('link', { name: /quản lý & kiểm duyệt tài liệu/i })).toBeInTheDocument();
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

    it('renders bottom IPFS node status information correctly', () => {
        render(
            <MemoryRouter>
                <AdminSidebar
                    activeNodeId="QmCustomNodeId...1234"
                    activeNodeLocation="ĐH Bách Khoa HN"
                    nodeSla="99.99%"
                    isNodeConnected={true}
                />
            </MemoryRouter>
        );

        expect(screen.getByText(/Node 8492: Connected/i)).toBeInTheDocument();
        expect(screen.getByText('QmCustomNodeId...1234')).toBeInTheDocument();
        expect(screen.getByText(/ĐH Bách Khoa HN · SLA 99.99%/i)).toBeInTheDocument();
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
