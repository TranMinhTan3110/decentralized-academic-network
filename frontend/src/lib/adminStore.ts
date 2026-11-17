// ADMIN STORE - Centralized state management for Admin layout & moderation badges
// Automatically keeps report count synchronized across all admin pages and tabs


import { useState, useEffect } from 'react';
import { documentService } from '../services/documentService';

const REPORTS_COUNT_STORAGE_KEY = 'dedocu_open_reports_count';
const RESOLVED_REPORTS_STORAGE_KEY = 'dedocu_resolved_report_ids';
const CONFIRMED_REPORTS_STORAGE_KEY = 'dedocu_confirmed_report_ids';
const DISMISSED_REPORTS_STORAGE_KEY = 'dedocu_dismissed_report_ids';
const REJECTED_DOCS_STORAGE_KEY = 'dedocu_rejected_doc_ids';

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

const getStoredSet = (key: string): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(key);
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

const saveStoredSet = (key: string, set: Set<string>) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch {
    // Ignore storage errors
  }
};

export const getConfirmedReportIds = (): Set<string> => getStoredSet(CONFIRMED_REPORTS_STORAGE_KEY);
export const getDismissedReportIds = (): Set<string> => getStoredSet(DISMISSED_REPORTS_STORAGE_KEY);
export const getRejectedDocIds = (): Set<string> => getStoredSet(REJECTED_DOCS_STORAGE_KEY);

export const getResolvedReportIds = (): Set<string> => {
  const confirmed = getConfirmedReportIds();
  const dismissed = getDismissedReportIds();
  const legacy = getStoredSet(RESOLVED_REPORTS_STORAGE_KEY);
  return new Set([...confirmed, ...dismissed, ...legacy]);
};

export const markReportConfirmed = (reportId: string, docId?: string) => {
  const confirmed = getConfirmedReportIds();
  confirmed.add(reportId);
  saveStoredSet(CONFIRMED_REPORTS_STORAGE_KEY, confirmed);

  if (docId) {
    const rejectedDocs = getRejectedDocIds();
    rejectedDocs.add(docId);
    saveStoredSet(REJECTED_DOCS_STORAGE_KEY, rejectedDocs);
  }

  // Also remove from dismissed if previously dismissed
  const dismissed = getDismissedReportIds();
  if (dismissed.has(reportId)) {
    dismissed.delete(reportId);
    saveStoredSet(DISMISSED_REPORTS_STORAGE_KEY, dismissed);
  }
};

export const markReportDismissed = (reportId: string) => {
  const dismissed = getDismissedReportIds();
  dismissed.add(reportId);
  saveStoredSet(DISMISSED_REPORTS_STORAGE_KEY, dismissed);

  // Also remove from confirmed if previously confirmed
  const confirmed = getConfirmedReportIds();
  if (confirmed.has(reportId)) {
    confirmed.delete(reportId);
    saveStoredSet(CONFIRMED_REPORTS_STORAGE_KEY, confirmed);
  }
};

export const markReportResolved = (reportId: string, docId?: string) => {
  markReportConfirmed(reportId, docId);
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
