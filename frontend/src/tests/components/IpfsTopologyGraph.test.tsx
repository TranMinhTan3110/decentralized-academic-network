import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IpfsTopologyGraph } from '../../pages/admin/AdminIpfsPage/components/IpfsTopologyGraph';
import type { IpfsTopologyData } from '../../pages/admin/AdminIpfsPage/types/topology';

const mockHealthyTopology: IpfsTopologyData = {
    backendStatus: 'online',
    kubo: {
        status: 'online',
        pingMs: 12,
        version: 'kubo/0.32.0',
        peerId: '12D3KooWTestPeer',
        swarmPeersCount: 42,
        repoSizeBytes: 12000000000,
        pinnedCount: 142,
    },
    pinata: {
        status: 'online',
        pingMs: 45,
        authenticated: true,
        pinnedCount: 142,
        storageUsedBytes: 12000000000,
    },
    gateway: {
        localGatewayStatus: 'online',
        pinataGatewayStatus: 'online',
    },
    lastChecked: '14:30:00',
    verdict: {
        level: 'success',
        title: 'MẠNG LƯỚI HOẠT ĐỘNG TỐI ƯU',
        description: 'Cả hai trạm lưu trữ đều kết nối ổn định.',
        failingComponent: 'NONE',
    },
};

describe('IpfsTopologyGraph Component', () => {
    it('renders all nodes, connections, and success verdict when healthy', () => {
        render(
            <IpfsTopologyGraph
                data={mockHealthyTopology}
                onRefresh={vi.fn()}
                isRefreshing={false}
            />
        );

        expect(screen.getByText('Document Service Backend')).toBeInTheDocument();
        expect(screen.getByText('Kubo IPFS (Docker Container)')).toBeInTheDocument();
        expect(screen.getByText('Pinata Cloud Bridge')).toBeInTheDocument();
        expect(screen.getByText(/Local Gateway \(:8080\/ipfs\)/i)).toBeInTheDocument();
        expect(screen.getByText('Pinata Dedicated Gateway')).toBeInTheDocument();
        expect(screen.getByText('MẠNG LƯỚI HOẠT ĐỘNG TỐI ƯU')).toBeInTheDocument();
        expect(screen.getByText('12 ms')).toBeInTheDocument();
        expect(screen.getByText('45 ms')).toBeInTheDocument();
    });

    it('displays error badge and Docker failure message when Kubo node is offline', () => {
        const dockerDownData: IpfsTopologyData = {
            ...mockHealthyTopology,
            kubo: {
                ...mockHealthyTopology.kubo,
                status: 'offline',
                pingMs: null,
                errorMessage: 'Connection refused on port 5001',
            },
            verdict: {
                level: 'warning',
                title: 'SỰ CỐ TẠI DOCKER KUBO CONTAINER',
                description: 'Kubo daemon container không phản hồi.',
                failingComponent: 'DOCKER',
            },
        };

        render(
            <IpfsTopologyGraph
                data={dockerDownData}
                onRefresh={vi.fn()}
                isRefreshing={false}
            />
        );

        expect(screen.getByText('Connection refused on port 5001')).toBeInTheDocument();
        expect(screen.getByText('SỰ CỐ TẠI DOCKER KUBO CONTAINER')).toBeInTheDocument();
        expect(screen.getByText('Timeout')).toBeInTheDocument();
    });

    it('calls onRefresh when Ping button is clicked', async () => {
        const user = userEvent.setup();
        const onRefresh = vi.fn();

        render(
            <IpfsTopologyGraph
                data={mockHealthyTopology}
                onRefresh={onRefresh}
                isRefreshing={false}
            />
        );

        const pingBtn = screen.getByRole('button', { name: /ping (kiểm tra|kiem tra)/i });
        await user.click(pingBtn);

        expect(onRefresh).toHaveBeenCalledOnce();
    });

    it('calls onSelectNode when clicking Kubo or Pinata cards', async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();

        render(
            <IpfsTopologyGraph
                data={mockHealthyTopology}
                onRefresh={vi.fn()}
                isRefreshing={false}
                onSelectNode={onSelect}
            />
        );

        const kuboTitle = screen.getByText('Kubo IPFS (Docker Container)');
        await user.click(kuboTitle);
        expect(onSelect).toHaveBeenCalledWith('kubo');

        const pinataTitle = screen.getByText('Pinata Cloud Bridge');
        await user.click(pinataTitle);
        expect(onSelect).toHaveBeenCalledWith('pinata');
    });

    it('renders mode switcher and calls onModeChange when a mode button is clicked', async () => {
        const user = userEvent.setup();
        const onModeChange = vi.fn();

        render(
            <IpfsTopologyGraph
                data={mockHealthyTopology}
                onRefresh={vi.fn()}
                isRefreshing={false}
                onModeChange={onModeChange}
            />
        );

        expect(screen.getByText('Chế độ IPFS:')).toBeInTheDocument();
        // Ensure Mock Mode is completely removed
        expect(screen.queryByRole('button', { name: 'Mock Mode' })).not.toBeInTheDocument();

        const localKuboBtn = screen.getByRole('button', { name: 'Local Kubo' });
        expect(localKuboBtn).toBeInTheDocument();
        await user.click(localKuboBtn);
        expect(onModeChange).toHaveBeenCalledWith('local-only');

        const pinataCloudBtn = screen.getByRole('button', { name: 'Pinata Cloud' });
        expect(pinataCloudBtn).toBeInTheDocument();
        await user.click(pinataCloudBtn);
        expect(onModeChange).toHaveBeenCalledWith('pinata-only');
    });

    it('renders visual grayed out bypass effect on Pinata nodes when in local-only mode', () => {
        const localOnlyData: IpfsTopologyData = {
            ...mockHealthyTopology,
            currentMode: 'local-only',
        };

        render(
            <IpfsTopologyGraph
                data={localOnlyData}
                onRefresh={vi.fn()}
                isRefreshing={false}
            />
        );

        expect(screen.getByText('Chế độ Local-only: Pinata Cloud tạm ngắt kết nối')).toBeInTheDocument();
        const bypassedBadges = screen.getAllByText('TẠM BỎ QUA');
        expect(bypassedBadges.length).toBeGreaterThanOrEqual(1);
    });

    it('renders visual grayed out bypass effect on Kubo nodes when in pinata-only mode', () => {
        const pinataOnlyData: IpfsTopologyData = {
            ...mockHealthyTopology,
            currentMode: 'pinata-only',
        };

        render(
            <IpfsTopologyGraph
                data={pinataOnlyData}
                onRefresh={vi.fn()}
                isRefreshing={false}
            />
        );

        expect(screen.getByText('Chế độ Pinata-only: Kubo Node tạm ngắt kết nối')).toBeInTheDocument();
        const bypassedBadges = screen.getAllByText('TẠM BỎ QUA');
        expect(bypassedBadges.length).toBeGreaterThanOrEqual(1);
    });

    it('renders swarm peers branch box and triggers onSelectPeer when peer is clicked', async () => {
        const user = userEvent.setup();
        const onSelectPeer = vi.fn();
        const mockPeers = [
            {
                peerId: '12D3KooWTestPeerAlpha01',
                address: '/ip4/113.190.24.77/tcp/4001',
                latency: '14 ms',
                direction: 'Inbound',
                location: 'Ha Noi - DC01',
            },
            {
                peerId: '12D3KooWTestPeerBeta02',
                address: '/ip4/113.190.24.55/tcp/4001',
                latency: '22 ms',
                direction: 'Outbound',
                location: 'Da Nang - DC03',
            },
        ];

        render(
            <IpfsTopologyGraph
                data={mockHealthyTopology}
                peers={mockPeers}
                onRefresh={vi.fn()}
                isRefreshing={false}
                onSelectPeer={onSelectPeer}
            />
        );

        // Verify P2P Swarm Peers Box and Pinata Cloud Regions box
        expect(screen.getByText('Mạng lưới P2P Swarm Peers')).toBeInTheDocument();
        expect(screen.getByText('2 peers kết nối')).toBeInTheDocument();
        expect(screen.getByText('Phân vùng Pinata Cloud')).toBeInTheDocument();
        expect(screen.getByText('FRA1 (Frankfurt, EU)')).toBeInTheDocument();
        expect(screen.getByText('NYC1 (New York, US)')).toBeInTheDocument();

        // Click first peer
        const firstPeer = screen.getByText('12D3KooW...ha01');
        await user.click(firstPeer);
        expect(onSelectPeer).toHaveBeenCalledWith(mockPeers[0], 0);
    });
});
