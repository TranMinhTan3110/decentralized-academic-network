import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditDocumentModal } from '../../../components/modals/EditDocumentModal';
import { documentService } from '../../../services/documentService';
import { toast } from 'sonner';

vi.mock('../../../services/documentService', () => ({
  documentService: {
    update: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('EditDocumentModal Component Tests', () => {
  const mockDoc = {
    id: 'doc-edit-1',
    title: 'Tiêu đề cũ',
    description: 'Mô tả cũ',
    academicYear: '2024-2025',
    semester: 'HK1',
  } as any;

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    document: mockDoc,
    onUpdated: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(<EditDocumentModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('populates initial form values correctly', () => {
    render(<EditDocumentModal {...defaultProps} />);

    expect(screen.getByTestId('edit-title-input')).toHaveValue('Tiêu đề cũ');
    expect(screen.getByTestId('edit-description-input')).toHaveValue('Mô tả cũ');
    expect(screen.getByTestId('edit-academic-year-input')).toHaveValue('2024-2025');
    expect(screen.getByTestId('edit-semester-select')).toHaveValue('HK1');
  });

  it('submits update successfully and notifies parent', async () => {
    const updatedDoc = {
      ...mockDoc,
      title: 'Tiêu đề đã sửa',
      description: 'Mô tả đã sửa',
      academicYear: '2025-2026',
      semester: 'HK2',
    };
    vi.mocked(documentService.update).mockResolvedValueOnce(updatedDoc);

    render(<EditDocumentModal {...defaultProps} />);

    fireEvent.change(screen.getByTestId('edit-title-input'), {
      target: { value: 'Tiêu đề đã sửa' },
    });
    fireEvent.change(screen.getByTestId('edit-description-input'), {
      target: { value: 'Mô tả đã sửa' },
    });
    fireEvent.change(screen.getByTestId('edit-academic-year-input'), {
      target: { value: '2025-2026' },
    });
    fireEvent.change(screen.getByTestId('edit-semester-select'), {
      target: { value: 'HK2' },
    });

    fireEvent.click(screen.getByTestId('edit-submit-btn'));

    await waitFor(() => {
      expect(documentService.update).toHaveBeenCalledWith('doc-edit-1', {
        title: 'Tiêu đề đã sửa',
        description: 'Mô tả đã sửa',
        academicYear: '2025-2026',
        semester: 'HK2',
      });
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Cập nhật thông tin tài liệu thành công')
      );
      expect(defaultProps.onUpdated).toHaveBeenCalledWith(updatedDoc);
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it('validates min length on title', async () => {
    render(<EditDocumentModal {...defaultProps} />);

    fireEvent.change(screen.getByTestId('edit-title-input'), {
      target: { value: 'ab' },
    });
    fireEvent.click(screen.getByTestId('edit-submit-btn'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Tiêu đề tài liệu phải có ít nhất 3 ký tự!');
      expect(documentService.update).not.toHaveBeenCalled();
    });
  });
});
