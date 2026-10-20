import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from '../../pages/HomePage';
import { documentService } from '../../services/documentService';
import { mockTestDocuments } from '../fixtures/documents.fixture';

describe('HomePage Component Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(documentService, 'getFeed').mockImplementation(async (params?: any) => {
      const filter = params?.filter;
      const size = params?.size ?? 4;
      const filtered = mockTestDocuments.filter((doc) => {
        if (!filter || filter === 'for-you') return true;
        return doc.tabCategory === filter;
      });
      const paginated = filtered.slice(0, size);
      return {
        content: paginated,
        pageNumber: params?.page ?? 0,
        pageSize: size,
        totalElements: filtered.length,
        totalPages: Math.ceil(filtered.length / size) || 1,
        last: paginated.length >= filtered.length,
      } as any;
    });

    vi.spyOn(documentService, 'getTrending').mockImplementation(async (limit: number = 4) => {
      const trendingDocs = mockTestDocuments.filter((d) => d.tabCategory === 'trending');
      return trendingDocs.slice(0, limit) as any;
    });
  });

  const renderHomePage = () => {
    return render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
  };

  it('renders home intro section with correct headings and buttons', () => {
    renderHomePage();

    expect(screen.getByText('DÒNG CHIA SẺ HỌC TẬP')).toBeInTheDocument();
    expect(screen.getByText(/hôm nay.*học gì/i)).toBeInTheDocument();
    expect(screen.getByText('Khám phá tài liệu')).toBeInTheDocument();
    expect(screen.getAllByText('Chia sẻ tài liệu').length).toBeGreaterThan(0);
  });

  it('renders tab buttons and allows switching tabs', async () => {
    renderHomePage();

    const forYouTab = screen.getByRole('button', { name: /dành cho bạn/i });
    const followingTab = screen.getByRole('button', { name: /đang theo dõi/i });
    const trendingTab = screen.getByRole('button', { name: /đang thịnh hành/i });

    expect(forYouTab).toBeInTheDocument();
    expect(followingTab).toBeInTheDocument();
    expect(trendingTab).toBeInTheDocument();

    // Click on "Đang theo dõi" tab
    fireEvent.click(followingTab);
    await waitFor(() => {
      expect(screen.getAllByText('Tài Liệu Ôn Tập Xác Suất Thống Kê Dành Cho Kỹ Sư').length).toBeGreaterThan(0);
    });

    // Click on "Đang thịnh hành" tab
    fireEvent.click(trendingTab);
    await waitFor(() => {
      expect(screen.getAllByText('Giáo Trình Cấu Trúc Dữ Liệu & Giải Thuật (C++)').length).toBeGreaterThan(0);
    });
  });

  it('handles load more button click', async () => {
    renderHomePage();

    const loadMoreButton = await screen.findByRole('button', { name: /tải thêm bài viết/i });
    expect(loadMoreButton).toBeInTheDocument();

    fireEvent.click(loadMoreButton);
    // After load more, more items should be visible
    await waitFor(() => {
      expect(screen.getAllByText('Thiết Kế Hệ Thống Phân Tán (Distributed Systems Overview)').length).toBeGreaterThan(0);
    });
  });

  it('renders suggested users widget and toggles follow state', () => {
    renderHomePage();

    expect(screen.getByText('Gợi ý theo dõi')).toBeInTheDocument();
    expect(screen.getByText('PGS. TS Lê Hoài Nam')).toBeInTheDocument();

    const followButtons = screen.getAllByRole('button', { name: /theo dõi/i });
    expect(followButtons.length).toBeGreaterThan(0);

    // Click first follow button
    fireEvent.click(followButtons[0]);
    expect(screen.getByText('Đang theo dõi')).toBeInTheDocument();
  });

  it('renders quick links section', () => {
    renderHomePage();

    expect(screen.getByText('ĐI NHANH')).toBeInTheDocument();
    expect(screen.getAllByText('Recent').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Quiz').length).toBeGreaterThan(0);
  });

  it('fetches and displays real feed items from documentService.getFeed', async () => {
    vi.spyOn(documentService, 'getFeed').mockResolvedValue({
      content: [
        {
          id: 'doc-real-1',
          title: 'Tài liệu Kiến trúc Máy tính Nâng cao',
          courseName: 'Kiến trúc máy tính',
          documentType: 'Giáo trình',
          academicYear: '2026',
          pageCount: 150,
          likeCount: 42,
          commentCount: 5,
          author: {
            id: 'auth-1',
            name: 'TS. Nguyễn Văn A',
          },
        } as any,
      ],
      page: 0,
      size: 10,
      totalElements: 1,
      totalPages: 1,
      last: true,
    });

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText('Tài liệu Kiến trúc Máy tính Nâng cao')).toBeInTheDocument();
    });
  });
});
