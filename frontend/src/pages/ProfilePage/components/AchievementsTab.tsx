import { Award, Sparkles, Star, ShieldCheck, Lock, CheckCircle2, Trophy, GraduationCap } from 'lucide-react';
import type { BadgeDto } from '../../../services/authService';

interface AchievementsTabProps {
  badges?: BadgeDto[];
}

interface SystemBadge {
  code: string;
  name: string;
  category: 'contribute' | 'reputation' | 'community';
  condition: string;
  description: string;
  icon: typeof Award;
}

const SYSTEM_BADGES: SystemBadge[] = [
  {
    code: 'FIRST_UPLOAD',
    name: 'Khởi Đầu Chia Sẻ',
    category: 'contribute',
    condition: 'Tải lên 1 tài liệu đầu tiên được duyệt',
    description: 'Tải lên tài liệu học tập đầu tiên được phê duyệt thành công trên hệ thống.',
    icon: Sparkles,
  },
  {
    code: 'ACTIVE_CONTRIBUTOR',
    name: 'Đóng Góp Tích Cực',
    category: 'contribute',
    condition: 'Chia sẻ từ 10 tài liệu học tập đạt chuẩn',
    description: 'Đã đóng góp từ 10 tài liệu giáo trình, đề thi hữu ích cho cộng đồng sinh viên.',
    icon: Award,
  },
  {
    code: 'EXCELLENT_DOC',
    name: 'Tài Liệu Xuất Sắc',
    category: 'contribute',
    condition: 'Có tài liệu đạt đánh giá 5★ (từ 10 lượt)',
    description: 'Tài liệu học tập đạt chất lượng cao nhất, được cộng đồng bình chọn 5 sao chuẩn mực.',
    icon: Star,
  },
  {
    code: 'TOP_AUTHOR_2025',
    name: 'Top Author 2025',
    category: 'contribute',
    condition: 'Tác giả có từ 5 tài liệu & 20+ lượt tim',
    description: 'Nằm trong danh sách các tác giả chia sẻ tài liệu sôi nổi và được yêu thích nhất năm 2025.',
    icon: Trophy,
  },
  {
    code: 'REPUTATION_500',
    name: 'Học Giả Tri Thức',
    category: 'reputation',
    condition: 'Đạt mốc 500 điểm Uy Tín trọn đời',
    description: 'Cột mốc cống hiến tri thức bền bỉ, khẳng định vị thế học giả uy tín trên mạng lưới.',
    icon: GraduationCap,
  },
  {
    code: 'REPUTATION_1500',
    name: 'Huyền Thoại DeDocu',
    category: 'reputation',
    condition: 'Đạt mốc 1.500+ điểm Uy Tín trọn đời',
    description: 'Danh hiệu cao quý nhất dành cho những đóng góp vĩ đại vào kho tàng tri thức phi tập trung.',
    icon: ShieldCheck,
  },
  {
    code: 'QUIZ_MASTER',
    name: 'Bậc Thầy Trắc Nghiệm',
    category: 'reputation',
    condition: 'Hoàn thành 20 bài Quiz đạt điểm ≥ 80%',
    description: 'Chăm chỉ ôn tập, hoàn thành xuất sắc các bộ đề thi thử và Quiz củng cố kiến thức.',
    icon: Award,
  },
  {
    code: 'TOP_REVIEWER',
    name: 'Nhà Phê Bình Tận Tâm',
    category: 'community',
    condition: 'Đóng góp 15+ nhận xét đánh giá chuyên sâu',
    description: 'Tích cực phản biện, đánh giá và giúp cải thiện chất lượng học liệu trên nền tảng.',
    icon: Star,
  },
  {
    code: 'GENESIS_LEADER',
    name: 'Tiên Phong Nền Tảng',
    category: 'community',
    condition: 'Thành viên sáng lập giai đoạn Genesis',
    description: 'Thành viên tham gia đóng góp và đặt nền móng cho Mạng lưới học thuật phi tập trung DeDocu.',
    icon: Sparkles,
  },
];

