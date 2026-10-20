import { useState, useCallback, useEffect } from 'react';

const savedDocIds = new Set<string>(['doc-1']);
const viewedDocIds = new Set<string>();
const listeners = new Set<() => void>();

let savedArrayCache: string[] = Array.from(savedDocIds);
let viewedArrayCache: string[] = Array.from(viewedDocIds);

const emitChange = () => {
  savedArrayCache = Array.from(savedDocIds);
  viewedArrayCache = Array.from(viewedDocIds);
  listeners.forEach((l) => l());
};

export function useLibrary() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const viewed = useCallback((id: string) => {
    if (!id) return;
    if (!viewedDocIds.has(id)) {
      viewedDocIds.add(id);
      emitChange();
    }
  }, []);

  const toggleSave = useCallback((id: string) => {
    if (savedDocIds.has(id)) {
      savedDocIds.delete(id);
    } else {
      savedDocIds.add(id);
    }
    emitChange();
  }, []);

  const isSaved = useCallback((id: string) => savedDocIds.has(id), []);

  return {
    viewed,
    toggleSave,
    isSaved,
    savedDocIds: savedArrayCache,
    saved: savedArrayCache,
    viewedDocIds: viewedArrayCache,
    history: viewedArrayCache,
  };
}

