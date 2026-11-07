import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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

        expect(screen.getByText('Tổng bài đăng học thuật')).toBeInTheDocument();
        expect(screen.getByText('142,580')).toBeInTheDocument();

        expect(screen.getByText('Thành viên hoạt động')).toBeInTheDocument();
        expect(screen.getByText('28,450')).toBeInTheDocument();

        expect(screen.getByText('Lượt tương tác')).toBeInTheDocument();
        expect(screen.getByText('1.82M')).toBeInTheDocument();

        expect(screen.getByText('Cụm Node IPFS')).toBeInTheDocument();
        expect(screen.getByText('42 / 42')).toBeInTheDocument();

        // Appears in sidebar link and KPI card
        expect(screen.getAllByText('Báo cáo vi phạm').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('02')).toBeInTheDocument();
    });

    it('renders recent posts feed by default and allows switching to pending reports tab', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminDashboardPage />
            </MemoryRouter>
        );

        // Default tab: Recent posts
        const postTitle = 'Giáo trình Cấu trúc dữ liệu và Giải thuật (Bản chỉnh sửa 2026)';
        expect(screen.getByText(postTitle)).toBeInTheDocument();
        expect(screen.getByText('Đề cương & Bài tập Giải tích 1 có lời giải chi tiết')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /tất cả bài đăng/i })).toBeInTheDocument();

        // Switch to pending reports tab
        const reportsTabBtn = screen.getByRole('button', { name: /báo cáo cần xử lý/i });
        await user.click(reportsTabBtn);

        expect(screen.getByText('Giáo trình Kinh tế vi mô (bản scan nguyên cuốn)')).toBeInTheDocument();
        expect(screen.getByText('Bản scan sách Giải tích Thomas (NXB có ISBN)')).toBeInTheDocument();
        expect(screen.getByText(/vi phạm bản quyền sách xuất bản/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /tất cả báo cáo/i })).toBeInTheDocument();
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
