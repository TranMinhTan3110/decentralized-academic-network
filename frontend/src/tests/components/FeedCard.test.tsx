import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FeedCard, FeedGrid } from '../../components/FeedCard';
import { documentService } from '../../services/documentService';
import * as recommendationService from '../../services/recommendationService';
import { mockTestDocuments } from '../fixtures/documents.fixture';

describe('FeedCard & FeedGrid Components Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders first-page thumbnail image when thumbnailUrl is provided', () => {
    const doc = { ...mockTestDocuments[0], thumbnailUrl: 'http://localhost:8080/ipfs/bafy-thumb' };
    render(
      <MemoryRouter>
        <FeedCard document={doc as any} />
      </MemoryRouter>
    );

    const img = screen.getByRole('img', { name: /trang đầu tiên/i });
    expect(img).toHaveAttribute('src', 'http://localhost:8080/ipfs/bafy-thumb');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('drops AI items that do not resolve to real documents and falls back to DB feed', async () => {
    vi.spyOn(recommendationService, 'fetchPersonalRecommendations').mockResolvedValue({
      items: [
        {
          document_id: '11111111-1111-1111-1111-111111111111',
          title: 'Tài liệu thịnh hành #1',
          score: 3.7,
          reason: 'Cold-start fake',
        },
      ],
    } as any);
    // getDetail 404 cho id giả
    vi.spyOn(documentService, 'getDetail').mockRejectedValue(new Error('not found'));
    // DB feed có tài liệu thật
    vi.spyOn(documentService, 'getFeed').mockResolvedValue({
      content: mockTestDocuments.slice(0, 2) as any,
      pageNumber: 0, pageSize: 4, totalElements: 2, totalPages: 1, last: true,
    });

    render(
      <MemoryRouter>
        <FeedGrid activeTab="for-you" limit={4} page={0} />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Card giả bị loại — không còn tên mẫu nào
      expect(screen.queryByText('Tài liệu thịnh hành #1')).not.toBeInTheDocument();
      // Feed thật từ DB hiển thị thay thế
      expect(screen.getByText(mockTestDocuments[0].title)).toBeInTheDocument();
    });
  });

  it('replaces AI sample metadata with real document data when id resolves', async () => {
    // AI trả item với title template; getDetail trả tài liệu thật có tên + thumbnail khác
    vi.spyOn(recommendationService, 'fetchPersonalRecommendations').mockResolvedValue({
      items: [
        {
          document_id: '77777777-7777-7777-7777-000000000001',
          title: 'Tài liệu thịnh hành #1',
          score: 3.7,
          reason: 'Thịnh hành với 4 lượt tương tác học thuật',
        },
      ],
    } as any);
    vi.spyOn(documentService, 'getDetail').mockResolvedValue({
      id: '77777777-7777-7777-7777-000000000001',
      title: 'Bài giảng Lập trình hướng đối tượng (Java & C++)',
      docType: 'SLIDE',
      courseName: 'Lập trình hướng đối tượng',
      universityName: 'Học viện Công nghệ Bưu chính Viễn thông',
      academicYear: '2024-2025',
      totalPages: 50,
      thumbnailUrl: 'http://localhost:8080/ipfs/QmRealThumb',
      author: { id: 'u-1', fullName: 'Trần Minh Tấn', avatarUrl: 'http://avatar/mt.png' },
    } as any);
    vi.spyOn(documentService, 'getFeed').mockResolvedValue({
      content: [], pageNumber: 0, pageSize: 4, totalElements: 0, totalPages: 0, last: true,
    });

    render(
      <MemoryRouter>
        <FeedGrid activeTab="for-you" limit={4} page={0} />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Tên thật đè tên mẫu
      expect(screen.getByText('Bài giảng Lập trình hướng đối tượng (Java & C++)')).toBeInTheDocument();
      // Ảnh thật được gắn
      expect(screen.getByRole('img', { name: /trang đầu tiên/i })).toHaveAttribute(
        'src', 'http://localhost:8080/ipfs/QmRealThumb'
      );
    });
    // Tên mẫu không còn đâu
    expect(screen.queryByText('Cấu Trúc Dữ Liệu và Giải Thuật (Nâng Cao)')).not.toBeInTheDocument();
  });

  it('falls back to the blue icon box when thumbnailUrl is missing', () => {
    const doc = { ...mockTestDocuments[0], thumbnailUrl: null };
    const renderResults = render(
      <MemoryRouter>
        <FeedCard document={doc as any} />
      </MemoryRouter>
    );

    expect(screen.queryByRole('img', { name: /trang đầu tiên/i })).not.toBeInTheDocument();
    // Fallback box giữ đúng layout cũ: ô vuông màu với nhãn loại tài liệu
    expect(screen.getByText(/trang$/i)).toBeInTheDocument();
    const { container } = renderResults;
    expect(container.querySelector('[class*="bg-[#0284c7]"]')).not.toBeNull();
  });

  it('renders FeedCard with document title, author, and engagement metrics', () => {
    const doc = mockTestDocuments[0];
    render(
      <MemoryRouter>
        <FeedCard document={doc} />
      </MemoryRouter>
    );

    expect(screen.getByText(doc.title)).toBeInTheDocument();
    expect(screen.getByText(doc.author.name)).toBeInTheDocument();
    expect(screen.getByText(doc.description!)).toBeInTheDocument();
  });

  it('renders FeedGrid and fetches feed items without re-render loop', async () => {
    // FeedGrid thử recommendation-service trước; trả rỗng để rơi về documentService.getFeed
    // (mock bắt buộc vì AI service có thể đang chạy thật ở 127.0.0.1:8000 trên máy dev)
    vi.spyOn(recommendationService, 'fetchPersonalRecommendations').mockResolvedValue({ items: [] } as any);
    vi.spyOn(documentService, 'getDetail').mockRejectedValue(new Error('not found'));
    vi.spyOn(documentService, 'getFeed').mockResolvedValue({
      content: mockTestDocuments.slice(0, 2) as any,
      pageNumber: 0,
      pageSize: 4,
      totalElements: 2,
      totalPages: 1,
      last: true,
    });

    const onDataLoaded = vi.fn();

    const { rerender } = render(
      <MemoryRouter>
        <FeedGrid activeTab="for-you" limit={4} onDataLoaded={onDataLoaded} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(mockTestDocuments[0].title)).toBeInTheDocument();
      expect(screen.getByText(mockTestDocuments[1].title)).toBeInTheDocument();
    });

    expect(onDataLoaded).toHaveBeenCalledWith({ last: true, totalElements: 2 });

    // Verify rerendering does not trigger re-fetch loops
    rerender(
      <MemoryRouter>
        <FeedGrid activeTab="for-you" limit={4} onDataLoaded={onDataLoaded} />
      </MemoryRouter>
    );

    expect(screen.getByText(mockTestDocuments[0].title)).toBeInTheDocument();
  });

  it('correctly initializes liked state from hasLiked and updates likesCount', async () => {
    const docWithLike = {
      ...mockTestDocuments[0],
      likeCount: 15,
      hasLiked: true,
      hasBookmarked: false,
    };

    vi.spyOn(documentService, 'toggleLike').mockResolvedValue(false);

    render(
      <MemoryRouter>
        <FeedCard document={docWithLike} />
      </MemoryRouter>
    );

    expect(screen.getByText('15')).toBeInTheDocument();

    const likeButton = screen.getByRole('button', { name: /Thả tim bài viết/i });
    expect(likeButton).toHaveClass('text-[#EF4444]');
  });

  it('syncs liked and likesCount when document prop updates across accounts', () => {
    const docAccountA = {
      ...mockTestDocuments[0],
      likeCount: 5,
      hasLiked: false,
    };

    const { rerender } = render(
      <MemoryRouter>
        <FeedCard document={docAccountA} />
      </MemoryRouter>
    );

    expect(screen.getByText('5')).toBeInTheDocument();

    // Switch account: Account B has liked and count is 6
    const docAccountB = {
      ...mockTestDocuments[0],
      likeCount: 6,
      hasLiked: true,
    };

    rerender(
      <MemoryRouter>
        <FeedCard document={docAccountB} />
      </MemoryRouter>
    );

    expect(screen.getByText('6')).toBeInTheDocument();
    const likeButton = screen.getByRole('button', { name: /Thả tim bài viết/i });
    expect(likeButton).toHaveClass('text-[#EF4444]');
  });
});

