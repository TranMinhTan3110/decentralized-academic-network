import type { ReactNode } from 'react';
import { FileQuestion } from 'lucide-react';
import type { DocumentItem } from '../../../data/documents';
import { DocumentCard } from '../DocumentCard';

export interface EmptyStateProps {
  title: string;
  description: string;
  children?: ReactNode;
}

export function EmptyState({ title, description, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-dashed border-[#CBD5E1] my-6">
      <div className="w-12 h-12 rounded-full bg-[#F0F9FF] flex items-center justify-center text-[#0284C7] mb-4">
        <FileQuestion size={24} />
      </div>
      <h3 className="text-lg font-bold text-[#0F172A] mb-2">{title}</h3>
      <p className="text-sm text-[#64748B] max-w-md mb-6">{description}</p>
      {children}
    </div>
  );
}

export interface DocumentListProps {
  items: DocumentItem[];
}

export function DocumentList({ items }: DocumentListProps) {
  if (items.length === 0) {
    return <EmptyState title="Không có tài liệu" description="Danh sách hiện đang trống." />;
  }

  return (
    <div className="flex flex-col gap-4 my-6">
      {items.map((doc) => (
        <DocumentCard key={doc.id} document={doc} />
      ))}
    </div>
  );
}
