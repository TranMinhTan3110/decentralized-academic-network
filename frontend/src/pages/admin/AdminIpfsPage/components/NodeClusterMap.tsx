export interface NodeCell {
    n: number;
    isHot?: boolean;
    name?: string;
    lat?: string;
    sla?: string;
}

export interface NodeClusterMapProps {
    onSelectNode: (nodeNumber: number) => void;
    activeHotNodeNumber?: number;
}

export function NodeClusterMap({ onSelectNode, activeHotNodeNumber = 8 }: NodeClusterMapProps) {
    const nodes: NodeCell[] = Array.from({ length: 42 }, (_, i) => {
        const num = i + 1;
        return {
            n: num,
            isHot: num === activeHotNodeNumber,
            lat: `${16 + (num % 15)} ms`,
            sla: `${(99.9 + (num % 10) * 0.01).toFixed(2)}%`,
        };
    });

    return (
        <div className="bg-white border border-[#dce9ff] rounded-[14px] p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
                <div>
                    <h2 className="text-base font-bold text-[#0b1c30]">Bản đồ cụm node</h2>
                    <p className="text-xs text-[#5a6a80] mt-0.5">
                        Ô đậm: node của quản trị viên hiện tại (Node 8492) · Nhấp vào ô bất kỳ để xem chi tiết
                    </p>
                </div>
                {/* Legend */}
                <div className="flex items-center gap-3 text-xs shrink-0">
                    <span className="flex items-center gap-1.5 text-[#009668] font-medium">
                        <span className="w-3 h-3 rounded bg-[#e6f9f0] border border-[#b7ecd5]" />
                        41 Node hoạt động
                    </span>
                    <span className="flex items-center gap-1.5 text-[#009668] font-bold">
                        <span className="w-3 h-3 rounded bg-[#009668]" />
                        Node Quản trị (#8)
                    </span>
                </div>
            </div>

            {/* 42 Nodes Grid */}
            <div
                className="grid grid-cols-6 sm:grid-cols-7 md:grid-cols-14 gap-1.5 sm:gap-2 pt-2"
                role="region"
                aria-label="Bản đồ 42 node IPFS"
            >
                {nodes.map((c) => (
                    <button
                        key={c.n}
                        type="button"
                        onClick={() => onSelectNode(c.n)}
                        title={`Node #${c.n} ${c.isHot ? '(Node quản trị)' : ''} - Độ trễ: ${c.lat} - SLA: ${c.sla}`}
                        aria-label={`Chi tiết Node số ${c.n}`}
                        className={`aspect-square rounded-[6px] font-semibold text-[11px] flex items-center justify-center transition-all cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-[#0051d5] focus:ring-offset-1 ${
                            c.isHot
                                ? 'bg-[#009668] text-white border border-[#009668] shadow-xs hover:bg-[#007d56] scale-105'
                                : 'bg-[#e6f9f0] text-[#009668] border border-[#b7ecd5] hover:bg-[#d0f5e4] hover:scale-105'
                        }`}
                    >
                        {c.n}
                    </button>
                ))}
            </div>
        </div>
    );
}
