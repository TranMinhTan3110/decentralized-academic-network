import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminDashboardPage } from '../../pages/admin/AdminDashboardPage/AdminDashboardPage';

describe('AdminDashboardPage Component', () => {
    it('renders all 5 KPI cards with correct metrics and labels', () => {
        render(
            <MemoryRouter>
                <AdminDashboardPage />
            </MemoryRouter>
        );

        expect(screen.getByText('Tổng tài liệu IPFS')).toBeInTheDocument();
        expect(screen.getByText('142,580')).toBeInTheDocument();

        expect(screen.getByText('Lượt tải xác thực')).toBeInTheDocument();
        expect(screen.getByText('1.82M')).toBeInTheDocument();

        expect(screen.getByText('Cụm Node IPFS')).toBeInTheDocument();
        expect(screen.getByText('42 / 42')).toBeInTheDocument();

        // Appears in sidebar link and KPI card
        expect(screen.getAllByText('Hàng đợi kiểm duyệt').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Báo cáo vi phạm').length).toBeGreaterThanOrEqual(1);
    });

    it('renders moderation queue items and allows approving an item', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminDashboardPage />
            </MemoryRouter>
        );

        const docTitle = 'Giáo trình Cấu trúc dữ liệu và Giải thuật (Bản chỉnh sửa 2026)';
        expect(screen.getByText(docTitle)).toBeInTheDocument();

        const approveButtons = screen.getAllByRole('button', { name: /duyệt/i });
        expect(approveButtons.length).toBeGreaterThan(0);

        await user.click(approveButtons[0]);

        // First item should be approved and removed from the active queue
        expect(screen.queryByText(docTitle)).not.toBeInTheDocument();
    });

    it('renders bandwidth chart and IPFS Swarm health widget', () => {
        render(
            <MemoryRouter>
                <AdminDashboardPage />
            </MemoryRouter>
        );

        expect(screen.getByText(/Băng thông tải theo tuần \(GB\)/i)).toBeInTheDocument();
        expect(screen.getByText('3,393 GB')).toBeInTheDocument();
        expect(screen.getByText('IPFS Swarm Health')).toBeInTheDocument();
        expect(screen.getByText('Online')).toBeInTheDocument();
    });

    it('handles refresh button click and shows feedback', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminDashboardPage />
            </MemoryRouter>
        );

        const refreshBtn = screen.getByRole('button', { name: /làm mới dữ liệu/i });
        await user.click(refreshBtn);

        expect(screen.getByRole('button', { name: /đang làm mới/i })).toBeInTheDocument();
    });
});
