import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LeaderboardPage } from '../../pages/LeaderboardPage';
import { userService } from '../../services/userService';

describe('LeaderboardPage Component', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

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

    it('fetches and displays live leaderboard data from userService API', async () => {
        vi.spyOn(userService, 'getLeaderboard').mockResolvedValueOnce({
            period: 'weekly',
            updatedAt: new Date().toISOString(),
            pointsToNextRank: 21,
            entries: [
                {
                    rank: 1,
                    userId: '10000000-0000-0000-0000-000000000001',
                    name: 'Âu Dương Tấn',
                    handle: '@auduongtan',
                    avatar: '',
                    school: 'Đại học Bách khoa Hà Nội',
                    title: 'Chuyên Gia',
                    points: 150,
                    uploads: 12,
                    saves: 24,
                    likes: 98,
                    followerCount: 45,
                    isCurrentUser: false,
                    trend: 'up',
                    change: 1,
                },
                {
                    rank: 2,
                    userId: '20000000-0000-0000-0000-000000000001',
                    name: 'Trần Minh Tấn',
                    handle: '@tranminhtan',
                    avatar: '',
                    school: 'Đại học Bách khoa Hà Nội',
                    title: 'Chuyên Gia',
                    points: 130,
                    uploads: 9,
                    saves: 18,
                    likes: 76,
                    followerCount: 30,
                    isCurrentUser: true,
                    trend: 'up',
                    change: 1,
                },
            ],
        });

        render(
            <MemoryRouter>
                <LeaderboardPage />
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.getAllByText('Âu Dương Tấn').length).toBeGreaterThan(0);
            expect(screen.getAllByText('Trần Minh Tấn').length).toBeGreaterThan(0);
        });
    });
});
