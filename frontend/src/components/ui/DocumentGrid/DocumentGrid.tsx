import type { DocumentItem } from '../../../data/documents';
import { DocumentCard } from '../DocumentCard';

interface DocumentGridProps {
  items: DocumentItem[];
}

export function DocumentGrid({ items }: DocumentGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-6">
      {items.map((doc) => (
        <DocumentCard key={doc.id} document={doc} />
      ))}
    </div>
  );
}
