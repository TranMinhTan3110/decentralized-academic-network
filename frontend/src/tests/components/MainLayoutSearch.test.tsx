import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { MainLayout } from '../../components/layout/MainLayout/MainLayout';
import { documentService } from '../../services/documentService';

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}

describe('MainLayout header search', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(documentService, 'getRecentSearchKeywords').mockReturnValue([]);
    vi.spyOn(documentService, 'recordSearchKeyword').mockImplementation(() => {});
    vi.spyOn(documentService, 'getSearchSuggestions').mockResolvedValue({
      content: [],
      pageNumber: 0,
      pageSize: 5,
      totalElements: 0,
      totalPages: 0,
      last: true,
    });
  });

  const renderLayout = () =>
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <MainLayout>
                <LocationProbe />
              </MainLayout>
            }
          />
          <Route path="/explore" element={<LocationProbe />} />
          <Route path="/detail/:id" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    );

  it('navigates to the explore results page when the search is submitted', async () => {
    const user = userEvent.setup();
    renderLayout();

    const input = screen.getByPlaceholderText('Tìm tài liệu...');
    await user.type(input, 'xác suất thống kê{Enter}');

    expect(await screen.findByText(/^\/explore\?q=/)).toBeInTheDocument();
    expect(documentService.recordSearchKeyword).toHaveBeenCalledWith('xác suất thống kê');
    expect(screen.getByTestId('location')).toHaveTextContent(
      `/explore?q=${encodeURIComponent('xác suất thống kê')}`,
    );
  });

  it('navigates to the document detail page when a suggestion is chosen', async () => {
    vi.spyOn(documentService, 'getSearchSuggestions').mockResolvedValue({
      content: [{ id: 'doc-42', title: 'Slide Xác suất thống kê' }],
      pageNumber: 0,
      pageSize: 5,
      totalElements: 1,
      totalPages: 1,
      last: true,
    } as any);
    const user = userEvent.setup();
    renderLayout();

    const input = screen.getByPlaceholderText('Tìm tài liệu...');
    await user.type(input, 'xác suất');

    const suggestion = await screen.findByText('Slide Xác suất thống kê', {}, { timeout: 3000 });
    await user.click(suggestion);

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/detail/doc-42'));
  });
});
