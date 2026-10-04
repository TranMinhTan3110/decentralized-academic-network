import type { DocumentItem } from '../data/documents';

export interface Filters {
  q?: string;
  school?: string;
  subject?: string;
  kind?: string;
  year?: string;
  sort?: string;
}

export function filterDocuments(docs: DocumentItem[], filters: Filters): DocumentItem[] {
  let result = [...docs];

  if (filters.q) {
    const q = filters.q.toLowerCase().trim();
    result = result.filter(
      (doc) =>
        doc.title.toLowerCase().includes(q) ||
        doc.category.toLowerCase().includes(q) ||
        (doc.description?.toLowerCase().includes(q) ?? false) ||
        (doc.postText?.toLowerCase().includes(q) ?? false) ||
        (doc.tags?.some((t) => t.toLowerCase().includes(q)) ?? false)
    );
  }

  if (filters.school) {
    result = result.filter((doc) => doc.school === filters.school);
  }

  if (filters.subject) {
    result = result.filter((doc) => doc.subject === filters.subject || doc.category === filters.subject);
  }

  if (filters.kind) {
    result = result.filter((doc) => doc.kind === filters.kind);
  }

  if (filters.year) {
    result = result.filter((doc) => doc.year === filters.year);
  }

  if (filters.sort) {
    if (filters.sort === 'newest') {
      result.sort((a, b) => b.id.localeCompare(a.id));
    } else if (filters.sort === 'oldest') {
      result.sort((a, b) => a.id.localeCompare(b.id));
    } else if (filters.sort === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
    }
  }

  return result;
}

export function normalize(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .trim();
}
