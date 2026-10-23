import { useState, useMemo } from 'react';
import {
    Network,
    Gauge,
    Zap,
    Pin,
    RefreshCw,
    Search,
    ExternalLink,
} from 'lucide-react';
import { AdminLayout } from '../../../components/admin';
import { Button } from '../../../components/ui';
import { NodeClusterMap } from './components/NodeClusterMap';
import { NodeDetailModal, type IpfsNodeInfo } from './components/NodeDetailModal';

const initialNodes: IpfsNodeInfo[] = [
    {
        id: 8,
        name: 'Node ĐH Bách Khoa HN',
        cid: 'QmZtmD2...82Fq',
        sla: '99.98%',
        lat: '18 ms',
        reviews: '1,240',
        status: 'hot',
        bandwidth: '240 Mbps',
        storageUsed: '18.4 TB',
        location: 'Hà Nội',
        multiaddr: '/ip4/113.190.24.77/tcp/4001/p2p/QmZtmD282FqBkHn',
    },
    {
        id: 1,
        name: 'Node ĐH Kinh tế Quốc dân',
        cid: 'QmXk9aP...4rTe',
        sla: '99.97%',
        lat: '22 ms',
        reviews: '1,102',
        status: 'active',
        bandwidth: '195 Mbps',
        storageUsed: '15.2 TB',
        location: 'Hà Nội',
        multiaddr: '/ip4/113.190.24.12/tcp/4001/p2p/QmXk9aP4rTeNeu',
    },
    {
        id: 2,
        name: 'Node Học viện BCVT',
        cid: 'QmRw3Lc...9hVn',
        sla: '99.95%',
        lat: '25 ms',
        reviews: '986',
        status: 'active',
        bandwidth: '175 Mbps',
        storageUsed: '12.8 TB',
        location: 'Hà Nội',
        multiaddr: '/ip4/113.190.24.34/tcp/4001/p2p/QmRw3Lc9hVnPtit',
    },
    {
        id: 3,
        name: 'Node ĐH Ngoại thương',
        cid: 'QmTy7Hd...2bMz',
        sla: '99.93%',
        lat: '27 ms',
        reviews: '874',
        status: 'active',
        bandwidth: '160 Mbps',
        storageUsed: '11.4 TB',
        location: 'Hà Nội',
        multiaddr: '/ip4/113.190.24.55/tcp/4001/p2p/QmTy7Hd2bMzFtu',
    },
    {
        id: 4,
        name: 'Node ĐH Kinh tế TP.HCM',
        cid: 'QmPq5Jf...8cKs',
        sla: '99.91%',
        lat: '41 ms',
        reviews: '803',
        status: 'active',
        bandwidth: '185 Mbps',
        storageUsed: '14.0 TB',
        location: 'TP. Hồ Chí Minh',
        multiaddr: '/ip4/113.190.24.88/tcp/4001/p2p/QmPq5Jf8cKsUeh',
    },
    {
        id: 5,
        name: 'Node ĐH Quốc gia Hà Nội',
        cid: 'QmHn8Lk...3aYw',
        sla: '99.89%',
        lat: '20 ms',
        reviews: '752',
        status: 'active',
        bandwidth: '170 Mbps',
        storageUsed: '10.5 TB',
        location: 'Hà Nội',
        multiaddr: '/ip4/113.190.24.62/tcp/4001/p2p/QmHn8Lk3aYwVnu',
    },
    {
        id: 6,
        name: 'Node ĐH Cần Thơ',
        cid: 'QmCt5Vb...9qPo',
        sla: '99.85%',
        lat: '38 ms',
        reviews: '645',
        status: 'active',
        bandwidth: '140 Mbps',
        storageUsed: '9.2 TB',
        location: 'Cần Thơ',
        multiaddr: '/ip4/113.190.24.91/tcp/4001/p2p/QmCt5Vb9qPoCtu',
    },
];

