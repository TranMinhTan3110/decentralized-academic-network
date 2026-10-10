import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Discover } from '../../pages/Discover';

describe('Discover Page Unit Tests', () => {
  const renderDiscover = (initialEntries = ['/explore']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <Discover />
      </MemoryRouter>
    );
  };

  it('renders heading, search input, subject shortcut buttons and school index', () => {
    renderDiscover();

    expect(screen.getByText('Hôm nay, bạn học gì?')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Tên tài liệu, môn học hoặc trường đại học')
    ).toBeInTheDocument();
    expect(screen.getByText('ĐI THẲNG ĐẾN')).toBeInTheDocument();
    expect(screen.getByText('Theo trường')).toBeInTheDocument();
  });

  it('allows searching for documents', () => {
    renderDiscover();

    const searchInput = screen.getByPlaceholderText(
      'Tên tài liệu, môn học hoặc trường đại học'
    );
    fireEvent.change(searchInput, { target: { value: 'Python' } });

    const searchButton = screen.getByRole('button', { name: /tìm kiếm/i });
    fireEvent.submit(searchButton.closest('form')!);

    expect(
      screen.getAllByText('Giải Thuật Học Máy & Ứng Dụng Trong Phân Tích Dữ Liệu Lớn').length
    ).toBeGreaterThan(0);
  });

  it('toggles extra filters section when clicking filter button', () => {
    renderDiscover();

    const filterBtn = screen.getByRole('button', { name: /bộ lọc/i });
    expect(screen.queryByText('Loại tài liệu')).not.toBeInTheDocument();

    fireEvent.click(filterBtn);
    expect(screen.getByText('Loại tài liệu')).toBeInTheDocument();
  });

  it('shows empty state when no documents match filters', () => {
    renderDiscover();

    const searchInput = screen.getByPlaceholderText(
      'Tên tài liệu, môn học hoặc trường đại học'
    );
    fireEvent.change(searchInput, { target: { value: 'XYZ123NonExistent' } });
    fireEvent.submit(searchInput.closest('form')!);

    expect(screen.getByText('Chưa tìm thấy tài liệu phù hợp')).toBeInTheDocument();
  });
});
