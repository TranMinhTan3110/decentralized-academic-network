import { Award, Sparkles, Star } from 'lucide-react';

export function AchievementsTab() {
  return (
    <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-xs space-y-6">
      <div>
        <h2 className="text-base font-bold text-[#0f172a]">Huy hiệu & Đóng góp học thuật</h2>
        <p className="text-xs text-[#64748b]">Các danh hiệu đạt được qua hoạt động chia sẻ tài liệu tích cực</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-sky-950">Top Author 2025</h4>
            <p className="text-[11px] text-sky-700 mt-0.5 leading-relaxed">
              Nằm trong top 5% tác giả có lượt tải tài liệu nhiều nhất năm.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-950">Đóng góp Tích cực</h4>
            <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
              Đã chia sẻ hơn 10 tài liệu học tập đạt chất lượng kiểm duyệt.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0">
            <Star className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-rose-950">1,500+ Uy tín</h4>
            <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
              Đạt mốc 1,500+ điểm uy tín được bình chọn bởi cộng đồng sinh viên.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
