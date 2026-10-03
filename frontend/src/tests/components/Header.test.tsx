import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Header } from '../../components/layout/Header/Header';

describe('Header Component', () => {
  it('toggles login link vs authenticated user chip correctly', () => {
    const { rerender } = render(
      <MemoryRouter>
        <Header isAuthenticated={false} currentUser={null} />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /đăng nhập/i })).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <Header
          isAuthenticated={true}
          currentUser={{ name: 'Minh Tan', email: 'tan@example.com' }}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Minh Tan')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /đăng xuất/i })).toBeInTheDocument();
  });

  it('triggers onQueryChange when typing in search input', async () => {
    const handleQueryChange = vi.fn();
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Header query="" onQueryChange={handleQueryChange} />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText('Tìm tài liệu...');
    await user.type(searchInput, 'Architecture');

    expect(handleQueryChange).toHaveBeenCalled();
  });

  it('triggers onToggleMenu when mobile menu button is clicked', async () => {
    const handleToggleMenu = vi.fn();
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Header onToggleMenu={handleToggleMenu} />
      </MemoryRouter>
    );

    const menuButton = screen.getByRole('button', { name: /mở menu/i });
    await user.click(menuButton);

    expect(handleToggleMenu).toHaveBeenCalledTimes(1);
  });
});
