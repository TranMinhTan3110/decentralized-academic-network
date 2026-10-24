import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { LikersModal } from '../../../components/modals/LikersModal';
import { documentService } from '../../../services/documentService';

vi.mock('../../../services/documentService', () => ({
  documentService: {
    getUsersWhoLiked: vi.fn(),
  },
}));

describe('LikersModal Component Tests', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    documentId: 'doc-likers-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(<LikersModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('loads and displays list of likers', async () => {
    vi.mocked(documentService.getUsersWhoLiked).mockResolvedValueOnce([
      {
        id: 'u-1',
        fullName: 'Nguyễn Văn A',
        badge: 'Thành viên Tích cực',
        points: 45,
      },
      {
        id: 'u-2',
        fullName: 'Trần Thị B',
        badge: 'Học giả',
        points: 120,
      },
    ] as any);

    render(<LikersModal {...defaultProps} />);

    expect(screen.getByText('Đang tải danh sách...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
      expect(screen.getByText('Trần Thị B')).toBeInTheDocument();
      expect(screen.getByText('Thành viên Tích cực')).toBeInTheDocument();
      expect(screen.getByText('45 điểm')).toBeInTheDocument();
      expect(screen.getByText('120 điểm')).toBeInTheDocument();
    });
  });

  it('displays empty state when no users liked', async () => {
    vi.mocked(documentService.getUsersWhoLiked).mockResolvedValueOnce([]);

    render(<LikersModal {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByText(/Chưa có lượt thích nào\. Hãy là người đầu tiên thả tim!/i)
      ).toBeInTheDocument();
    });
  });
});
