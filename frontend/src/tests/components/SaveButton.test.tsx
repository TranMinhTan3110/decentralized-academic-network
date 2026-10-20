import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SaveButton } from '../../components/ui/SaveButton';

describe('SaveButton Component Unit Tests', () => {
  it('renders initial state and toggles save state on click', () => {
    render(<SaveButton documentId="doc-test-save-btn" />);

    const button = screen.getByRole('button', { name: /Lưu tài liệu/i });
    expect(button).toBeInTheDocument();
    expect(screen.getByText('Lưu')).toBeInTheDocument();

    fireEvent.click(button);

    expect(screen.getByRole('button', { name: /Đã lưu tài liệu/i })).toBeInTheDocument();
    expect(screen.getByText('Đã lưu')).toBeInTheDocument();

    fireEvent.click(button);

    expect(screen.getByRole('button', { name: /Lưu tài liệu/i })).toBeInTheDocument();
    expect(screen.getByText('Lưu')).toBeInTheDocument();
  });
});
