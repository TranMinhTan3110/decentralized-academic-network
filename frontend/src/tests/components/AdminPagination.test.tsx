import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminPagination } from '../../components/admin/AdminPagination';

const baseProps = {
    page: 2,
    pageSize: 10,
    totalElements: 45,
    totalPages: 5,
    onPageChange: vi.fn(),
    itemLabel: 'bài đăng',
    pageSizeAriaLabel: 'Số bài đăng mỗi trang',
};

describe('AdminPagination Component', () => {
    it('renders the current range and total element count', () => {
        render(<AdminPagination {...baseProps} />);

        expect(screen.getByText(/trong tổng số/i)).toHaveTextContent('bài đăng');
        expect(screen.getByText('45')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Trang 2' })).toHaveAttribute('aria-current', 'page');
    });

    it('shows ellipsis when there are many pages', () => {
        render(<AdminPagination {...baseProps} />);

        expect(screen.getAllByText('...')).toHaveLength(1);
        expect(screen.getByRole('button', { name: 'Trang 1' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Trang 5' })).toBeInTheDocument();
    });

    it('calls onPageChange for previous, next and numbered pages', () => {
        const onPageChange = vi.fn();
        render(<AdminPagination {...baseProps} onPageChange={onPageChange} />);

        fireEvent.click(screen.getByRole('button', { name: 'Trang trước' }));
        expect(onPageChange).toHaveBeenLastCalledWith(1);

        fireEvent.click(screen.getByRole('button', { name: 'Trang sau' }));
        expect(onPageChange).toHaveBeenLastCalledWith(3);

        fireEvent.click(screen.getByRole('button', { name: 'Trang 5' }));
        expect(onPageChange).toHaveBeenLastCalledWith(5);
    });

    it('disables navigation at the boundaries', () => {
        const { rerender } = render(<AdminPagination {...baseProps} page={1} />);
        expect(screen.getByRole('button', { name: 'Trang trước' })).toBeDisabled();

        rerender(<AdminPagination {...baseProps} page={5} />);
        expect(screen.getByRole('button', { name: 'Trang sau' })).toBeDisabled();
    });

    it('calls onPageSizeChange when the page size select changes', async () => {
        const user = userEvent.setup();
        const onPageSizeChange = vi.fn();
        render(<AdminPagination {...baseProps} onPageSizeChange={onPageSizeChange} />);

        await user.selectOptions(screen.getByRole('combobox', { name: 'Số bài đăng mỗi trang' }), '20');
        expect(onPageSizeChange).toHaveBeenCalledWith(20);
    });
});
