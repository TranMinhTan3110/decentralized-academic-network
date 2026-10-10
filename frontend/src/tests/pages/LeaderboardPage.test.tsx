import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LeaderboardPage } from '../../pages/LeaderboardPage';

describe('LeaderboardPage Component', () => {
    it('renders leaderboard header, criteria, and podium top 3', () => {
        render(
            <MemoryRouter>
                <LeaderboardPage />
            </MemoryRouter>,
        );

        expect(screen.getByText('Bảng Xếp Hạng Đóng Góp Học Thuật')).toBeInTheDocument();
        expect(screen.getByText('CÙNG NHAU TIẾN BỘ')).toBeInTheDocument();
        expect(screen.getByText('+10 điểm')).toBeInTheDocument();
        expect(screen.getByText('+5 điểm')).toBeInTheDocument();
        expect(screen.getByText('+2 điểm')).toBeInTheDocument();
        expect(screen.getAllByText('Lan Chi').length).toBeGreaterThan(0);
    });

    it('switches time periods (weekly, monthly, all-time)', () => {
        render(
            <MemoryRouter>
                <LeaderboardPage />
            </MemoryRouter>,
        );

        const monthlyBtn = screen.getByRole('button', { name: /Tháng này/i });
        fireEvent.click(monthlyBtn);

        expect(screen.getByText(/Những gương mặt dẫn đầu cuộc đua tri thức tháng này/i)).toBeInTheDocument();

        const allTimeBtn = screen.getByRole('button', { name: /Tất cả thời gian/i });
        fireEvent.click(allTimeBtn);

        expect(screen.getByText(/Những gương mặt dẫn đầu cuộc đua tri thức toàn thời gian/i)).toBeInTheDocument();
    });

    it('filters leaderboard entries by search query', () => {
        render(
            <MemoryRouter>
                <LeaderboardPage />
            </MemoryRouter>,
        );

        const searchInput = screen.getByPlaceholderText(/Tìm sinh viên hoặc trường.../i);
        fireEvent.change(searchInput, { target: { value: 'Lan Chi' } });

        expect(screen.getAllByText('Lan Chi').length).toBeGreaterThan(0);
        expect(screen.queryByText('Đặng Mai Phương')).not.toBeInTheDocument();
    });
});
