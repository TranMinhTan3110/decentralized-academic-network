import { useState, useEffect } from 'react';
import { X, Edit3, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { documentService } from '../../services/documentService';
import type { DocumentDetail } from '../../types';

export interface EditDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentDetail;
  onUpdated: (updated: DocumentDetail) => void;
}

export function EditDocumentModal({
  isOpen,
  onClose,
  document,
  onUpdated,
}: EditDocumentModalProps) {
  const [title, setTitle] = useState(document.title || '');
  const [description, setDescription] = useState(document.description || '');
  const [academicYear, setAcademicYear] = useState(document.academicYear || '2025-2026');
  const [semester, setSemester] = useState(document.semester || 'HK1');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(document.title || '');
      setDescription(document.description || '');
      setAcademicYear(document.academicYear || '2025-2026');
      setSemester(document.semester || 'HK1');
    }
  }, [isOpen, document]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || title.trim().length < 3) {
      toast.error('Tiêu đề tài liệu phải có ít nhất 3 ký tự!');
      return;
    }

    setLoading(true);
    try {
      const updated = await documentService.update(document.id, {
        title: title.trim(),
        description: description.trim(),
        academicYear,
        semester,
      });
      toast.success('Cập nhật thông tin tài liệu thành công!');
      onUpdated(updated);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Cập nhật thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-doc-modal-title"
      data-testid="edit-document-modal"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#CBD5E1] relative flex flex-col gap-4">
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
          <div className="w-11 h-11 rounded-xl bg-sky-100 text-[#0284C7] flex items-center justify-center shrink-0">
            <Edit3 size={22} />
          </div>
          <div>
            <h3 id="edit-doc-modal-title" className="text-lg font-bold text-[#0F172A] leading-tight">
              Chỉnh sửa thông tin tài liệu
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">Cập nhật tiêu đề, mô tả và năm học</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
              Tiêu đề tài liệu <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#CBD5E1] text-xs text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
              placeholder="Nhập tiêu đề tài liệu..."
              required
              data-testid="edit-title-input"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
              Mô tả tóm tắt
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full p-2.5 rounded-xl border border-[#CBD5E1] text-xs text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#0284C7] resize-y"
              placeholder="Mô tả nội dung chính của tài liệu..."
              data-testid="edit-description-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                Năm học
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#CBD5E1] text-xs text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
                placeholder="2025-2026"
                data-testid="edit-academic-year-input"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                Học kỳ
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#CBD5E1] text-xs text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
                data-testid="edit-semester-select"
              >
                <option value="HK1">Học kỳ 1</option>
                <option value="HK2">Học kỳ 2</option>
                <option value="HK Hè">Học kỳ Hè</option>
                <option value="Cả năm">Cả năm</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
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
              className="px-4 py-2 bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              data-testid="edit-submit-btn"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
