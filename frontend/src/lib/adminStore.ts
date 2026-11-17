// ADMIN STORE - Centralized state management for Admin layout & moderation badges
// Automatically keeps report count synchronized across all admin pages and tabs


import { useState, useEffect } from 'react';
import { documentService } from '../services/documentService';

const REPORTS_COUNT_STORAGE_KEY = 'dedocu_open_reports_count';
const RESOLVED_REPORTS_STORAGE_KEY = 'dedocu_resolved_report_ids';

// Read initial cached count from localStorage if available
const getStoredCount = (): number | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(REPORTS_COUNT_STORAGE_KEY);
    if (raw !== null && !isNaN(Number(raw))) {
      return Number(raw);
    }
  } catch {
    // Ignore storage errors
  }
  return null;
};

let globalOpenReportsCount: number | null = getStoredCount();
const reportListeners = new Set<() => void>();

export const getGlobalOpenReportsCount = (): number | null => {
  if (globalOpenReportsCount !== null) return globalOpenReportsCount;
  return getStoredCount();
};

export const setGlobalOpenReportsCount = (count: number) => {
  globalOpenReportsCount = count;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(REPORTS_COUNT_STORAGE_KEY, count.toString());
    } catch {
      // ignore storage quota errors
    }
  }
  reportListeners.forEach((fn) => fn());
};

export const getResolvedReportIds = (): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(RESOLVED_REPORTS_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set(arr);
      }
    }
  } catch {
    // Ignore storage parse errors
  }
  return new Set();
};

export const markReportResolved = (reportId: string, docId?: string) => {
  if (typeof window === 'undefined') return;
  try {
    const current = getResolvedReportIds();
    current.add(reportId);
    if (docId) current.add(docId);
    window.localStorage.setItem(RESOLVED_REPORTS_STORAGE_KEY, JSON.stringify(Array.from(current)));
  } catch {
    // Ignore storage errors
  }
};

/**
 * Hook used by AdminLayout and pages to access and synchronize open reports count.
 */
export function useAdminReportsCount(propCount?: number): number {
  const [count, setCount] = useState<number>(() => {
    if (propCount !== undefined) {
      return propCount;
    }
    return getGlobalOpenReportsCount() ?? 3;
  });

  useEffect(() => {
    if (propCount !== undefined) {
      setCount(propCount);
    }
  }, [propCount]);

  useEffect(() => {
    const listener = () => {
      const current = getGlobalOpenReportsCount();
      if (current !== null) {
        setCount(current);
      }
    };
    reportListeners.add(listener);

    if (propCount === undefined) {
      const current = getGlobalOpenReportsCount();
      if (current !== null) {
        setCount(current);
      } else if (process.env.NODE_ENV !== 'test') {
        documentService
          .getAdminReports()
          .then((reports) => {
            if (Array.isArray(reports)) {
              const resolvedSet = getResolvedReportIds();
              const pending = reports.filter(
                (r) =>
                  (r.status === 'PENDING' || r.status === 'OPEN') &&
                  !resolvedSet.has(r.id) &&
                  !resolvedSet.has(r.documentId)
              ).length;
              setGlobalOpenReportsCount(pending);
            }
          })
          .catch(() => {});
      }
    }

    return () => {
      reportListeners.delete(listener);
    };
  }, [propCount]);

  return count;
}
