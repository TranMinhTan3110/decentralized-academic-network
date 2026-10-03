import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { LoginPage } from '../../pages/LoginPage/LoginPage';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

describe('LoginPage Component', () => {
  it('renders standalone login page without layout and with back button', () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const backButton = screen.getByRole('button', { name: /Quay lại/i });
    expect(backButton).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Đăng nhập tài khoản/i })).toBeInTheDocument();
  });

  it('navigates back when clicking back button', () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const backButton = screen.getByRole('button', { name: /Quay lại/i });
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalled();
  });
});
