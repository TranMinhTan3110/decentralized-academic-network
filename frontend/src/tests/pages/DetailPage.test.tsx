import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { DetailPage } from '../../pages/Detail/DetailPage';
import { Detail } from '../../pages/Detail/Detail';
import { documentService } from '../../services/documentService';
import { authService } from '../../services/authService';
import { mockTestDocuments } from '../fixtures/documents.fixture';

describe('DetailPage Component Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(documentService, 'getDetail').mockImplementation(async (id: string) => {
      if (id === 'not-found') return null as any;
      const fixture = mockTestDocuments.find((d) => d.id === id) || mockTestDocuments[0];
      return {
        id: fixture.id,
        title: fixture.title,
        universityName: 'Đại học Kinh tế Quốc dân',
        courseName: fixture.category,
        documentType: fixture.kind,
        academicYear: fixture.year,
        likeCount: fixture.likes,
        totalPages: 2,
        freePages: 2,
        unlockPointsRequired: 10,
        isBlurLocked: false,
        hasUnlocked: true,
        author: { fullName: fixture.author.name, role: fixture.author.role },
        description: fixture.description,
        pages: [
          { heading: '01. Khái niệm cung cầu', paragraphs: ['Nội dung trang 1'] },
          { heading: '02. Cân bằng thị trường', paragraphs: ['Nội dung trang 2'] },
        ],
      } as any;
    });

    vi.spyOn(documentService, 'getComments').mockImplementation(async (id: string) => {
      return {
        content: [
          {
            id: 'c-1',
            documentId: id,
            content: 'Tài liệu xịn quá, phần ví dụ rất dễ hiểu luôn.',
            likeCount: 5,
            author: { fullName: 'Minh Anh' },
            createdAt: new Date().toISOString(),
          },
        ],
        page: 0,
        size: 10,
        totalElements: 1,
        totalPages: 1,
        last: true,
      } as any;
    });

    vi.spyOn(documentService, 'recordView').mockResolvedValue();
    vi.spyOn(documentService, 'checkUnlockStatus').mockResolvedValue({
      documentId: 'doc-1',
      hasUnlocked: true,
      unlockPointsRequired: 0,
    });
  });

  it('displays EmptyState when document is not found (404 / null)', async () => {
    vi.spyOn(documentService, 'getDetail').mockResolvedValue(null as any);

    render(
      <MemoryRouter initialEntries={['/detail/not-found']}>
        <Routes>
          <Route path="/detail/:id" element={<Detail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Không tìm thấy tài liệu')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Quay lại khám phá/i })).toBeInTheDocument();
    });
  });

  it('renders document title, author, and description correctly', async () => {
    render(
      <MemoryRouter initialEntries={['/detail/doc-1']}>
        <Routes>
          <Route path="/detail/:id" element={<DetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Cung, cầu và cân bằng thị trường')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Lan Chi')[0]).toBeInTheDocument();
      expect(screen.getByText('Về tài liệu này')).toBeInTheDocument();
    });
  });

  it('handles page navigation (Trước / Tiếp buttons)', async () => {
    render(
      <MemoryRouter initialEntries={['/detail/doc-1']}>
        <Routes>
          <Route path="/detail/:id" element={<Detail />} />
        </Routes>
      </MemoryRouter>
    );

    const prevButton = await screen.findByRole('button', { name: /Trước/i });
    const nextButton = screen.getByRole('button', { name: /Tiếp/i });

    expect(prevButton).toBeDisabled();
    expect(nextButton).not.toBeDisabled();

    fireEvent.click(nextButton);

    expect(screen.getAllByText(/Trang 2 \/ 2/i)[0]).toBeInTheDocument();
    expect(nextButton).toBeDisabled();
    expect(prevButton).not.toBeDisabled();

    fireEvent.click(prevButton);
    expect(screen.getAllByText(/Trang 1 \/ 2/i)[0]).toBeInTheDocument();
  });

  it('handles font zoom controls (Giảm / Tăng cỡ chữ)', async () => {
    render(
      <MemoryRouter initialEntries={['/detail/doc-1']}>
        <Routes>
          <Route path="/detail/:id" element={<Detail />} />
        </Routes>
      </MemoryRouter>
    );

    const zoomIn = await screen.findByRole('button', { name: /Tăng cỡ chữ/i });
    const zoomOut = screen.getByRole('button', { name: /Giảm cỡ chữ/i });

    expect(screen.getByText('100%')).toBeInTheDocument();

    fireEvent.click(zoomIn);
    expect(screen.getByText('115%')).toBeInTheDocument();

    fireEvent.click(zoomOut);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('renders comments and download action button', async () => {
    render(
      <MemoryRouter initialEntries={['/detail/doc-1']}>
        <Routes>
          <Route path="/detail/:id" element={<Detail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Bình luận \(1\)/i)[0]).toBeInTheDocument();
      expect(screen.getByText('Minh Anh')).toBeInTheDocument();
      expect(screen.getByText('Tải bản mẫu HTML')).toBeInTheDocument();
      expect(screen.getByText('Tạo Quiz từ tài liệu này')).toBeInTheDocument();
    });
  });

  it('fetches document detail and records view via documentService', async () => {
    const detailSpy = vi.spyOn(documentService, 'getDetail').mockResolvedValue({
      id: 'doc-live-test',
      title: 'Kinh tế lượng nâng cao K66',
      totalPages: 10,
      freePages: 2,
      unlockPointsRequired: 15,
      isBlurLocked: true,
      hasUnlocked: false,
      author: { fullName: 'PGS. TS Lê Hoài Nam' },
    } as any);
    const viewSpy = vi.spyOn(documentService, 'recordView').mockResolvedValue();

    render(
      <MemoryRouter initialEntries={['/detail/doc-live-test']}>
        <Routes>
          <Route path="/detail/:id" element={<Detail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(detailSpy).toHaveBeenCalledWith('doc-live-test');
      expect(viewSpy).toHaveBeenCalledWith('doc-live-test');
      expect(screen.getAllByText('Kinh tế lượng nâng cao K66')[0]).toBeInTheDocument();
    });
  });

  it('displays DRM lock overlay when navigating to locked page', async () => {
    vi.spyOn(documentService, 'getDetail').mockResolvedValue({
      id: 'doc-drm-lock',
      title: 'Tài liệu Khóa DRM',
      totalPages: 5,
      freePages: 1, // Only page 0 is free, page 1 is locked
      unlockPointsRequired: 20,
      isBlurLocked: true,
      hasUnlocked: false,
      pages: [
        { heading: 'Trang 1 miễn phí', paragraphs: ['Nội dung trang 1'] },
        { heading: 'Trang 2 khóa', paragraphs: ['Nội dung trang 2 bí mật'] },
      ],
      author: { fullName: 'Tác giả A' },
    } as any);

    render(
      <MemoryRouter initialEntries={['/detail/doc-drm-lock']}>
        <Routes>
          <Route path="/detail/:id" element={<Detail />} />
        </Routes>
      </MemoryRouter>
    );

    // Initial page 0 is free
    await waitFor(() => {
      expect(screen.getByText('Trang 1 miễn phí')).toBeInTheDocument();
    });

    // Navigate to page 1
    const nextBtn = screen.getByRole('button', { name: /Tiếp/i });
    fireEvent.click(nextBtn);

    // DRM lock overlay should appear
    await waitFor(() => {
      expect(screen.getByText('Trang nội dung đã bị khóa')).toBeInTheDocument();
      expect(screen.getByText(/Mở khóa với 20 điểm/i)).toBeInTheDocument();
    });
  });

  it('initializes like button state correctly from detail.hasLiked and handles toggle', async () => {
    vi.spyOn(documentService, 'getDetail').mockResolvedValue({
      id: 'doc-liked-test',
      title: 'Tài liệu đã thích',
      totalPages: 1,
      freePages: 1,
      likeCount: 42,
      hasLiked: true,
      hasUnlocked: true,
      author: { fullName: 'Tác giả B' },
      pages: [{ heading: 'Trang 1', paragraphs: ['Nội dung'] }],
    } as any);

    const toggleLikeSpy = vi.spyOn(documentService, 'toggleLike').mockResolvedValue(false);

    render(
      <MemoryRouter initialEntries={['/detail/doc-liked-test']}>
        <Routes>
          <Route path="/detail/:id" element={<Detail />} />
        </Routes>
      </MemoryRouter>
    );

    const likeButton = await screen.findByRole('button', { name: /Thích/i });
    expect(likeButton).toHaveClass('bg-rose-50');
    expect(screen.getByText(/Thích \(42\)/i)).toBeInTheDocument();

    fireEvent.click(likeButton);

    await waitFor(() => {
      expect(toggleLikeSpy).toHaveBeenCalledWith('doc-liked-test');
      expect(screen.getByText(/Thích \(41\)/i)).toBeInTheDocument();
      expect(likeButton).not.toHaveClass('bg-rose-50');
    });
  });

  it('opens report document modal when clicking report button', async () => {
    render(
      <MemoryRouter initialEntries={['/detail/doc-report-test']}>
        <Routes>
          <Route path="/detail/:id" element={<Detail />} />
        </Routes>
      </MemoryRouter>
    );

    const reportBtn = await screen.findByTestId('report-document-btn');
    expect(reportBtn).toBeInTheDocument();

    fireEvent.click(reportBtn);

    expect(await screen.findByTestId('report-modal')).toBeInTheDocument();
  });

  it('opens likers modal when clicking view-likers-btn', async () => {
    vi.spyOn(documentService, 'getUsersWhoLiked').mockResolvedValueOnce([
      { id: 'u-1', fullName: 'Lan Chi' } as any,
    ]);

    render(
      <MemoryRouter initialEntries={['/detail/doc-likers-test']}>
        <Routes>
          <Route path="/detail/:id" element={<Detail />} />
        </Routes>
      </MemoryRouter>
    );

    const likersBtn = await screen.findByTestId('view-likers-btn');
    expect(likersBtn).toBeInTheDocument();

    fireEvent.click(likersBtn);

    expect(await screen.findByTestId('likers-modal')).toBeInTheDocument();
  });

  it('allows author of a comment to delete it via documentService.deleteComment', async () => {
    vi.spyOn(authService, 'getCurrentUser').mockReturnValue({
      id: 'user-me',
      fullName: 'Bạn (Người dùng)',
      username: 'ban',
      email: 'ban@gmail.com',
      role: 'USER',
    } as any);

    vi.spyOn(documentService, 'getComments').mockResolvedValueOnce({
      content: [
        {
          id: 'c-mine',
          documentId: 'doc-comment-test',
          content: 'Bình luận của chính tôi',
          likeCount: 0,
          author: { id: 'user-me', fullName: 'Bạn (Người dùng)' },
          createdAt: new Date().toISOString(),
        },
      ],
      page: 0,
      size: 10,
      totalElements: 1,
      totalPages: 1,
      last: true,
    } as any);

    const deleteCommentSpy = vi.spyOn(documentService, 'deleteComment').mockResolvedValueOnce();

    render(
      <MemoryRouter initialEntries={['/detail/doc-comment-test']}>
        <Routes>
          <Route path="/detail/:id" element={<Detail />} />
        </Routes>
      </MemoryRouter>
    );

    const deleteBtn = await screen.findByTestId('delete-comment-btn');
    expect(deleteBtn).toBeInTheDocument();

    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(deleteCommentSpy).toHaveBeenCalledWith('c-mine');
      expect(screen.queryByText('Bình luận của chính tôi')).not.toBeInTheDocument();
    });
  });

  it('renders author action buttons (edit, delete) when currentUser is author', async () => {
    vi.spyOn(authService, 'getCurrentUser').mockReturnValue({
      id: 'author-user-id',
      fullName: 'Tác giả A',
      username: 'author',
      email: 'author@gmail.com',
      role: 'USER',
    } as any);

    vi.spyOn(documentService, 'getDetail').mockResolvedValueOnce({
      id: 'doc-author-test',
      title: 'Tài liệu của tôi',
      universityName: 'Đại học Bách Khoa',
      courseName: 'Giải tích',
      docType: 'SLIDE',
      likeCount: 10,
      totalPages: 5,
      freePages: 2,
      unlockPointsRequired: 5,
      isBlurLocked: false,
      hasUnlocked: true,
      author: { id: 'author-user-id', fullName: 'Tác giả A' },
      description: 'Mô tả tác giả',
    } as any);

    const deleteDocSpy = vi.spyOn(documentService, 'delete').mockResolvedValueOnce();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <MemoryRouter initialEntries={['/detail/doc-author-test']}>
        <Routes>
          <Route path="/detail/:id" element={<Detail />} />
        </Routes>
      </MemoryRouter>
    );

    const editBtn = await screen.findByTestId('edit-document-btn');
    const deleteBtn = await screen.findByTestId('delete-document-btn');

    expect(editBtn).toBeInTheDocument();
    expect(deleteBtn).toBeInTheDocument();

    // Test opening edit modal
    fireEvent.click(editBtn);
    expect(await screen.findByTestId('edit-document-modal')).toBeInTheDocument();

    // Close edit modal or cancel
    fireEvent.click(screen.getByRole('button', { name: /Hủy bỏ/i }));

    // Test delete document action
    fireEvent.click(deleteBtn);
    await waitFor(() => {
      expect(deleteDocSpy).toHaveBeenCalledWith('doc-author-test');
    });
  });
});

