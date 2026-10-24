import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProfilePage } from '../../pages/ProfilePage';
import { documentService } from '../../services/documentService';
import { mockTestDocuments } from '../fixtures/documents.fixture';

describe('ProfilePage Component Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(documentService, 'getFeed').mockResolvedValue({
      content: mockTestDocuments,
      page: 0,
      size: 20,
      totalElements: mockTestDocuments.length,
      totalPages: 1,
      last: true,
    } as any);

    vi.spyOn(documentService, 'getMyBookmarks').mockResolvedValue({
      content: mockTestDocuments.slice(0, 4),
      page: 0,
      size: 10,
      totalElements: 4,
      totalPages: 1,
      last: true,
    } as any);
  });
  it('renders profile user info, stats, and shared documents tab', () => {
    render(
      <MemoryRouter initialEntries={['/profile']}>
        <ProfilePage />
      </MemoryRouter>
    );

    expect(screen.getAllByText('Lan Chi')[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Đại học Bách khoa Hà Nội/i)[0]).toBeInTheDocument();
    expect(screen.getByText('154')).toBeInTheDocument();
    expect(screen.getByText('1540')).toBeInTheDocument();
    expect(screen.getAllByText(/Tài liệu đã chia sẻ/i)[0]).toBeInTheDocument();
  });

  it('toggles follow state when clicking follow button', () => {
    render(
      <MemoryRouter initialEntries={['/profile']}>
        <ProfilePage />
      </MemoryRouter>
    );

    const followBtn = screen.getByRole('button', { name: /Theo dõi Lan Chi/i });
    expect(followBtn).toBeInTheDocument();

    fireEvent.click(followBtn);

    expect(screen.getByRole('button', { name: /Đang theo dõi/i })).toBeInTheDocument();
  });

  it('switches tabs when clicking saved and achievements tabs', () => {
    render(
      <MemoryRouter initialEntries={['/profile']}>
        <ProfilePage />
      </MemoryRouter>
    );

    const savedTab = screen.getByRole('button', { name: /Tài liệu đã lưu/i });
    fireEvent.click(savedTab);
    expect(screen.getByText(/Danh sách tài liệu mà Lan Chi đã đánh dấu/i)).toBeInTheDocument();

    const achievementTab = screen.getByRole('button', { name: /Thành tích & Huy hiệu/i });
    fireEvent.click(achievementTab);
    expect(screen.getByText(/Top Author 2025/i)).toBeInTheDocument();
  });
});
