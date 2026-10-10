import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RecentPage } from '../../pages/RecentPage/RecentPage';

describe('RecentPage Component Unit Tests', () => {
  it('renders RecentPage headings, history section, and activity notification panel', () => {
    render(
      <MemoryRouter initialEntries={['/recent']}>
        <RecentPage />
      </MemoryRouter>
    );

    expect(screen.getByText('DÒNG HOẠT ĐỘNG CỦA BẠN')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recent', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Những tài liệu bạn đã xem và thông báo tương tác mới nhất.')).toBeInTheDocument();
    expect(screen.getByText('Đã xem gần đây')).toBeInTheDocument();
    expect(screen.getByText(/Thông báo & Tương tác/i)).toBeInTheDocument();
  });

  it('renders demo notification items correctly', () => {
    render(
      <MemoryRouter initialEntries={['/recent']}>
        <RecentPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Lan Chi vừa bình luận')).toBeInTheDocument();
    expect(screen.getByText('Đức Minh và 15 người khác đã thích')).toBeInTheDocument();
    expect(screen.getByText('"Tài liệu này cứu tôi qua môn, cảm ơn ad!"')).toBeInTheDocument();
  });

  it('allows expanding and collapsing activities if more than 3 exist', () => {
    render(
      <MemoryRouter initialEntries={['/recent']}>
        <RecentPage />
      </MemoryRouter>
    );

    const toggleButton = screen.queryByRole('button', { name: /Xem thêm/i });
    if (toggleButton) {
      fireEvent.click(toggleButton);
      expect(screen.getByRole('button', { name: /Ẩn bớt/i })).toBeInTheDocument();
    }
  });
});
