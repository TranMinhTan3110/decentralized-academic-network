import { Bookmark } from 'lucide-react';
import { useLibrary } from '../../lib/store';

export interface SaveButtonProps {
  documentId: string;
}

export function SaveButton({ documentId }: SaveButtonProps) {
  const { isSaved, toggleSave } = useLibrary();
  const saved = isSaved(documentId);

  return (
    <button
      onClick={() => toggleSave(documentId)}
      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs md:text-sm font-semibold transition-colors cursor-pointer ${
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
