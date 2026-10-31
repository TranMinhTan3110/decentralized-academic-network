import { describe, it, expect } from 'vitest';
import { filterDocuments } from '../../lib/domain';
import { mockTestDocuments } from '../fixtures/documents.fixture';

describe('domain filterDocuments function', () => {
  it('returns all documents when filters are empty', () => {
    const result = filterDocuments(mockTestDocuments, {});
    expect(result.length).toBe(mockTestDocuments.length);
  });

  it('filters documents by search query', () => {
    const result = filterDocuments(mockTestDocuments, { q: 'Python' });
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].title).toContain('Học Máy');
  });

  it('filters documents by school', () => {
    const result = filterDocuments(mockTestDocuments, { school: 'neu' });
    expect(result.every((d) => d.school === 'neu')).toBe(true);
  });

  it('filters documents by subject', () => {
    const result = filterDocuments(mockTestDocuments, { subject: 'cs' });
    expect(result.every((d) => d.subject === 'cs')).toBe(true);
  });

  it('filters documents by kind and year', () => {
    const result = filterDocuments(mockTestDocuments, { kind: 'Giáo trình', year: '2025' });
    expect(result.every((d) => d.kind === 'Giáo trình' && d.year === '2025')).toBe(true);
  });

  it('sorts documents correctly', () => {
    const result = filterDocuments(mockTestDocuments, { sort: 'title' });
    expect(result[0].title <= result[1].title).toBe(true);
  });
});
