import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLibrary } from '../../lib/store';
import { useSocial } from '../../lib/socialStore';

describe('useLibrary store stability & update depth protection', () => {
  it('returns stable array references across re-renders when data does not change', () => {
    const { result, rerender } = renderHook(() => useLibrary());

    const firstHistory = result.current.history;
    const firstSaved = result.current.saved;

    rerender();

    // Must be strictly identical references to prevent useEffect infinite loops
    expect(result.current.history).toBe(firstHistory);
    expect(result.current.saved).toBe(firstSaved);
  });

  it('updates references when items are added and maintains stability after', () => {
    const { result, rerender } = renderHook(() => useLibrary());

    const initialHistory = result.current.history;

    act(() => {
      result.current.viewed('doc-test-100');
    });

    expect(result.current.history).toContain('doc-test-100');
    expect(result.current.history).not.toBe(initialHistory);

    const updatedHistory = result.current.history;
    rerender();
    expect(result.current.history).toBe(updatedHistory);
  });

  it('does not re-emit change if document was already marked viewed', () => {
    const { result } = renderHook(() => useLibrary());

    act(() => {
      result.current.viewed('doc-duplicate-test');
    });

    const historyRef = result.current.history;

    act(() => {
      result.current.viewed('doc-duplicate-test');
    });

    // Reference should remain identical because no change occurred
    expect(result.current.history).toBe(historyRef);
  });
});

describe('useSocial store stability', () => {
  it('returns stable uploadedDocumentIds array reference across re-renders', () => {
    const { result, rerender } = renderHook(() => useSocial());

    const firstUploaded = result.current.uploadedDocumentIds;
    rerender();
    expect(result.current.uploadedDocumentIds).toBe(firstUploaded);
  });
});
