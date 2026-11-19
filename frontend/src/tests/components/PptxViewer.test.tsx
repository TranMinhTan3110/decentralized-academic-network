import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PptxViewer } from '../../components/ui/PptxViewer/PptxViewer';

vi.mock('../../services/documentService', () => ({
  documentService: {
    getAttachmentPreviewUrl: vi.fn((id: string, idx: number) => `http://localhost:8082/api/v1/documents/${id}/attachments/${idx}/preview`),
  },
}));

vi.mock('../../services/authService', () => ({
  authService: {
    getAccessToken: vi.fn(() => 'mock-jwt-token'),
  },
}));

describe('PptxViewer Component (PDF-backed Preview)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    URL.createObjectURL = vi.fn(() => 'blob:http://localhost/mock-pptx-pdf');
    URL.revokeObjectURL = vi.fn();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['%PDF-1.4'], { type: 'application/pdf' }),
    } as unknown as Response);
  });

  it('fetches converted PDF preview with auth token and renders iframe', async () => {
    render(
      <PptxViewer
        documentId="doc-123"
        attachmentIndex={0}
        title="Báo cáo giữa kỳ"
        hasUnlocked={true}
      />
    );

    await waitFor(() => {
      const iframe = screen.getByTestId('pptx-pdf-iframe');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', 'blob:http://localhost/mock-pptx-pdf#view=FitH');
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:8082/api/v1/documents/doc-123/attachments/0/preview',
      expect.objectContaining({ headers: { Authorization: 'Bearer mock-jwt-token' } })
    );
  });

  it('shows DRM unlock bar when document is locked', async () => {
    const onUnlock = vi.fn();
    render(
      <PptxViewer
        documentId="doc-123"
        hasUnlocked={false}
        isBlurLocked={true}
        freePagesLimit={3}
        totalPages={8}
        unlockPoints={10}
        onUnlockRequest={onUnlock}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('pptx-pdf-iframe')).toBeInTheDocument();
    });

    expect(screen.getByText(/Đang xem trước 3 slide đầu miễn phí/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Mở khóa \(10 điểm\)/i }));
    expect(onUnlock).toHaveBeenCalledTimes(1);
  });

  it('shows error state and retry button when preview API fails', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    } as unknown as Response);

    render(<PptxViewer documentId="doc-err" />);

    await waitFor(() => {
      expect(screen.getByText(/Không thể tải bản xem trước PowerPoint/i)).toBeInTheDocument();
    });
  });
});
