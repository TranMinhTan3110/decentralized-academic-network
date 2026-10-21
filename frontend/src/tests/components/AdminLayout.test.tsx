import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/layout/AdminLayout/AdminLayout';

describe('AdminLayout Component', () => {
    it('renders page header with breadcrumb, title, subtitle, and custom actions', () => {
        render(
            <MemoryRouter>
                <AdminLayout
                    breadcrumb="Admin / Quản lý tài liệu"
                    title="Danh sách kiểm duyệt"
                    subtitle="Kiểm tra các tài liệu vừa tải lên"
                    actions={<button type="button">Xuất báo cáo</button>}
                >
                    <div data-testid="test-content">Nội dung quản trị</div>
                </AdminLayout>
            </MemoryRouter>
        );

        expect(screen.getByText('Admin / Quản lý tài liệu')).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 1, name: 'Danh sách kiểm duyệt' })).toBeInTheDocument();
        expect(screen.getByText('Kiểm tra các tài liệu vừa tải lên')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Xuất báo cáo' })).toBeInTheDocument();
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });

    it('toggles mobile drawer and closes on backdrop click', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminLayout>
                    <div>Dashboard content</div>
                </AdminLayout>
            </MemoryRouter>
        );

        const openMenuBtn = screen.getByRole('button', { name: /mở menu quản trị/i });
        await user.click(openMenuBtn);

        const backdrop = screen.getByRole('button', { name: /đóng điều hướng quản trị/i });
        expect(backdrop).toBeInTheDocument();

        await user.click(backdrop);
        expect(screen.queryByRole('button', { name: /đóng điều hướng quản trị/i })).not.toBeInTheDocument();
    });

    it('closes mobile drawer when pressing Escape key', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminLayout>
                    <div>Dashboard content</div>
                </AdminLayout>
            </MemoryRouter>
        );

        const openMenuBtn = screen.getByRole('button', { name: /mở menu quản trị/i });
        await user.click(openMenuBtn);

        expect(screen.getByRole('button', { name: /đóng điều hướng quản trị/i })).toBeInTheDocument();

        fireEvent.keyDown(document, { key: 'Escape' });

        expect(screen.queryByRole('button', { name: /đóng điều hướng quản trị/i })).not.toBeInTheDocument();
    });

    it('triggers onSearchSubmit when search form in header is submitted', async () => {
        const handleSearch = vi.fn();
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminLayout onSearchSubmit={handleSearch}>
                    <div>Content</div>
                </AdminLayout>
            </MemoryRouter>
        );

        const searchInput = screen.getByPlaceholderText(/tìm tài liệu/i);
        await user.type(searchInput, 'blockchain{enter}');

        expect(handleSearch).toHaveBeenCalledWith('blockchain');
    });
});
