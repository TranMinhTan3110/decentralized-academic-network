import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { DetailPage } from '../../pages/Detail/DetailPage';
import { Detail } from '../../pages/Detail/Detail';

describe('DetailPage Component Unit Tests', () => {
  it('renders document title, author, and description correctly', () => {
    render(
      <MemoryRouter initialEntries={['/detail/doc-1']}>
        <Routes>
          <Route path="/detail/:id" element={<DetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getAllByText('Cung, cầu và cân bằng thị trường')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Lan Chi')[0]).toBeInTheDocument();
    expect(screen.getByText('Về tài liệu này')).toBeInTheDocument();
  });

  it('handles page navigation (Trước / Tiếp buttons)', () => {
    render(
      <MemoryRouter initialEntries={['/detail/doc-1']}>
        <Routes>
          <Route path="/detail/:id" element={<Detail />} />
        </Routes>
      </MemoryRouter>
    );

    const prevButton = screen.getByRole('button', { name: /Trước/i });
    const nextButton = screen.getByRole('button', { name: /Tiếp/i });

    expect(prevButton).toBeDisabled();
    expect(nextButton).not.toBeDisabled();

    fireEvent.click(nextButton);

    expect(screen.getAllByText(/Trang 2 \/ 2/i)[0]).toBeInTheDocument();
    expect(nextButton).toBeDisabled();
    expect(prevButton).not.toBeDisabled();

    fireEvent.click(prevButton);
    expect(screen.getAllByText(/Trang 1 \/ 2/i)[0]).toBeInTheDocument();
  });

  it('handles font zoom controls (Giảm / Tăng cỡ chữ)', () => {
    render(
      <MemoryRouter initialEntries={['/detail/doc-1']}>
        <Routes>
          <Route path="/detail/:id" element={<Detail />} />
        </Routes>
      </MemoryRouter>
    );

    const zoomIn = screen.getByRole('button', { name: /Tăng cỡ chữ/i });
    const zoomOut = screen.getByRole('button', { name: /Giảm cỡ chữ/i });

    expect(screen.getByText('100%')).toBeInTheDocument();

    fireEvent.click(zoomIn);
    expect(screen.getByText('115%')).toBeInTheDocument();

    fireEvent.click(zoomOut);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('renders comments and download action button', () => {
    render(
      <MemoryRouter initialEntries={['/detail/doc-1']}>
        <Routes>
          <Route path="/detail/:id" element={<Detail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getAllByText(/Bình luận \(12\)/i)[0]).toBeInTheDocument();
    expect(screen.getByText('Minh Anh')).toBeInTheDocument();
    expect(screen.getByText('Tải bản mẫu HTML')).toBeInTheDocument();
    expect(screen.getByText('Tạo Quiz từ tài liệu này')).toBeInTheDocument();
  });
});
