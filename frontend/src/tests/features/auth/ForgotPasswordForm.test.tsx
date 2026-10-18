import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ForgotPasswordForm } from '../../../features/auth/components/ForgotPasswordForm';

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
    forgotPassword: vi.fn().mockResolvedValue({ success: true, message: 'OTP đã gửi' }),
    resetPassword: vi.fn().mockResolvedValue({ success: true, message: 'Đổi mật khẩu thành công' }),
  },
}));

describe('ForgotPasswordForm Component', () => {
  it('renders Step 1 with email input and "Gửi mã" button', () => {
    render(
      <MemoryRouter>
        <ForgotPasswordForm />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Quên mật khẩu/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email tài khoản/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gửi mã/i })).toBeInTheDocument();
  });

  it('advances to Step 2 after valid email submission', async () => {
    render(
      <MemoryRouter>
        <ForgotPasswordForm />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText(/Email tài khoản/i), 'user@university.edu.vn');
    await userEvent.click(screen.getByRole('button', { name: /Gửi mã/i }));

    expect(await screen.findByLabelText(/Mã OTP/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Mật khẩu mới/i, { selector: 'input' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Xác nhận mật khẩu mới/i, { selector: 'input' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Đổi mật khẩu/i })).toBeInTheDocument();
  });

  it('validates matching password and confirmation in Step 2', async () => {
    render(
      <MemoryRouter>
        <ForgotPasswordForm />
      </MemoryRouter>
    );

    // Step 1: Submit email
    await userEvent.type(screen.getByLabelText(/Email tài khoản/i), 'user@university.edu.vn');
    await userEvent.click(screen.getByRole('button', { name: /Gửi mã/i }));

    // Step 2: Mismatched password
    const otpInput = await screen.findByLabelText(/Mã OTP/i);
    await userEvent.type(otpInput, '123456');

    const newPassInput = screen.getByLabelText(/^Mật khẩu mới/i, { selector: 'input' });
    await userEvent.type(newPassInput, 'newpass123');

    const confirmPassInput = screen.getByLabelText(/Xác nhận mật khẩu mới/i, { selector: 'input' });
    await userEvent.type(confirmPassInput, 'wrongpass123');

    await userEvent.click(screen.getByRole('button', { name: /Đổi mật khẩu/i }));

    expect(await screen.findByText(/Mật khẩu xác nhận không trùng khớp/i)).toBeInTheDocument();
  });

  it('calls onSuccess when reset password succeeds in Step 2', async () => {
    const handleSuccess = vi.fn();
    render(
      <MemoryRouter>
        <ForgotPasswordForm onSuccess={handleSuccess} />
      </MemoryRouter>
    );

    // Step 1
    await userEvent.type(screen.getByLabelText(/Email tài khoản/i), 'user@university.edu.vn');
    await userEvent.click(screen.getByRole('button', { name: /Gửi mã/i }));

    // Step 2
    const otpInput = await screen.findByLabelText(/Mã OTP/i);
    await userEvent.type(otpInput, '123456');

    const newPassInput = screen.getByLabelText(/^Mật khẩu mới/i, { selector: 'input' });
    await userEvent.type(newPassInput, 'newpass123');

    const confirmPassInput = screen.getByLabelText(/Xác nhận mật khẩu mới/i, { selector: 'input' });
    await userEvent.type(confirmPassInput, 'newpass123');

    await userEvent.click(screen.getByRole('button', { name: /Đổi mật khẩu/i }));

    await waitFor(() => {
      expect(handleSuccess).toHaveBeenCalled();
    });
  });
});
