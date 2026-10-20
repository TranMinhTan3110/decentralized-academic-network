import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReportDocumentModal } from '../../../components/modals/ReportDocumentModal';
import { documentService } from '../../../services/documentService';
import { toast } from 'sonner';

vi.mock('../../../services/documentService', () => ({
  documentService: {
    report: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ReportDocumentModal Component Tests', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    documentId: 'doc-report-1',
    documentTitle: 'Giáo trình Kinh tế vĩ mô',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(<ReportDocumentModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders modal with document title and default reasons', () => {
    render(<ReportDocumentModal {...defaultProps} />);

    expect(screen.getByText('Báo cáo vi phạm tài liệu')).toBeInTheDocument();
    expect(screen.getByText('Giáo trình Kinh tế vĩ mô')).toBeInTheDocument();
    expect(screen.getByTestId('report-reason-select')).toBeInTheDocument();
    expect(screen.getByTestId('report-description-input')).toBeInTheDocument();
    expect(screen.getByTestId('report-submit-btn')).toBeInTheDocument();
  });

  it('submits report successfully and closes modal', async () => {
    vi.mocked(documentService.report).mockResolvedValueOnce();

    render(<ReportDocumentModal {...defaultProps} />);

    const reasonSelect = screen.getByTestId('report-reason-select');
    fireEvent.change(reasonSelect, { target: { value: 'Nội dung sai lệch hoặc Spam' } });

    const descInput = screen.getByTestId('report-description-input');
    fireEvent.change(descInput, { target: { value: 'Tài liệu chứa quảng cáo độc hại' } });

    const submitBtn = screen.getByTestId('report-submit-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(documentService.report).toHaveBeenCalledWith(
        'doc-report-1',
        'Nội dung sai lệch hoặc Spam',
        'Tài liệu chứa quảng cáo độc hại'
      );
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Báo cáo vi phạm đã được gửi thành công')
      );
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it('handles report error gracefully', async () => {
    vi.mocked(documentService.report).mockRejectedValueOnce(new Error('Server error'));

    render(<ReportDocumentModal {...defaultProps} />);

    const submitBtn = screen.getByTestId('report-submit-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Server error');
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });
});
