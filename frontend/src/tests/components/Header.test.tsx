import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Swal from 'sweetalert2';
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

  it('renders notification popover button inside header', () => {
    render(
      <MemoryRouter>
        <Header isAuthenticated={true} />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /thông báo/i })).toBeInTheDocument();
  });

  it('prompts SweetAlert2 confirmation dialog when logout button is clicked', async () => {
    const handleLogout = vi.fn();
    const swalSpy = vi.spyOn(Swal, 'fire').mockResolvedValue({ isConfirmed: true } as any);
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Header
          isAuthenticated={true}
          currentUser={{ name: 'Au Duong Tan', email: 'tan@example.com' }}
          onLogout={handleLogout}
        />
      </MemoryRouter>
    );

    const logoutButton = screen.getByRole('button', { name: /đăng xuất/i });
    await user.click(logoutButton);

    expect(swalSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Đăng xuất?',
        icon: 'question',
        showCancelButton: true,
      })
    );

    await waitFor(() => {
      expect(handleLogout).toHaveBeenCalledTimes(1);
    });
  });
});
