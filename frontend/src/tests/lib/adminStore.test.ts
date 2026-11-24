import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  getGlobalOpenReportsCount,
  setGlobalOpenReportsCount,
  getConfirmedReportIds,
  getDismissedReportIds,
  getRejectedDocIds,
  getResolvedReportIds,
  markReportConfirmed,
  markReportDismissed,
  markReportResolved,
  useAdminReportsCount,
} from '../../lib/adminStore';

describe('adminStore Unit Tests', () => {
  beforeEach(() => {
    window.localStorage.clear();
    setGlobalOpenReportsCount(3);
  });

  describe('Report Count Store & Synchronization', () => {
    it('sets and gets global open reports count correctly', () => {
      setGlobalOpenReportsCount(5);
      expect(getGlobalOpenReportsCount()).toBe(5);
      expect(window.localStorage.getItem('dedocu_open_reports_count')).toBe('5');
    });

    it('synchronizes hook state when global count changes', () => {
      const { result } = renderHook(() => useAdminReportsCount());
      expect(result.current).toBe(3);

      act(() => {
        setGlobalOpenReportsCount(2);
      });

      expect(result.current).toBe(2);
    });

    it('respects propCount when provided over global store', () => {
      const { result, rerender } = renderHook(({ propCount }) => useAdminReportsCount(propCount), {
        initialProps: { propCount: 7 },
      });

      expect(result.current).toBe(7);

      rerender({ propCount: 4 });
      expect(result.current).toBe(4);
    });
  });

  describe('Report Resolution & Moderation State Management', () => {
    it('marks report as confirmed and persists rejected document id', () => {
      markReportConfirmed('rep-001', 'doc-001');

      const confirmed = getConfirmedReportIds();
      expect(confirmed.has('rep-001')).toBe(true);

      const rejectedDocs = getRejectedDocIds();
      expect(rejectedDocs.has('doc-001')).toBe(true);

      const resolved = getResolvedReportIds();
      expect(resolved.has('rep-001')).toBe(true);
    });

    it('marks report as dismissed and removes from confirmed if previously confirmed', () => {
      markReportConfirmed('rep-002');
      expect(getConfirmedReportIds().has('rep-002')).toBe(true);

      markReportDismissed('rep-002');
      expect(getDismissedReportIds().has('rep-002')).toBe(true);
      expect(getConfirmedReportIds().has('rep-002')).toBe(false);

      const resolved = getResolvedReportIds();
      expect(resolved.has('rep-002')).toBe(true);
    });

    it('markReportResolved is backward compatible alias for markReportConfirmed', () => {
      markReportResolved('rep-legacy', 'doc-legacy');

      expect(getConfirmedReportIds().has('rep-legacy')).toBe(true);
      expect(getRejectedDocIds().has('doc-legacy')).toBe(true);
      expect(getResolvedReportIds().has('rep-legacy')).toBe(true);
    });
  });
});
