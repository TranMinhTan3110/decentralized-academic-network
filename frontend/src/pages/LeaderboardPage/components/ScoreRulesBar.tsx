import { UploadCloud, Bookmark, Heart } from 'lucide-react';

export function ScoreRulesBar() {
    return (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#d8deea] shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-[#f0f6ff] border border-[#d2e4ff] flex items-center justify-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#315dff]/15 text-[#315dff] flex items-center justify-center shrink-0">
                    <UploadCloud className="w-5 h-5" />
                </div>
                <div className="text-left">
                    <div className="text-xs font-bold text-[#121827] flex items-center gap-1">
                        <span className="text-[#315dff] font-black text-sm">+10 điểm</span>
                    </div>
                    <span className="text-[11px] text-[#5f6878]">cho mỗi tài liệu tải lên</span>
                </div>
            </div>

            <div className="p-3 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                    <Bookmark className="w-5 h-5" />
                </div>
                <div className="text-left">
                    <div className="text-xs font-bold text-[#121827] flex items-center gap-1">
                        <span className="text-emerald-600 font-black text-sm">+5 điểm</span>
                    </div>
                    <span className="text-[11px] text-[#5f6878]">cho mỗi lượt lưu tài liệu</span>
                </div>
            </div>

            <div className="p-3 rounded-xl bg-[#fff1f2] border border-[#fecdd3] flex items-center justify-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-rose-500/15 text-rose-600 flex items-center justify-center shrink-0">
                    <Heart className="w-5 h-5" />
                </div>
                <div className="text-left">
                    <div className="text-xs font-bold text-[#121827] flex items-center gap-1">
                        <span className="text-rose-600 font-black text-sm">+2 điểm</span>
                    </div>
                    <span className="text-[11px] text-[#5f6878]">cho mỗi lượt thả tim</span>
                </div>
            </div>
        </div>
    );
}
