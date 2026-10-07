import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LibraryPage } from '../../pages/LibraryPage/LibraryPage';

describe('LibraryPage Component Unit Tests', () => {
  it('renders LibraryPage headings, stats bar, tabs, and default empty state', () => {
    render(
      <MemoryRouter initialEntries={['/library']}>
        <LibraryPage />
      </MemoryRouter>
    );

    expect(screen.getByText('KHÔNG GIAN CÁ NHÂN')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tài liệu đã đăng', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('1.2K')).toBeInTheDocument();
    expect(screen.getByText('340')).toBeInTheDocument();
    expect(screen.getByText('89')).toBeInTheDocument();
    expect(screen.getByText('Bạn chưa đăng tài liệu nào.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Chia sẻ tài liệu ngay bây giờ/i })).toBeInTheDocument();
  });

  it('allows switching between Đã đăng, Đã lưu, and Đã xem tabs', () => {
    render(
      <MemoryRouter initialEntries={['/library']}>
        <LibraryPage />
      </MemoryRouter>
    );

    const savedTabBtn = screen.getByRole('button', { name: /Đã lưu/i, pressed: false });
    fireEvent.click(savedTabBtn);

    expect(screen.getByRole('button', { name: /Đã lưu/i, pressed: true })).toBeInTheDocument();

    const historyTabBtn = screen.getByRole('button', { name: /Đã xem/i, pressed: false });
    fireEvent.click(historyTabBtn);

    expect(screen.getByRole('button', { name: /Đã xem/i, pressed: true })).toBeInTheDocument();
  });
});
