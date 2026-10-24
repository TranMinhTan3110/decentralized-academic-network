import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LibraryPage } from '../../pages/LibraryPage/LibraryPage';
import { documentService } from '../../services/documentService';

describe('LibraryPage Component Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(documentService, 'getFeed').mockResolvedValue({
      content: [],
      pageNumber: 0,
      pageSize: 50,
      totalElements: 0,
      totalPages: 0,
      last: true,
    } as any);

    vi.spyOn(documentService, 'getMyBookmarks').mockResolvedValue({
      content: [],
      pageNumber: 0,
      pageSize: 50,
      totalElements: 0,
      totalPages: 0,
      last: true,
    } as any);

    vi.spyOn(documentService, 'getMyUnlockedDocuments').mockResolvedValue({
      content: [],
      pageNumber: 0,
      pageSize: 50,
      totalElements: 0,
      totalPages: 0,
      last: true,
    } as any);
  });

  it('renders LibraryPage headings, stats bar, tabs, and default empty state', async () => {
    render(
      <MemoryRouter initialEntries={['/library']}>
        <LibraryPage />
      </MemoryRouter>
    );

    expect(screen.getByText('KHÔNG GIAN CÁ NHÂN')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tài liệu đã đăng', level: 1 })).toBeInTheDocument();
    // Stats giờ tính từ dữ liệu API thật (không còn hardcode 1.2K/340/89) — 3 ô đều là 0 khi trống
    const zeroStats = screen.getAllByText('0');
    expect(zeroStats.length).toBeGreaterThanOrEqual(3);

    await waitFor(() => {
      expect(screen.getByText('Bạn chưa đăng tài liệu nào.')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Chia sẻ tài liệu ngay bây giờ/i })).toBeInTheDocument();
    });
  });

  it('allows switching between Đã đăng, Đã lưu, Đã mở khóa, and Đã xem tabs', () => {
    render(
      <MemoryRouter initialEntries={['/library']}>
        <LibraryPage />
      </MemoryRouter>
    );

    const savedTabBtn = screen.getByRole('button', { name: /Đã lưu/i, pressed: false });
    fireEvent.click(savedTabBtn);
    expect(screen.getByRole('button', { name: /Đã lưu/i, pressed: true })).toBeInTheDocument();

    const unlockedTabBtn = screen.getByRole('button', { name: /Đã mở khóa/i, pressed: false });
    fireEvent.click(unlockedTabBtn);
    expect(screen.getByRole('button', { name: /Đã mở khóa/i, pressed: true })).toBeInTheDocument();

    const historyTabBtn = screen.getByRole('button', { name: /Đã xem/i, pressed: false });
    fireEvent.click(historyTabBtn);
    expect(screen.getByRole('button', { name: /Đã xem/i, pressed: true })).toBeInTheDocument();
  });

  it('loads bookmarked documents from documentService.getMyBookmarks when tab is saved', async () => {
    vi.spyOn(documentService, 'getMyBookmarks').mockResolvedValue({
      content: [{ id: 'doc-saved-1', title: 'Tài liệu đã lưu mẫu' } as any],
      pageNumber: 0,
      pageSize: 10,
      totalElements: 1,
      totalPages: 1,
      last: true,
    });

    render(
      <MemoryRouter initialEntries={['/library?tab=saved']}>
        <LibraryPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Tài liệu đã lưu mẫu')[0]).toBeInTheDocument();
    });
  });

  it('loads unlocked documents from documentService.getMyUnlockedDocuments when tab is unlocked', async () => {
    vi.spyOn(documentService, 'getMyUnlockedDocuments').mockResolvedValue({
      content: [{ id: 'doc-unlocked-1', title: 'Tài liệu đã mở khóa VIP' } as any],
      pageNumber: 0,
      pageSize: 10,
      totalElements: 1,
      totalPages: 1,
      last: true,
    });

    render(
      <MemoryRouter initialEntries={['/library?tab=unlocked']}>
        <LibraryPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Tài liệu đã mở khóa VIP')[0]).toBeInTheDocument();
    });
  });

  it('loads uploaded documents from documentService.getFeed when tab is uploads', async () => {
    vi.spyOn(documentService, 'getFeed').mockResolvedValue({
      content: [{ id: 'doc-uploaded-1', title: 'Tài liệu tôi vừa tải lên' } as any],
      pageNumber: 0,
      pageSize: 10,
      totalElements: 1,
      totalPages: 1,
      last: true,
    });

    render(
      <MemoryRouter initialEntries={['/library?tab=uploads']}>
        <LibraryPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Tài liệu tôi vừa tải lên')[0]).toBeInTheDocument();
    });
  });
});
