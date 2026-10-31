import type { DocumentItem } from '../../../data/documents';
import { DocumentCard } from '../DocumentCard';

interface DocumentGridProps {
  items: DocumentItem[];
  cols?: 2 | 3 | 4;
  className?: string;
}

export function DocumentGrid({ items, cols, className }: DocumentGridProps) {
  const gridColsClass =
    cols === 4
      ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
      : cols === 3
      ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
      : 'grid-cols-1 md:grid-cols-2';

  return (
    <div className={`grid ${gridColsClass} gap-4 my-4 ${className || ''}`}>
      {items.map((doc) => (
        <DocumentCard key={doc.id} document={doc} />
      ))}
    </div>
  );
}
