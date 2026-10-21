import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

describe('ConfirmModal Component Unit Tests', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <ConfirmModal
        isOpen={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Xác nhận xóa"
        description="Bạn có chắc không?"
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders modal with title, description, and action buttons when isOpen is true', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmModal
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Xác nhận xóa đoạn chat?"
        description="Nội dung sẽ bị mất vĩnh viễn."
        confirmText="Đồng ý xóa"
        cancelText="Bỏ qua"
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Xác nhận xóa đoạn chat?')).toBeInTheDocument();
    expect(screen.getByText('Nội dung sẽ bị mất vĩnh viễn.')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: 'Bỏ qua' });
    const confirmBtn = screen.getByRole('button', { name: 'Đồng ý xóa' });

    expect(cancelBtn).toBeInTheDocument();
    expect(confirmBtn).toBeInTheDocument();

    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape key press when not loading', () => {
    const onClose = vi.fn();

    render(
      <ConfirmModal
        isOpen={true}
        onClose={onClose}
        onConfirm={vi.fn()}
        title="Tiêu đề"
        description="Mô tả"
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when clicking the backdrop outside the modal dialog', () => {
    const onClose = vi.fn();

    render(
      <ConfirmModal
        isOpen={true}
        onClose={onClose}
        onConfirm={vi.fn()}
        title="Tiêu đề"
        description="Mô tả"
      />
    );

    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
