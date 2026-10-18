import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { VerifyOtpPage } from '../../pages/VerifyOtpPage/VerifyOtpPage';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

describe('VerifyOtpPage Component', () => {
  it('renders verify OTP page with back button and form', () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    render(
      <MemoryRouter initialEntries={['/verify-otp?email=student@university.edu.vn']}>
        <VerifyOtpPage />
      </MemoryRouter>
    );

    const backButton = screen.getByRole('button', { name: /Quay lại/i });
    expect(backButton).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: /Xác thực mã OTP/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Xác nhận/i })).toBeInTheDocument();
  });

  it('navigates back when clicking back button', () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    render(
      <MemoryRouter>
        <VerifyOtpPage />
      </MemoryRouter>
    );

    const backButton = screen.getByRole('button', { name: /Quay lại/i });
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalled();
  });
});
