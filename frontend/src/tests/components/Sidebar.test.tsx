import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar/Sidebar';

describe('Sidebar Component', () => {
    it('renders brand logo and tagline correctly', () => {
        render(
            <MemoryRouter>
                <Sidebar />
            </MemoryRouter>,
        );

        expect(screen.getByText('mục lục')).toBeInTheDocument();
        expect(screen.getByText('MỘT NƠI CHO VIỆC HỌC')).toBeInTheDocument();
    });

    it('renders main navigation links correctly', () => {
        render(
            <MemoryRouter>
                <Sidebar />
            </MemoryRouter>,
        );

        const nav = screen.getByRole('navigation', { name: /điều hướng chính/i });

        expect(within(nav).getByRole('link', { name: /home/i })).toBeInTheDocument();
        expect(within(nav).getByRole('link', { name: /khám phá/i })).toBeInTheDocument();
        expect(within(nav).getByRole('link', { name: /recent/i })).toBeInTheDocument();
        expect(within(nav).getByRole('link', { name: /library/i })).toBeInTheDocument();
        expect(within(nav).getByRole('link', { name: /hồ sơ/i })).toBeInTheDocument();
        expect(within(nav).getByRole('link', { name: /cài đặt/i })).toBeInTheDocument();
        expect(within(nav).getByRole('link', { name: /bảng xếp hạng/i })).toBeInTheDocument();
        expect(within(nav).getByRole('link', { name: /quiz/i })).toBeInTheDocument();
    });

    it('applies active styling to the link corresponding to current route', () => {
        render(
            <MemoryRouter initialEntries={['/explore']}>
                <Sidebar />
            </MemoryRouter>,
        );

        const nav = screen.getByRole('navigation', { name: /điều hướng chính/i });
        const exploreLink = within(nav).getByRole('link', { name: /khám phá/i });
        expect(exploreLink).toHaveClass('bg-[#1f3a5f]');
        expect(exploreLink).toHaveClass('text-white');
    });

    it('displays savedCount badge on library item when savedCount > 0', () => {
        render(
            <MemoryRouter>
                <Sidebar savedCount={5} />
            </MemoryRouter>,
        );

        expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('renders upload document contribution card', () => {
        render(
            <MemoryRouter>
                <Sidebar />
            </MemoryRouter>,
        );

        expect(screen.getByText('GÓP MỘT TRANG HAY')).toBeInTheDocument();
        const shareLink = screen.getByRole('link', { name: /chia sẻ tài liệu/i });
        expect(shareLink).toBeInTheDocument();
        expect(shareLink).toHaveAttribute('href', '/upload');
    });
});