export function AchievementsTab({ badges = [] }: AchievementsTabProps) {
  const earnedBadges = badges || [];
  const earnedCodes = new Set(earnedBadges.map((b) => (b.code || '').toUpperCase()));

  const getBadgeVisuals = (category: SystemBadge['category']) => {
    switch (category) {
      case 'contribute':
        return {
          cardBg: 'bg-amber-50/70 border-amber-200/80',
          iconBg: 'bg-amber-500 text-white',
          titleColor: 'text-amber-950',
          descColor: 'text-amber-700',
        };
      case 'reputation':
        return {
          cardBg: 'bg-sky-50/70 border-sky-200/80',
          iconBg: 'bg-sky-500 text-white',
          titleColor: 'text-sky-950',
          descColor: 'text-sky-700',
        };
      case 'community':
      default:
        return {
          cardBg: 'bg-purple-50/70 border-purple-200/80',
          iconBg: 'bg-purple-500 text-white',
          titleColor: 'text-purple-950',
          descColor: 'text-purple-700',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* KHỐI 1: HUY HIỆU ĐÃ ĐẠT ĐƯỢC */}
      <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#f1f5f9] pb-4">
          <div>
            <h2 className="text-base font-bold text-[#0f172a] flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Huy hiệu & Đóng góp học thuật
            </h2>
            <p className="text-xs text-[#64748b] mt-0.5">
              Các danh hiệu được hệ thống tự động ghi nhận dựa trên hoạt động chia sẻ tri thức thực tế
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold self-start sm:self-auto">
            Đã mở khóa: <strong className="text-sky-600">{earnedBadges.length}</strong> / {SYSTEM_BADGES.length}
          </span>
        </div>

        {earnedBadges.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {earnedBadges.map((badge, idx) => {
              const matched = SYSTEM_BADGES.find((b) => b.code.toUpperCase() === (badge.code || '').toUpperCase());
              const category = matched ? matched.category : 'contribute';
              const visuals = getBadgeVisuals(category);
              const IconComp = matched?.icon || Award;

              return (
                <div
                  key={badge.id || badge.code || idx}
                  className={`p-4 rounded-xl border flex items-start gap-3 relative overflow-hidden transition-all hover:shadow-sm ${visuals.cardBg}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${visuals.iconBg}`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className={`text-xs font-bold truncate ${visuals.titleColor}`}>
                        {badge.name || matched?.name}
                      </h4>
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        Đạt
                      </span>
                    </div>
                    <p className={`text-[11px] mt-1 leading-relaxed ${visuals.descColor}`}>
                      {badge.description || matched?.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-10 px-4 rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs flex items-center justify-center text-[#94a3b8]">
              <Award className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="text-sm font-bold text-[#0f172a]">Chưa có huy hiệu học thuật</h3>
              <p className="text-xs text-[#64748b] leading-relaxed">
                Tài khoản chưa đạt điều kiện để mở khóa huy hiệu. Hãy tích cực chia sẻ tài liệu học tập, nhận đánh giá 5 sao từ cộng đồng và hoàn thành Quiz để mở khóa các danh hiệu bên dưới nhé!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* KHỐI 2: DANH MỤC CÁC CỘT MỐC HUY HIỆU TRONG HỆ THỐNG */}
      <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[#0f172a]">Hệ thống danh hiệu DeDocu (Mục tiêu phấn đấu)</h3>
          <p className="text-xs text-[#64748b] mt-0.5">
            Quy chế mở khóa minh bạch dành cho mọi thành viên trong mạng lưới học thuật
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
          {SYSTEM_BADGES.map((sysBadge) => {
            const isUnlocked = earnedCodes.has(sysBadge.code.toUpperCase());
            const IconComp = sysBadge.icon;

            return (
              <div
                key={sysBadge.code}
                className={`p-3.5 rounded-xl border transition-all ${
                  isUnlocked
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : 'bg-[#fafafa] border-[#e2e8f0] hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isUnlocked ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        isUnlocked ? 'text-emerald-950' : 'text-slate-800'
                      }`}
                    >
                      {sysBadge.name}
                    </span>
                  </div>

                  {isUnlocked ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      Đã mở
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                      <Lock className="w-3 h-3" />
                      Chưa mở
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-[#475569] leading-snug">
                  {sysBadge.description}
                </p>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-medium">Điều kiện:</span>
                  <span className="font-semibold text-slate-700">{sysBadge.condition}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

