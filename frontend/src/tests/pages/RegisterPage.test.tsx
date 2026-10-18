import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { RegisterPage } from '../../pages/RegisterPage/RegisterPage';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

describe('RegisterPage Component', () => {
  it('renders register page with back button and form', () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    const backButton = screen.getByRole('button', { name: /Quay lại/i });
    expect(backButton).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: /Tạo tài khoản mới/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Đăng ký/i })).toBeInTheDocument();
  });

  it('navigates back when clicking back button', () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    const backButton = screen.getByRole('button', { name: /Quay lại/i });
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalled();
  });
});
