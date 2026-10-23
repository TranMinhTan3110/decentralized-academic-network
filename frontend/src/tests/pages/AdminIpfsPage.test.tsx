import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminIpfsPage } from '../../pages/admin/AdminIpfsPage/AdminIpfsPage';

describe('AdminIpfsPage Component', () => {
    it('renders page header, breadcrumb, subtitle, and healthy status badge', () => {
        render(
            <MemoryRouter>
                <AdminIpfsPage />
            </MemoryRouter>
        );

        expect(screen.getByText('Admin / Giám sát Node IPFS')).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 1, name: 'Giám sát Node IPFS' })).toBeInTheDocument();
        expect(screen.getByText('Theo dõi 42 node phân tán, băng thông và SLA')).toBeInTheDocument();
        expect(screen.getByText('Tất cả node hoạt động')).toBeInTheDocument();
    });

    it('renders all 4 IPFS KPI cards with metrics and descriptions', () => {
        render(
            <MemoryRouter>
                <AdminIpfsPage />
            </MemoryRouter>
        );

        expect(screen.getByText('Node trực tuyến')).toBeInTheDocument();
        expect(screen.getByText('42 / 42')).toBeInTheDocument();
        expect(screen.getByText('100% SLA')).toBeInTheDocument();

        expect(screen.getByText('Băng thông đỉnh')).toBeInTheDocument();
        expect(screen.getByText('1.42 Gbps')).toBeInTheDocument();
        expect(screen.getByText('trong 7 ngày qua')).toBeInTheDocument();

        expect(screen.getByText('Cache hit rate')).toBeInTheDocument();
        expect(screen.getByText('99.8%')).toBeInTheDocument();
        expect(screen.getByText('truy vấn trúng cache')).toBeInTheDocument();

        expect(screen.getByText('Tài liệu đã pin')).toBeInTheDocument();
        expect(screen.getByText('142,580')).toBeInTheDocument();
        expect(screen.getByText('CID đang được nhân bản')).toBeInTheDocument();
    });

    it('renders 42 node cluster map and opens detail modal when clicking a node cell', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminIpfsPage />
            </MemoryRouter>
        );

        expect(screen.getByText('Bản đồ cụm node')).toBeInTheDocument();
        expect(screen.getByText(/Ô đậm: node của quản trị viên hiện tại/i)).toBeInTheDocument();

        // Node cell 8 is the admin hot node
        const node8 = screen.getByRole('button', { name: 'Chi tiết Node số 8' });
        expect(node8).toBeInTheDocument();

        // Click node 8 to open modal
        await user.click(node8);

        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(within(dialog).getByText('Node ĐH Bách Khoa HN')).toBeInTheDocument();
        expect(within(dialog).getByText(/Node #8/i)).toBeInTheDocument();

        // Close modal
        const closeBtn = screen.getByRole('button', { name: /đóng modal/i });
        await user.click(closeBtn);

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders top performing nodes table and filters rows by search query', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminIpfsPage />
            </MemoryRouter>
        );

        expect(screen.getByText('Node hoạt động hàng đầu')).toBeInTheDocument();
        expect(screen.getByText('Node ĐH Kinh tế Quốc dân')).toBeInTheDocument();
        expect(screen.getByText('Node Học viện BCVT')).toBeInTheDocument();

        // Search filter
        const searchInput = screen.getByPlaceholderText(/Tìm theo tên trường, CID/i);
        await user.type(searchInput, 'Ngoại thương');

        expect(screen.getByText('Node ĐH Ngoại thương')).toBeInTheDocument();
        expect(screen.queryByText('Node Học viện BCVT')).not.toBeInTheDocument();
    });

    it('opens node detail modal from table row action button and handles ping action', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminIpfsPage />
            </MemoryRouter>
        );

        const detailButtons = screen.getAllByRole('button', { name: /chi tiết/i });
        expect(detailButtons.length).toBeGreaterThan(0);

        await user.click(detailButtons[0]);

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/Địa chỉ Swarm Multiaddr/i)).toBeInTheDocument();

        // Test Ping button
        const pingBtn = screen.getByRole('button', { name: /ping kiểm tra độ trễ/i });
        await user.click(pingBtn);

        expect(screen.getByRole('button', { name: /đang ping/i })).toBeInTheDocument();
    });

    it('handles refresh button click and shows feedback', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminIpfsPage />
            </MemoryRouter>
        );

        const refreshBtn = screen.getByRole('button', { name: /làm mới trạng thái/i });
        await user.click(refreshBtn);

        expect(screen.getByRole('button', { name: /đang làm mới/i })).toBeInTheDocument();
    });
});
