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
        expect(screen.getByText(/Theo dõi kết nối Swarm, độ trễ P2P/i)).toBeInTheDocument();
        expect(screen.getByText('Hệ thống kết nối ổn định')).toBeInTheDocument();
        expect(
            screen.getByText(/Kiến trúc Lưu trữ Bán phi tập trung & Hệ thống Giám sát Node IPFS/i)
        ).toBeInTheDocument();
    });

    it('renders all 4 IPFS KPI cards with metrics and descriptions', () => {
        render(
            <MemoryRouter>
                <AdminIpfsPage />
            </MemoryRouter>
        );

        expect(screen.getByText('Node trực tuyến')).toBeInTheDocument();
        expect(screen.getByText('5 / 5 Node')).toBeInTheDocument();
        expect(screen.getByText('99.9% SLA toàn mạng')).toBeInTheDocument();

        expect(screen.getByText('Lỗi kết nối cần xử lý')).toBeInTheDocument();
        expect(screen.getByText('Không có sự cố kết nối')).toBeInTheDocument();

        expect(screen.getByText('Đang bảo trì / Degraded')).toBeInTheDocument();
        expect(screen.getByText('Hoạt động bình thường')).toBeInTheDocument();

        expect(screen.getByText('Tài liệu Cụm lưu trữ')).toBeInTheDocument();
        expect(screen.getAllByText(/Tài liệu/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/dung lượng Repo/i)).toBeInTheDocument();
    });

    it('opens detail modal when clicking Kubo node in the topology graph and closes it', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminIpfsPage />
            </MemoryRouter>
        );

        // Click Kubo IPFS card in topology graph
        const kuboCard = screen.getByText('Kubo IPFS (Docker Container)');
        await user.click(kuboCard);

        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(within(dialog).getByText('Local IPFS Daemon (Docker Kubo)')).toBeInTheDocument();
        expect(within(dialog).getByRole('button', { name: /dọn rác repo \(repo gc\)/i })).toBeInTheDocument();

        // Close modal
        const closeBtn = within(dialog).getByRole('button', { name: /đóng modal/i });
        await user.click(closeBtn);

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('switches between metrics and logs terminal tab inside node detail modal and copies logs', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminIpfsPage />
            </MemoryRouter>
        );

        // Click Local IPFS Daemon
        const kuboRow = screen.getByText('Local IPFS Daemon (Docker Kubo)');
        await user.click(kuboRow);

        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(within(dialog).getByText('Đang hoạt động')).toBeInTheDocument();

        // Switch to Logs Terminal Tab
        const logsTab = within(dialog).getByRole('button', { name: /nhật ký lỗi & kết nối/i });
        await user.click(logsTab);

        expect(within(dialog).getByText(/Terminal Logs Daemon/i)).toBeInTheDocument();

        // Click Copy Logs button
        const copyLogsBtn = within(dialog).getByRole('button', { name: /sao chép nhật ký/i });
        await user.click(copyLogsBtn);

        expect(within(dialog).getByText(/đã sao chép/i)).toBeInTheDocument();
    });

    it('renders infrastructure nodes table and filters rows by search query', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminIpfsPage />
            </MemoryRouter>
        );

        expect(screen.getByText('Bảng kiểm soát kết nối hạ tầng IPFS')).toBeInTheDocument();
        expect(screen.getByText('Document Service Backend (Port 8082)')).toBeInTheDocument();
        expect(screen.getByText('Local IPFS Daemon (Docker Kubo)')).toBeInTheDocument();
        expect(screen.getByText('Pinata Cloud Gateway Bridge')).toBeInTheDocument();
        expect(screen.getByText('Local IPFS Gateway (:8080/ipfs)')).toBeInTheDocument();
        expect(screen.getAllByText('Pinata Dedicated Gateway').length).toBeGreaterThan(0);

        // Search filter
        const searchInput = screen.getByPlaceholderText(/Tìm theo tên node, loại hạ tầng, Peer ID/i);
        await user.type(searchInput, 'Pinata');

        expect(screen.getByText('Pinata Cloud Gateway Bridge')).toBeInTheDocument();
        expect(screen.getAllByText('Pinata Dedicated Gateway').length).toBeGreaterThan(0);
        expect(screen.queryByText('Local IPFS Daemon (Docker Kubo)')).not.toBeInTheDocument();
    });

    it('filters table nodes by connection status tabs and clicking KPI cards', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminIpfsPage />
            </MemoryRouter>
        );

        // Click Error Status Filter Tab
        const errorTab = screen.getByRole('button', { name: /lỗi kết nối \(0\)/i });
        await user.click(errorTab);

        // Empty state shown when 0 error nodes
        expect(screen.getByText('Không tìm thấy node nào phù hợp với điều kiện lọc hiện tại')).toBeInTheDocument();

        // Click Offline Status Filter Tab
        const offlineTab = screen.getByRole('button', { name: /ngừng hoạt động \(0\)/i });
        await user.click(offlineTab);
        expect(screen.getByText('Không tìm thấy node nào phù hợp với điều kiện lọc hiện tại')).toBeInTheDocument();

        // Click Active Tab
        const activeTab = screen.getByRole('button', { name: /đang hoạt động \(5\)/i });
        await user.click(activeTab);

        expect(screen.getByText('Document Service Backend (Port 8082)')).toBeInTheDocument();
        expect(screen.getByText('Local IPFS Daemon (Docker Kubo)')).toBeInTheDocument();

        // Test clicking KPI Card to filter
        const errorKpi = screen.getByText('Lỗi kết nối cần xử lý');
        await user.click(errorKpi);
        expect(screen.getByText('Không tìm thấy node nào phù hợp với điều kiện lọc hiện tại')).toBeInTheDocument();
    });

    it('opens node detail modal from table row action button and handles ping action', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminIpfsPage />
            </MemoryRouter>
        );

        const detailButtons = screen.getAllByRole('button', { name: /chi tiết & logs/i });
        expect(detailButtons.length).toBeGreaterThan(0);

        await user.click(detailButtons[0]);

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/Địa chỉ (Swarm Multiaddr|Cổng IPFS Gateway)/i)).toBeInTheDocument();

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

    it('renders IPFS topology graph with Document Service, Kubo Docker, Pinata Cloud, and Gateways', () => {
        render(
            <MemoryRouter>
                <AdminIpfsPage />
            </MemoryRouter>
        );

        expect(screen.getByText(/Sơ đồ Giám sát Tuyến dữ liệu IPFS/i)).toBeInTheDocument();
        expect(screen.getByText('Document Service Backend')).toBeInTheDocument();
        expect(screen.getByText('Kubo IPFS (Docker Container)')).toBeInTheDocument();
        expect(screen.getAllByText('Pinata Cloud Bridge').length).toBeGreaterThan(0);
        expect(screen.getByText(/Local Gateway \(:8080\/ipfs\)/i)).toBeInTheDocument();
        expect(screen.getAllByText('Pinata Dedicated Gateway').length).toBeGreaterThan(0);
    });

    it('renders desynced documents table and triggers sync all action', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminIpfsPage />
            </MemoryRouter>
        );

        expect(screen.getByText('Quản lý Tài liệu Lệch pha & Đồng bộ Lưu trữ')).toBeInTheDocument();
        const syncAllBtn = screen.getByRole('button', { name: /đồng bộ tất cả sang pinata cloud/i });
        expect(syncAllBtn).toBeInTheDocument();

        await user.click(syncAllBtn);
        expect(screen.getByRole('button', { name: /đồng bộ tất cả sang pinata cloud|đang đồng bộ hàng loạt/i })).toBeInTheDocument();
    });

    it('handles mode switching to local-only with Pinata nodes grayed out and bypassed', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminIpfsPage />
            </MemoryRouter>
        );

        // Ensure Mock Mode is absent
        expect(screen.queryByRole('button', { name: 'Mock Mode' })).not.toBeInTheDocument();

        // Switch to Local Kubo mode
        const localKuboBtn = screen.getByRole('button', { name: 'Local Kubo' });
        await user.click(localKuboBtn);

        // Verify Pinata nodes show bypassed tag and status in the table
        const localOnlyBadges = screen.getAllByText('Tạm ngắt (Local-only)');
        expect(localOnlyBadges.length).toBeGreaterThanOrEqual(1);

        const bypassedStatuses = screen.getAllByText('Tạm ngắt');
        expect(bypassedStatuses.length).toBeGreaterThanOrEqual(1);

        const bypassedSla = screen.getAllByText('Bỏ qua');
        expect(bypassedSla.length).toBeGreaterThanOrEqual(1);

        // Local Kubo daemon remains active and not bypassed initially
        expect(screen.getByText('Local IPFS Daemon (Docker Kubo)')).toBeInTheDocument();

        // Verify offline filter tab counts the 2 bypassed nodes in local-only mode
        const offlineTabLocalMode = screen.getByRole('button', { name: /ngừng hoạt động \(2\)/i });
        expect(offlineTabLocalMode).toBeInTheDocument();
        await user.click(offlineTabLocalMode);
        expect(screen.getByText('Pinata Cloud Gateway Bridge')).toBeInTheDocument();
        expect(screen.queryByText('Local IPFS Daemon (Docker Kubo)')).not.toBeInTheDocument();

        // Switch back to "All" tab to view all nodes
        const allTab = screen.getByRole('button', { name: /tất cả \(5\)/i });
        await user.click(allTab);
        expect(screen.getByText('Local IPFS Daemon (Docker Kubo)')).toBeInTheDocument();
    });
});
