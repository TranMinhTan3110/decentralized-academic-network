import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DocumentCard } from '../../components/ui/DocumentCard';

const baseDoc = {
  id: 'doc-thumb-1',
  title: 'Giáo trình Cấu trúc dữ liệu',
  category: 'Học thuật',
  universityName: 'Đại học Bách Khoa Hà Nội',
  courseName: 'Cấu trúc dữ liệu',
  docType: 'TEXTBOOK',
  totalPages: 42,
  academicYear: '2026',
  author: { name: 'Thành viên A' },
} as any;

describe('DocumentCard Thumbnail Banner Tests', () => {
  it('renders first-page thumbnail as hero banner when thumbnailUrl exists', () => {
    render(
      <MemoryRouter>
        <DocumentCard document={{ ...baseDoc, thumbnailUrl: 'http://localhost:8080/ipfs/bafy-hero' }} />
      </MemoryRouter>
    );

    const img = screen.getByRole('img', { name: /trang đầu tiên/i });
    expect(img).toHaveAttribute('src', 'http://localhost:8080/ipfs/bafy-hero');
    expect(screen.getAllByText('Giáo trình Cấu trúc dữ liệu').length).toBeGreaterThanOrEqual(1);
  });

  it('shows blue fallback banner when thumbnailUrl is null', () => {
    render(
      <MemoryRouter>
        <DocumentCard document={{ ...baseDoc, thumbnailUrl: null }} />
      </MemoryRouter>
    );

    expect(screen.queryByRole('img', { name: /trang đầu tiên/i })).not.toBeInTheDocument();
    expect(screen.getAllByText('Giáo trình Cấu trúc dữ liệu').length).toBeGreaterThanOrEqual(1);
  });

  it('falls back to the blue banner when the thumbnail image fails to load', () => {
    render(
      <MemoryRouter>
        <DocumentCard document={{ ...baseDoc, thumbnailUrl: 'http://localhost:8080/ipfs/broken' }} />
      </MemoryRouter>
    );

    const img = screen.getByRole('img', { name: /trang đầu tiên/i });
    fireEvent.error(img);

    expect(screen.queryByRole('img', { name: /trang đầu tiên/i })).not.toBeInTheDocument();
    expect(screen.getAllByText('Giáo trình Cấu trúc dữ liệu').length).toBeGreaterThanOrEqual(1);
  });

  it('keeps metadata rendering intact alongside the banner', () => {
    render(
      <MemoryRouter>
        <DocumentCard document={{ ...baseDoc, thumbnailUrl: 'http://localhost:8080/ipfs/bafy-hero' }} />
      </MemoryRouter>
    );

    expect(screen.getAllByText('Cấu trúc dữ liệu').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Đại học Bách Khoa Hà Nội')).toBeInTheDocument();
    expect(screen.getAllByText(/42 trang/).length).toBeGreaterThanOrEqual(1);
  });
});
