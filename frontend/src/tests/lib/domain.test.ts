import { describe, it, expect } from 'vitest';
import { filterDocuments } from '../../lib/domain';
import { documents } from '../../data/documents';

describe('domain filterDocuments function', () => {
  it('returns all documents when filters are empty', () => {
    const result = filterDocuments(documents, {});
    expect(result.length).toBe(documents.length);
  });

  it('filters documents by search query', () => {
    const result = filterDocuments(documents, { q: 'Python' });
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].title).toContain('Học Máy');
  });

  it('filters documents by school', () => {
    const result = filterDocuments(documents, { school: 'neu' });
    expect(result.every((d) => d.school === 'neu')).toBe(true);
  });

  it('filters documents by subject', () => {
    const result = filterDocuments(documents, { subject: 'cs' });
    expect(result.every((d) => d.subject === 'cs')).toBe(true);
  });

  it('filters documents by kind and year', () => {
    const result = filterDocuments(documents, { kind: 'Giáo trình', year: '2025' });
    expect(result.every((d) => d.kind === 'Giáo trình' && d.year === '2025')).toBe(true);
  });

  it('sorts documents correctly', () => {
    const result = filterDocuments(documents, { sort: 'title' });
    expect(result[0].title <= result[1].title).toBe(true);
  });
});
