import { useState } from 'react';
import { X, Lock, Coins, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { documentService } from '../../services/documentService';

export interface UnlockDocumentModalProps {
  isOpen: boolean;
  documentTitle: string;
  unlockPoints: number;
  userBalance?: number;
  onClose: () => void;
  onUnlocked: () => void;
  documentId: string;
}

export function UnlockDocumentModal({
  isOpen,
  documentTitle,
  unlockPoints,
  userBalance,
  onClose,
  onUnlocked,
  documentId,
}: UnlockDocumentModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Balance chưa biết (chưa fetch kịp) → cho phép thử, backend chốt bằng số dư thật
  const hasEnoughPoints = userBalance === undefined ? true : userBalance >= unlockPoints;

  const handleConfirmUnlock = async () => {
    if (!hasEnoughPoints) {
      toast.error('Số dư điểm không đủ để mở khóa tài liệu này!');
      return;
    }

    setLoading(true);
    try {
      const success = await documentService.unlock(documentId);
      if (success) {
        toast.success('Mở khóa tài liệu thành công!');
        onUnlocked();
        onClose();
      } else {
        toast.error('Không thể mở khóa tài liệu. Vui lòng thử lại.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Mở khóa tài liệu thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unlock-modal-title"
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#CBD5E1] relative flex flex-col gap-5">
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#64748B] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X size={18} />
        </button>

        {/* HEADER */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Lock size={24} />
          </div>
          <div>
            <h3 id="unlock-modal-title" className="text-lg font-bold text-[#0F172A] leading-tight">
              Mở khóa tài liệu học tập
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">Quyền truy cập toàn bộ trang bản rõ nét vĩnh viễn.</p>
          </div>
        </div>

        {/* DOCUMENT INFO */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 rounded-xl text-xs space-y-2">
          <div className="flex justify-between items-start gap-2">
            <span className="text-[#64748B] shrink-0 font-medium">Tài liệu:</span>
            <span className="font-bold text-[#0F172A] text-right line-clamp-2">{documentTitle}</span>
          </div>
          <div className="flex justify-between items-center border-t border-dashed border-[#CBD5E1] pt-2">
            <span className="text-[#64748B] font-medium flex items-center gap-1.5">
              <Coins size={14} className="text-amber-600" /> Điểm yêu cầu:
            </span>
            <span className="font-extrabold text-[#D97706] text-sm">
              {unlockPoints === 0 ? 'Miễn phí' : `${unlockPoints} điểm`}
            </span>
          </div>
          <div className="flex justify-between items-center border-t border-dashed border-[#CBD5E1] pt-2">
            <span className="text-[#64748B] font-medium">Số dư hiện tại của bạn:</span>
            <span className={`font-bold ${hasEnoughPoints ? 'text-emerald-600' : 'text-[#EF4444]'}`}>
              {userBalance} điểm
            </span>
          </div>
        </div>

        {/* INSUFFICIENT BALANCE WARNING */}
        {!hasEnoughPoints && (
          <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Số dư điểm không đủ</strong>
              <p className="mt-0.5">
                Bạn cần thêm {unlockPoints - (userBalance ?? 0)} điểm. Hãy chia sẻ tài liệu hữu ích để nhận điểm thưởng từ cộng đồng!
              </p>
            </div>
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white border border-[#CBD5E1] text-[#334155] rounded-xl text-xs font-semibold hover:bg-[#F8FAFC] transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={!hasEnoughPoints || loading}
            onClick={handleConfirmUnlock}
            className="flex-1 px-4 py-2.5 bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={15} />
                <span>Xác nhận mở khóa</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