export function AdminIpfsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedNode, setSelectedNode] = useState<IpfsNodeInfo | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 600);
    };

    const handleSelectNodeByNumber = (nodeNumber: number) => {
        // Find existing node or generate info for arbitrary cluster node
        const found = initialNodes.find((n) => n.id === nodeNumber);
        if (found) {
            setSelectedNode(found);
        } else {
            setSelectedNode({
                id: nodeNumber,
                name: `Node Cụm #${nodeNumber}`,
                cid: `Qm${Math.random().toString(36).substring(2, 7)}...${Math.random().toString(36).substring(2, 6)}`,
                sla: `${(99.8 + (nodeNumber % 15) * 0.01).toFixed(2)}%`,
                lat: `${18 + (nodeNumber % 20)} ms`,
                reviews: `${400 + nodeNumber * 12}`,
                status: 'active',
                bandwidth: `${120 + (nodeNumber % 100)} Mbps`,
                storageUsed: `${(5 + (nodeNumber % 15) * 0.8).toFixed(1)} TB`,
                location: nodeNumber % 2 === 0 ? 'Khu vực Miền Bắc' : 'Khu vực Miền Nam',
            });
        }
        setIsModalOpen(true);
    };

    const handleSelectNode = (node: IpfsNodeInfo) => {
        setSelectedNode(node);
        setIsModalOpen(true);
    };

    const filteredNodes = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return initialNodes;
        return initialNodes.filter(
            (n) => n.name.toLowerCase().includes(q) || n.cid.toLowerCase().includes(q)
        );
    }, [searchQuery]);

    return (
        <AdminLayout
            breadcrumb="Admin / Giám sát Node IPFS"
            title="Giám sát Node IPFS"
            subtitle="Theo dõi 42 node phân tán, băng thông và SLA"
            actions={
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Status badge matching ref HTML */}
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#e6f9f0] text-[#009668] border border-[#b7ecd5] shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-[#009668] animate-pulse" />
                        Tất cả node hoạt động
                    </span>

                    {/* Refresh Button */}
                    <Button
                        variant="secondary"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="!bg-white !border-[#c3d0e6] !text-[#0b1c30] hover:!bg-[#eff4ff] text-xs font-semibold px-3 py-2 rounded-[9px]"
                        icon={
                            <RefreshCw
                                size={14}
                                className={`text-[#5a6a80] ${isRefreshing ? 'animate-spin' : ''}`}
                            />
                        }
                    >
                        {isRefreshing ? 'Đang làm mới...' : 'Làm mới trạng thái'}
                    </Button>
                </div>
            }
        >
            {/* 4 KPIs Grid (Exact from HTML) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* KPI 1 */}
                <div className="bg-white border border-[#dce9ff] rounded-[14px] p-4 flex flex-col gap-1.5 shadow-2xs">
                    <div className="text-xs text-[#5a6a80] font-medium flex items-center justify-between">
                        <span>Node trực tuyến</span>
                        <Network size={17} className="text-[#0051d5]" />
                    </div>
                    <div className="text-2xl font-bold text-[#0b1c30] tracking-tight">42 / 42</div>
                    <div className="text-xs text-[#009668] font-semibold">100% SLA</div>
                </div>

                {/* KPI 2 */}
                <div className="bg-white border border-[#dce9ff] rounded-[14px] p-4 flex flex-col gap-1.5 shadow-2xs">
                    <div className="text-xs text-[#5a6a80] font-medium flex items-center justify-between">
                        <span>Băng thông đỉnh</span>
                        <Gauge size={17} className="text-[#0051d5]" />
                    </div>
                    <div className="text-2xl font-bold text-[#0b1c30] tracking-tight">1.42 Gbps</div>
                    <div className="text-xs text-[#5a6a80]">trong 7 ngày qua</div>
                </div>

                {/* KPI 3 */}
                <div className="bg-white border border-[#dce9ff] rounded-[14px] p-4 flex flex-col gap-1.5 shadow-2xs">
                    <div className="text-xs text-[#5a6a80] font-medium flex items-center justify-between">
                        <span>Cache hit rate</span>
                        <Zap size={17} className="text-[#0051d5]" />
                    </div>
                    <div className="text-2xl font-bold text-[#0b1c30] tracking-tight">99.8%</div>
                    <div className="text-xs text-[#5a6a80]">truy vấn trúng cache</div>
                </div>

                {/* KPI 4 */}
                <div className="bg-white border border-[#dce9ff] rounded-[14px] p-4 flex flex-col gap-1.5 shadow-2xs">
                    <div className="text-xs text-[#5a6a80] font-medium flex items-center justify-between">
                        <span>Tài liệu đã pin</span>
                        <Pin size={17} className="text-[#0051d5]" />
                    </div>
                    <div className="text-2xl font-bold text-[#0b1c30] tracking-tight">142,580</div>
                    <div className="text-xs text-[#5a6a80]">CID đang được nhân bản</div>
                </div>
            </div>

            {/* Node Cluster Map (Interactive 42 Cells Grid) */}
            <NodeClusterMap onSelectNode={handleSelectNodeByNumber} activeHotNodeNumber={8} />

            {/* Top Performing Nodes Table */}
            <div className="bg-white border border-[#dce9ff] rounded-[14px] shadow-2xs overflow-hidden">
                <div className="px-5 py-4 border-b border-[#e5eeff] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-base font-bold text-[#0b1c30]">
                            Node hoạt động hàng đầu
                        </h2>
                        <p className="text-xs text-[#5a6a80] mt-0.5">
                            Xếp hạng các node có hiệu năng và độ ổn định cao nhất
                        </p>
                    </div>

                    {/* Table search filter */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search
                                size={15}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a6a80]"
                            />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm theo tên trường, CID..."
                                className="w-full h-9 pl-9 pr-3 text-xs bg-[#f8f9ff] border border-[#dce9ff] rounded-lg outline-none focus:border-[#0051d5] focus:bg-white transition-all text-[#0b1c30]"
                            />
                        </div>
                    </div>
                </div>

                {/* Table Data */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[700px]">
                        <thead>
                            <tr className="bg-[#f8f9ff] border-b border-[#e5eeff] text-[#5a6a80] font-semibold uppercase tracking-wider text-[11px]">
                                <th className="px-5 py-3">Node</th>
                                <th className="px-5 py-3">Node ID</th>
                                <th className="px-5 py-3">SLA</th>
                                <th className="px-5 py-3">Độ trễ</th>
                                <th className="px-5 py-3">Review</th>
                                <th className="px-5 py-3 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#eef3ff]">
                            {filteredNodes.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-5 py-8 text-center text-xs text-[#5a6a80]"
                                    >
                                        Không tìm thấy node nào phù hợp với từ khóa "{searchQuery}"
                                    </td>
                                </tr>
                            ) : (
                                filteredNodes.map((t) => (
                                    <tr
                                        key={t.id}
                                        className="hover:bg-[#fafcff] transition-colors group cursor-pointer"
                                        onClick={() => handleSelectNode(t)}
                                    >
                                        <td className="px-5 py-3.5 font-semibold text-[#0b1c30]">
                                            <div className="flex items-center gap-2">
                                                <span>{t.name}</span>
                                                {t.status === 'hot' && (
                                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#009668] text-white">
                                                        Quản trị
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 font-mono text-[#0051d5]">
                                            {t.cid}
                                        </td>
                                        <td className="px-5 py-3.5 font-semibold text-[#009668]">
                                            {t.sla}
                                        </td>
                                        <td className="px-5 py-3.5 text-[#0b1c30]">{t.lat}</td>
                                        <td className="px-5 py-3.5 text-[#5a6a80] font-mono">
                                            {t.reviews}
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSelectNode(t);
                                                }}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md text-[#0051d5] bg-[#e5eeff] hover:bg-[#d5e4ff] transition-colors"
                                            >
                                                <span>Chi tiết</span>
                                                <ExternalLink size={12} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Node Detail Modal */}
            <NodeDetailModal
                node={selectedNode}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </AdminLayout>
    );
}
