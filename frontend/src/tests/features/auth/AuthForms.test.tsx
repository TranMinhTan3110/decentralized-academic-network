import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RegisterForm } from '../../../features/auth/components/RegisterForm';
import { VerifyOtpForm } from '../../../features/auth/components/VerifyOtpForm';
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
    register: vi.fn().mockResolvedValue({ success: true, message: 'Đăng ký thành công' }),
    verifyOtp: vi.fn().mockResolvedValue({ success: true, message: 'Kích hoạt thành công' }),
    forgotPassword: vi.fn().mockResolvedValue({ success: true, message: 'Mã OTP đã gửi' }),
    resetPassword: vi.fn().mockResolvedValue({ success: true, message: 'Đặt lại mật khẩu thành công' }),
  },
}));

describe('AuthForms Components Unit Tests', () => {
  describe('RegisterForm Component', () => {
    it('shows error messages when submitting empty form', async () => {
      render(
        <MemoryRouter>
          <RegisterForm />
        </MemoryRouter>
      );

      const submitBtn = screen.getByRole('button', { name: /Đăng ký/i });
      fireEvent.click(submitBtn);

      expect(await screen.findByText(/Vui lòng nhập họ và tên của bạn/i)).toBeInTheDocument();
      expect(screen.getByText(/Vui lòng nhập tên người dùng \(username\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Vui lòng nhập địa chỉ email/i)).toBeInTheDocument();
      expect(screen.getByText(/Vui lòng nhập mật khẩu/i)).toBeInTheDocument();
      expect(screen.getByText(/Vui lòng chọn hoặc nhập chuyên ngành học/i)).toBeInTheDocument();
    });

    it('toggles password visibility when clicking eye button', async () => {
      render(
        <MemoryRouter>
          <RegisterForm />
        </MemoryRouter>
      );

      const passwordInput = screen.getByLabelText(/^Mật khẩu/i, { selector: 'input' }) as HTMLInputElement;
      expect(passwordInput.type).toBe('password');

      const toggleBtn = screen.getByRole('button', { name: /Hiện mật khẩu/i });
      await userEvent.click(toggleBtn);

      expect(passwordInput.type).toBe('text');
    });

    it('calls onRegisterSuccess on valid form submission', async () => {
      const handleRegisterSuccess = vi.fn();
      render(
        <MemoryRouter>
          <RegisterForm onRegisterSuccess={handleRegisterSuccess} />
        </MemoryRouter>
      );

      await userEvent.type(screen.getByLabelText(/Họ tên/i), 'Nguyễn Văn A');
      await userEvent.type(screen.getByLabelText(/Username/i), 'nguyenvana');
      await userEvent.type(screen.getByLabelText(/Email/i), 'student@university.edu.vn');
      await userEvent.type(screen.getByLabelText(/^Mật khẩu/i, { selector: 'input' }), 'password123');
      await userEvent.type(screen.getByLabelText(/Chuyên ngành/i), 'Kỹ thuật phần mềm');

      const submitBtn = screen.getByRole('button', { name: /Đăng ký/i });
      await userEvent.click(submitBtn);

      await waitFor(() => {
        expect(handleRegisterSuccess).toHaveBeenCalledWith('student@university.edu.vn');
      });
    });
  });

  describe('VerifyOtpForm Component', () => {
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

    it('allows changing the email address', async () => {
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

  describe('ForgotPasswordForm Component', () => {
    it('validates matching password and confirmation in Step 2', async () => {
      render(
        <MemoryRouter>
          <ForgotPasswordForm />
        </MemoryRouter>
      );

      // Step 1: Submit email
      await userEvent.type(screen.getByLabelText(/Email tài khoản/i), 'user@university.edu.vn');
      await userEvent.click(screen.getByRole('button', { name: /Gửi mã/i }));

      // Step 2: Test mismatching passwords
      const otpInput = await screen.findByLabelText(/Mã OTP/i);
      await userEvent.type(otpInput, '123456');

      const newPassInput = screen.getByLabelText(/^Mật khẩu mới/i, { selector: 'input' });
      await userEvent.type(newPassInput, 'newpassword123');

      const confirmPassInput = screen.getByLabelText(/Xác nhận mật khẩu mới/i, { selector: 'input' });
      await userEvent.type(confirmPassInput, 'differentpass');

      await userEvent.click(screen.getByRole('button', { name: /Đổi mật khẩu/i }));

      expect(await screen.findByText(/Mật khẩu xác nhận không trùng khớp/i)).toBeInTheDocument();
    });
  });
});
