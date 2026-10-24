import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UnlockDocumentModal } from '../../components/modals/UnlockDocumentModal';
import { documentService } from '../../services/documentService';

describe('UnlockDocumentModal Component Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(
      <UnlockDocumentModal
        isOpen={false}
        documentTitle="Tài liệu Kinh tế vi mô"
        unlockPoints={10}
        userBalance={50}
        onClose={vi.fn()}
        onUnlocked={vi.fn()}
        documentId="doc-1"
      />
    );

    expect(screen.queryByText('Mở khóa tài liệu học tập')).not.toBeInTheDocument();
  });

  it('renders modal with document title, points required, and balance', () => {
    render(
      <UnlockDocumentModal
        isOpen={true}
        documentTitle="Tài liệu Kinh tế vi mô"
        unlockPoints={15}
        userBalance={30}
        onClose={vi.fn()}
        onUnlocked={vi.fn()}
        documentId="doc-1"
      />
    );

    expect(screen.getByText('Mở khóa tài liệu học tập')).toBeInTheDocument();
    expect(screen.getByText('Tài liệu Kinh tế vi mô')).toBeInTheDocument();
    expect(screen.getByText('15 điểm')).toBeInTheDocument();
    expect(screen.getByText('30 điểm')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Xác nhận mở khóa/i })).not.toBeDisabled();
  });

  it('shows insufficient points warning and disables confirm button when balance is too low', () => {
    render(
      <UnlockDocumentModal
        isOpen={true}
        documentTitle="Tài liệu Kinh tế vi mô"
        unlockPoints={20}
        userBalance={5}
        onClose={vi.fn()}
        onUnlocked={vi.fn()}
        documentId="doc-1"
      />
    );

    expect(screen.getByText(/Số dư điểm không đủ/i)).toBeInTheDocument();
    expect(screen.getByText(/Bạn cần thêm 15 điểm/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Xác nhận mở khóa/i })).toBeDisabled();
  });

  it('calls documentService.unlock and triggers onUnlocked when user confirms', async () => {
    const unlockSpy = vi.spyOn(documentService, 'unlock').mockResolvedValue(true);
    const onUnlocked = vi.fn();
    const onClose = vi.fn();

    render(
      <UnlockDocumentModal
        isOpen={true}
        documentTitle="Tài liệu Giải tích 1"
        unlockPoints={10}
        userBalance={25}
        onClose={onClose}
        onUnlocked={onUnlocked}
        documentId="doc-test-123"
      />
    );

    const confirmBtn = screen.getByRole('button', { name: /Xác nhận mở khóa/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(unlockSpy).toHaveBeenCalledWith('doc-test-123');
      expect(onUnlocked).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});
