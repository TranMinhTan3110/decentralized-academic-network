import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from '../../pages/HomePage';

describe('HomePage Component Unit Tests', () => {
  const renderHomePage = () => {
    return render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
  };

  it('renders home intro section with correct headings and buttons', () => {
    renderHomePage();

    expect(screen.getByText('DÒNG CHIA SẺ HỌC TẬP')).toBeInTheDocument();
    expect(screen.getByText(/hôm nay học gì/i)).toBeInTheDocument();
    expect(screen.getByText('Khám phá tài liệu')).toBeInTheDocument();
    expect(screen.getAllByText('Chia sẻ tài liệu').length).toBeGreaterThan(0);
  });

  it('renders tab buttons and allows switching tabs', () => {
    renderHomePage();

    const forYouTab = screen.getByRole('button', { name: /dành cho bạn/i });
    const followingTab = screen.getByRole('button', { name: /đang theo dõi/i });
    const trendingTab = screen.getByRole('button', { name: /đang thịnh hành/i });

    expect(forYouTab).toBeInTheDocument();
    expect(followingTab).toBeInTheDocument();
    expect(trendingTab).toBeInTheDocument();

    // Click on "Đang theo dõi" tab
    fireEvent.click(followingTab);
    expect(screen.getByText('Giáo Trình Cấu Trúc Dữ Liệu & Giải Thuật (C++)')).toBeInTheDocument();

    // Click on "Đang thịnh hành" tab
    fireEvent.click(trendingTab);
    expect(screen.getByText('Giải Thuật Học Máy & Ứng Dụng Trong Big Data')).toBeInTheDocument();
  });

  it('handles load more button click', () => {
    renderHomePage();

    const loadMoreButton = screen.getByRole('button', { name: /tải thêm bài viết/i });
    expect(loadMoreButton).toBeInTheDocument();

    fireEvent.click(loadMoreButton);
    // After load more, more items should be visible
    expect(screen.getByText('Thiết Kế Hệ Thống Phân Tán (Distributed Systems)')).toBeInTheDocument();
  });

  it('renders suggested users widget and toggles follow state', () => {
    renderHomePage();

    expect(screen.getByText('Gợi ý theo dõi')).toBeInTheDocument();
    expect(screen.getByText('PGS. TS Lê Hoài Nam')).toBeInTheDocument();

    const followButtons = screen.getAllByRole('button', { name: /theo dõi/i });
    expect(followButtons.length).toBeGreaterThan(0);

    // Click first follow button
    fireEvent.click(followButtons[0]);
    expect(screen.getByText('Đang theo dõi')).toBeInTheDocument();
  });

  it('renders quick links section', () => {
    renderHomePage();

    expect(screen.getByText('ĐI NHANH')).toBeInTheDocument();
    expect(screen.getAllByText('Recent').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Quiz').length).toBeGreaterThan(0);
  });
});
