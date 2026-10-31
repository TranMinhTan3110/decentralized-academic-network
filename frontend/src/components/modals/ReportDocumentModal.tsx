import { useState } from 'react';
import { X, AlertTriangle, ShieldAlert, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { documentService } from '../../services/documentService';

export interface ReportDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
}

const REPORT_REASONS = [
  'Bản quyền / Đạo văn (Copyright / Plagiarism)',
  'Nội dung sai lệch hoặc Spam',
  'Tài liệu bị lỗi, không đọc được',
  'Vi phạm quy chuẩn học thuật',
  'Khác',
];

export function ReportDocumentModal({
  isOpen,
  onClose,
  documentId,
  documentTitle,
}: ReportDocumentModalProps) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Vui lòng chọn lý do báo cáo.');
      return;
    }

    setLoading(true);
    try {
      await documentService.report(documentId, reason, description.trim() || undefined);
      toast.success('Báo cáo vi phạm đã được gửi thành công. Cảm ơn đóng góp của bạn!');
      onClose();
      setDescription('');
    } catch (err: any) {
      toast.error(err?.message || 'Gửi báo cáo thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      data-testid="report-modal"
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#CBD5E1] relative flex flex-col gap-4">
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
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h3 id="report-modal-title" className="text-lg font-bold text-[#0F172A] leading-tight">
              Báo cáo vi phạm tài liệu
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">Giúp bảo vệ cộng đồng học thuật trong sạch & minh bạch.</p>
          </div>
        </div>

        {/* DOCUMENT INFO */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-xl text-xs">
          <span className="text-[#64748B] font-medium">Tài liệu: </span>
          <span className="font-bold text-[#0F172A] line-clamp-1">{documentTitle}</span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
              Lý do báo cáo <span className="text-rose-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#CBD5E1] text-xs text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
              data-testid="report-reason-select"
            >
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
              Mô tả chi tiết (tùy chọn)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Cung cấp thêm bằng chứng hoặc chi tiết vi phạm để ban quản trị xử lý nhanh chóng..."
              rows={3}
              className="w-full p-2.5 rounded-xl border border-[#CBD5E1] text-xs text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#0284C7] resize-y"
              data-testid="report-description-input"
            />
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#64748B] bg-amber-50 p-2.5 rounded-xl border border-amber-200/60">
            <AlertTriangle size={15} className="text-amber-600 shrink-0" />
            <span>Mọi báo cáo sai sự thật hoặc lạm dụng có thể ảnh hưởng đến điểm uy tín của tài khoản.</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              data-testid="report-submit-btn"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              <span>Gửi báo cáo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
