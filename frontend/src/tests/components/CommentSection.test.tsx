import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CommentSection } from '../../components/comments/CommentSection';
import { documentService } from '../../services/documentService';

describe('CommentSection Component Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads and renders comments from documentService.getComments', async () => {
    vi.spyOn(documentService, 'getComments').mockResolvedValue({
      content: [
        {
          id: 'c-test-1',
          documentId: 'doc-123',
          content: 'Tài liệu giải thích rất dễ hiểu!',
          createdAt: new Date().toISOString(),
          likeCount: 5,
          author: { id: 'u1', fullName: 'Đức Minh' },
          replies: [],
        } as any,
      ],
      page: 0,
      size: 50,
      totalElements: 1,
      totalPages: 1,
      last: true,
    });

    render(
      <CommentSection
        documentId="doc-123"
        currentPage={2}
        isAuthenticated={true}
        currentUserId="u1"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Tài liệu giải thích rất dễ hiểu!')).toBeInTheDocument();
      expect(screen.getByText('Đức Minh')).toBeInTheDocument();
    });
  });

  it('submits a new comment via documentService.addComment', async () => {
    vi.spyOn(documentService, 'getComments').mockResolvedValue({
      content: [],
      page: 0,
      size: 50,
      totalElements: 0,
      totalPages: 0,
      last: true,
    });
    const addCommentSpy = vi.spyOn(documentService, 'addComment').mockResolvedValue({
      id: 'c-new',
      documentId: 'doc-123',
      content: 'Bình luận mới thêm',
      createdAt: new Date().toISOString(),
      likeCount: 0,
      author: { fullName: 'Bạn (Người dùng)' },
    } as any);

    render(
      <CommentSection
        documentId="doc-123"
        currentPage={1}
        isAuthenticated={true}
      />
    );

    const textarea = screen.getByPlaceholderText(/Chia sẻ ý kiến, thắc mắc hoặc ghi chú/i);
    fireEvent.change(textarea, { target: { value: 'Bình luận mới thêm' } });

    // Check tag page box
    const tagPageCheckbox = screen.getByLabelText(/Gắn thẻ Trang 2/i);
    fireEvent.click(tagPageCheckbox);

    const submitBtn = screen.getByRole('button', { name: /Gửi/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(addCommentSpy).toHaveBeenCalledWith('doc-123', 'Bình luận mới thêm', 2);
      expect(screen.getByText('Bình luận mới thêm')).toBeInTheDocument();
    });
  });
});
