import { useState, useEffect } from 'react';
import { X, Heart, Loader2, User } from 'lucide-react';
import { documentService } from '../../services/documentService';
import type { AuthorSummary } from '../../types';

export interface LikersModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
}

export function LikersModal({ isOpen, onClose, documentId }: LikersModalProps) {
  const [loading, setLoading] = useState(false);
  const [likers, setLikers] = useState<AuthorSummary[]>([]);

  useEffect(() => {
    if (!isOpen || !documentId) return;
    let active = true;
    setLoading(true);

    documentService
      .getUsersWhoLiked(documentId)
      .then((users) => {
        if (active && Array.isArray(users)) {
          setLikers(users);
        }
      })
      .catch(() => {
        if (active) setLikers([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, documentId]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="likers-modal-title"
      data-testid="likers-modal"
    >
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-[#CBD5E1] relative flex flex-col gap-4 max-h-[80vh]">
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#64748B] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X size={18} />
        </button>

        {/* HEADER */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
            <Heart size={20} fill="#F43F5E" />
          </div>
          <div>
            <h3 id="likers-modal-title" className="text-base font-bold text-[#0F172A] leading-tight">
              Người đã thích ({likers.length})
            </h3>
            <p className="text-xs text-[#64748B]">Danh sách thành viên yêu thích tài liệu này</p>
          </div>
        </div>

        {/* LIKERS LIST */}
        <div className="overflow-y-auto space-y-2 pr-1 -mr-1">
          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs text-[#64748B]">
              <Loader2 size={20} className="animate-spin text-[#0284C7]" />
              <span>Đang tải danh sách...</span>
            </div>
          ) : likers.length > 0 ? (
            likers.map((u, idx) => (
              <div
                key={u.id || u.userId || idx}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-[#F8FAFC] transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {u.avatarUrl || u.avatar ? (
                    <img
                      src={u.avatarUrl || u.avatar}
                      alt={u.fullName}
                      className="w-9 h-9 rounded-full object-cover border border-[#E2E8F0] shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#0284C7] text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {(u.fullName || 'User').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#0F172A] truncate">
                      {u.fullName || u.username || 'Người dùng'}
                    </p>
                    <p className="text-[11px] text-[#64748B] truncate">
                      {u.badge || u.role || 'Thành viên'}
                    </p>
                  </div>
                </div>

                {u.points !== undefined && (
                  <span className="text-[11px] font-bold text-[#0284C7] bg-[#E0F2FE] px-2 py-0.5 rounded-full shrink-0">
                    {u.points} điểm
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-[#64748B]">
              <User size={24} className="mx-auto mb-2 text-[#CBD5E1]" />
              Chưa có lượt thích nào. Hãy là người đầu tiên thả tim!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
