import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { VerifyOtpForm } from '../../../features/auth/components/VerifyOtpForm';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
  Toaster: () => null,
}));

vi.mock('../../../features/auth/services/accountAuthService', () => ({
  accountAuthService: {
    verifyOtp: vi.fn().mockResolvedValue({ success: true, message: 'Kích hoạt thành công' }),
    forgotPassword: vi.fn().mockResolvedValue({ success: true, message: 'Mã OTP mới đã gửi' }),
  },
}));

describe('VerifyOtpForm Component', () => {
  it('renders OTP inputs, email indicator, and action buttons', () => {
    render(
      <MemoryRouter>
        <VerifyOtpForm initialEmail="student@university.edu.vn" />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Xác thực mã OTP/i })).toBeInTheDocument();
    expect(screen.getByText(/Email nhận mã:/i)).toBeInTheDocument();
    expect(screen.getByText('student@university.edu.vn')).toBeInTheDocument();

    const inputs = screen.getAllByRole('textbox').filter((el) => (el as HTMLInputElement).maxLength === 1);
    expect(inputs.length).toBe(6);

    expect(screen.getByRole('button', { name: /Xác nhận/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gửi lại mã/i })).toBeInTheDocument();
  });

  it('handles digit input across OTP boxes and enables confirmation', async () => {
    const handleSuccess = vi.fn();
    render(
      <MemoryRouter>
        <VerifyOtpForm initialEmail="student@university.edu.vn" onVerifySuccess={handleSuccess} />
      </MemoryRouter>
    );

    const inputs = screen.getAllByRole('textbox').filter((el) => (el as HTMLInputElement).maxLength === 1);
    expect(inputs.length).toBe(6);

    // Type digits into each box
    for (let i = 0; i < 6; i++) {
      await userEvent.type(inputs[i], `${i + 1}`);
    }

    const confirmBtn = screen.getByRole('button', { name: /Xác nhận/i });
    expect(confirmBtn).not.toBeDisabled();

    await userEvent.click(confirmBtn);

    await waitFor(() => {
      expect(handleSuccess).toHaveBeenCalled();
    });
  });

  it('allows editing and updating the target email address', async () => {
    render(
      <MemoryRouter>
        <VerifyOtpForm initialEmail="initial@university.edu.vn" />
      </MemoryRouter>
    );

    const changeBtn = screen.getByRole('button', { name: /Thay đổi/i });
    await userEvent.click(changeBtn);

    const emailInput = screen.getByPlaceholderText(/Nhập email của bạn.../i);
    expect(emailInput).toBeInTheDocument();
  });
});
