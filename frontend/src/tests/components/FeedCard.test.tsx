import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FeedCard, FeedGrid } from '../../components/FeedCard';
import { documentService } from '../../services/documentService';
import { mockTestDocuments } from '../fixtures/documents.fixture';

describe('FeedCard & FeedGrid Components Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
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

