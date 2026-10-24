import { useState } from 'react';
import { toast } from 'sonner';
import { Bookmark } from 'lucide-react';
import { documentService } from '../../services/documentService';

export interface SaveButtonProps {
  documentId: string;
  initialSaved?: boolean;
}

/**
 * Nút Lưu đồng bộ với backend bookmark API (toggle).
 */
export function SaveButton({ documentId, initialSaved = false }: SaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);

  const handleToggle = async () => {
    if (busy) return;
    const nextState = !saved;
    setSaved(nextState);
    setBusy(true);
    try {
      const serverSaved = await documentService.toggleBookmark(documentId);
      if (typeof serverSaved === 'boolean') {
        setSaved(serverSaved);
      }
    } catch (err: any) {
      setSaved(!nextState);
      toast.error(err?.message || 'Không thể lưu tài liệu. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={busy}
      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs md:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60 ${
        saved
          ? 'bg-[#F0F9FF] border-[#0284C7] text-[#0284C7]'
          : 'bg-white border-[#CBD5E1] text-[#334155] hover:bg-slate-50'
      }`}
      aria-label={saved ? 'Đã lưu tài liệu' : 'Lưu tài liệu'}
    >
      <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
      <span>{saved ? 'Đã lưu' : 'Lưu'}</span>
    </button>
  );
}
