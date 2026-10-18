import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { ForgotPasswordPage } from '../../pages/ForgotPasswordPage/ForgotPasswordPage';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

describe('ForgotPasswordPage Component', () => {
  it('renders forgot password page with back button and form', () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>
    );

    const backButton = screen.getByRole('button', { name: /Quay lại/i });
    expect(backButton).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: /Quên mật khẩu/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Gửi mã/i })).toBeInTheDocument();
  });

  it('navigates back when clicking back button', () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>
    );

    const backButton = screen.getByRole('button', { name: /Quay lại/i });
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalled();
  });
});
