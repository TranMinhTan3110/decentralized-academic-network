import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SaveButton } from '../../components/ui/SaveButton';
import { documentService } from '../../services/documentService';

describe('SaveButton Component Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders initial state and toggles save via bookmark API', async () => {
    const toggleSpy = vi.spyOn(documentService, 'toggleBookmark')
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    render(<SaveButton documentId="doc-test-save-btn" />);

    const button = screen.getByRole('button', { name: /Lưu tài liệu/i });
    expect(button).toBeInTheDocument();
    expect(screen.getByText('Lưu')).toBeInTheDocument();

    fireEvent.click(button);

    await waitFor(() => {
      expect(toggleSpy).toHaveBeenCalledWith('doc-test-save-btn');
      expect(screen.getByText('Đã lưu')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Đã lưu tài liệu/i }));

    await waitFor(() => {
      expect(screen.getByText('Lưu')).toBeInTheDocument();
    });
  });

  it('reverts state and shows error when API fails', async () => {
    vi.spyOn(documentService, 'toggleBookmark').mockRejectedValue(new Error('Network error'));

    render(<SaveButton documentId="doc-test-save-btn" />);
    fireEvent.click(screen.getByRole('button', { name: /Lưu tài liệu/i }));

    await waitFor(() => {
      expect(screen.getByText('Lưu')).toBeInTheDocument();
    });
  });
});
