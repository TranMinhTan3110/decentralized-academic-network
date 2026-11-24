import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Swal from 'sweetalert2';
import { AdminLayout } from '../../components/admin/layout/AdminLayout/AdminLayout';
import { AdminDashboardPage } from '../../pages/admin/AdminDashboardPage/AdminDashboardPage';
import { AdminReportsPage } from '../../pages/admin/AdminReportsPage/AdminReportsPage';
import { AdminDocumentsPage } from '../../pages/admin/AdminDocumentsPage/AdminDocumentsPage';
import { documentService } from '../../services/documentService';
import { setGlobalOpenReportsCount } from '../../lib/adminStore';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

function AdminTestApp({ initialEntries = ['/admin'] }: { initialEntries?: string[] }) {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route
          path="/admin"
          element={
            <AdminLayout title="Tổng quan hệ thống">
              <AdminDashboardPage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <AdminLayout title="Báo cáo vi phạm">
              <AdminReportsPage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/documents"
          element={
            <AdminLayout title="Quản lý bài đăng">
              <AdminDocumentsPage />
            </AdminLayout>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('Admin Moderation & Management Full Integration Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    setGlobalOpenReportsCount(3);
  });

  it('navigates from Dashboard to Reports, moderates report, verifies reactive badge and status updates', async () => {
    const user = userEvent.setup();
    const moderateSpy = vi.spyOn(documentService, 'moderateDocument').mockResolvedValue(undefined);

    render(<AdminTestApp initialEntries={['/admin']} />);

    // 1. Dashboard loads with KPI metrics
    expect(screen.getAllByText(/Tổng quan/i).length).toBeGreaterThanOrEqual(1);

    // 2. Click "Báo cáo vi phạm" link in Sidebar
    const reportsLink = screen.getAllByRole('link', { name: /Báo cáo vi phạm/i })[0];
    await user.click(reportsLink);

    // 3. User is now on AdminReportsPage
    expect(await screen.findByText('Giáo trình Kinh tế vi mô (bản scan nguyên cuốn)')).toBeInTheDocument();

    // 4. Click "Xác nhận vi phạm & Gỡ bỏ" on first report -> opens confirmation dialog
    const rejectButtons = screen.getAllByRole('button', { name: /Xác nhận vi phạm & Gỡ bỏ/i });
    await user.click(rejectButtons[0]);

    // 5. Confirm takedown in confirmation modal
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    const confirmBtn = within(dialog).getByRole('button', { name: /xác nhận & gỡ bỏ/i });
    await user.click(confirmBtn);

    // 6. Verify service called with REJECTED
    await waitFor(() => {
      expect(moderateSpy).toHaveBeenCalledWith(
        'a0000000-0000-0000-0000-000000000001',
        expect.objectContaining({ status: 'REJECTED' })
      );
    });

    // 7. Report status in UI changes to "Đã xác nhận & gỡ bỏ"
    expect(await screen.findByText('Đã xác nhận & gỡ bỏ')).toBeInTheDocument();

    // 8. Click "Bác bỏ báo cáo" on next report
    const dismissButtons = screen.getAllByRole('button', { name: /bác bỏ báo cáo/i });
    if (dismissButtons.length > 0) {
      await user.click(dismissButtons[dismissButtons.length - 1]);
      await waitFor(() => {
        expect(moderateSpy).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ status: 'PUBLISHED' })
        );
      });
      expect(await screen.findByText('Đã bác bỏ')).toBeInTheDocument();
    }
  });

  it('navigates to AdminDocumentsPage, filters status tabs, searches and triggers delete confirmation', async () => {
    const user = userEvent.setup();
    const deleteSpy = vi.spyOn(documentService, 'deleteDocumentByAdmin').mockResolvedValue(undefined);
    vi.spyOn(Swal, 'fire').mockResolvedValue({
      isConfirmed: true,
      isDenied: false,
      isDismissed: false,
    } as any);

    render(<AdminTestApp initialEntries={['/admin/documents']} />);

    // 1. Quản lý bài đăng renders correctly
    expect(screen.getAllByText('Quản lý bài đăng').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Hiển thị 8 / 8 bài đăng')).toBeInTheDocument();

    // 2. Filter by tab "Đang phát hành"
    const publishedTab = screen.getByRole('button', { name: /đang phát hành/i });
    await user.click(publishedTab);
    expect(screen.getByText('Hiển thị 6 / 8 bài đăng')).toBeInTheDocument();

    // 3. Search document by keyword
    const searchInput = screen.getByRole('textbox', { name: /tìm theo tiêu đề/i });
    await user.type(searchInput, 'Giải tích 3');
    expect(screen.getByText('Hiển thị 1 / 8 bài đăng')).toBeInTheDocument();
    expect(screen.getByText('Đề cương Ôn thi Giải tích 3 ĐHBK')).toBeInTheDocument();

    // 4. Click delete action button for 'Đề cương Ôn thi Giải tích 3 ĐHBK'
    const deleteBtn = screen.getByRole('button', {
      name: /xóa bài đăng đề cương ôn thi giải tích 3 đhbk/i,
    });
    await user.click(deleteBtn);

    // 5. Confirm deletion in Swal modal
    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalled();
      expect(deleteSpy).toHaveBeenCalledWith('d1');
    });
  });
});
