import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Discover } from '../../pages/Discover';
import { documentService } from '../../services/documentService';
import { mockTestDocuments } from '../fixtures/documents.fixture';

describe('Discover Page Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(documentService, 'getFeed').mockImplementation(async () => {
      return {
        content: mockTestDocuments,
        page: 0,
        size: 20,
        totalElements: mockTestDocuments.length,
        totalPages: 1,
        last: true,
      } as any;
    });

    vi.spyOn(documentService, 'search').mockImplementation(async (q: string) => {
      const lower = q.toLowerCase();
      const matched = mockTestDocuments.filter(
        (d) =>
          d.title.toLowerCase().includes(lower) ||
          d.description.toLowerCase().includes(lower) ||
          d.tags.some((t) => t.toLowerCase().includes(lower))
      );
      return {
        content: matched,
        page: 0,
        size: 20,
        totalElements: matched.length,
        totalPages: 1,
        last: true,
      } as any;
    });
  });

  const renderDiscover = (initialEntries = ['/explore']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <Discover />
      </MemoryRouter>
    );
  };

  it('renders heading, search input, subject shortcut buttons and school index', () => {
    renderDiscover();

    expect(screen.getByText('Hôm nay, bạn học gì?')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Tên tài liệu, môn học hoặc trường/i)
    ).toBeInTheDocument();
    expect(screen.getByText('ĐI THẲNG ĐẾN')).toBeInTheDocument();
    expect(screen.getByText('Theo trường')).toBeInTheDocument();
  });

  it('allows searching for documents', async () => {
    renderDiscover();

    const searchInput = screen.getByPlaceholderText(
      /Tên tài liệu, môn học hoặc trường/i
    );
    fireEvent.change(searchInput, { target: { value: 'Python' } });

    const searchButton = screen.getByRole('button', { name: /tìm kiếm/i });
    fireEvent.submit(searchButton.closest('form')!);

    await waitFor(() => {
      expect(
        screen.getAllByText('Giải Thuật Học Máy & Ứng Dụng Trong Phân Tích Dữ Liệu Lớn').length
      ).toBeGreaterThan(0);
    });
  });

  it('toggles extra filters section when clicking filter button', () => {
    renderDiscover();

    const filterBtn = screen.getByRole('button', { name: /bộ lọc/i });
    expect(screen.queryByText('Loại tài liệu')).not.toBeInTheDocument();

    fireEvent.click(filterBtn);
    expect(screen.getByText('Loại tài liệu')).toBeInTheDocument();
  });

  it('shows empty state when no documents match filters', async () => {
    renderDiscover();

    const searchInput = screen.getByPlaceholderText(
      /Tên tài liệu, môn học hoặc trường/i
    );
    fireEvent.change(searchInput, { target: { value: 'XYZ123NonExistent' } });
    fireEvent.submit(searchInput.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Chưa tìm thấy tài liệu phù hợp')).toBeInTheDocument();
    });
  });

  it('calls documentService.search when user submits search query and renders real search results', async () => {
    const searchSpy = vi.spyOn(documentService, 'search').mockResolvedValue({
      content: [
        {
          id: 'doc-search-dijkstra',
          title: 'Thuật toán Dijkstra và Đồ thị nâng cao',
          author: { name: 'TS. Nguyễn Văn A' },
          courseName: 'Cấu trúc dữ liệu',
          academicYear: '2026',
          pageCount: 45,
        } as any,
      ],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
      last: true,
    });

    renderDiscover();

    const searchInput = screen.getByPlaceholderText(/Tên tài liệu, môn học hoặc trường/i);
    fireEvent.change(searchInput, { target: { value: 'Dijkstra' } });
    fireEvent.submit(searchInput.closest('form')!);

    await waitFor(() => {
      expect(searchSpy).toHaveBeenCalledWith('Dijkstra', 0, 20);
      expect(screen.getAllByText('Thuật toán Dijkstra và Đồ thị nâng cao')[0]).toBeInTheDocument();
    });
  });
});
