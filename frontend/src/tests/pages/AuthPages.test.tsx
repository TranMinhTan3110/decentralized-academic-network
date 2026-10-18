import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { RegisterPage } from '../../pages/RegisterPage';
import { VerifyOtpPage } from '../../pages/VerifyOtpPage';
import { ForgotPasswordPage } from '../../pages/ForgotPasswordPage';
import { routesConfig } from '../../routes/routes.config';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

describe('New Auth Pages Unit Tests', () => {
  describe('RegisterPage (/register)', () => {
    it('renders all required fields and register button', () => {
      const mockNavigate = vi.fn();
      vi.mocked(useNavigate).mockReturnValue(mockNavigate);

      render(
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>
      );

      // Check fields: Họ tên, Username, Email, Mật khẩu, Chuyên ngành
      expect(screen.getByLabelText(/Họ tên/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Mật khẩu/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Chuyên ngành/i)).toBeInTheDocument();

      // Check button: Đăng ký
      const submitBtn = screen.getByRole('button', { name: /Đăng ký/i });
      expect(submitBtn).toBeInTheDocument();

      // Check Back button
      const backBtn = screen.getByRole('button', { name: /Quay lại/i });
      expect(backBtn).toBeInTheDocument();
    });
  });

  describe('VerifyOtpPage (/verify-otp)', () => {
    it('renders email text indicator, 6 OTP input boxes, and buttons: Xác nhận, Gửi lại mã', () => {
      const mockNavigate = vi.fn();
      vi.mocked(useNavigate).mockReturnValue(mockNavigate);

      render(
        <MemoryRouter initialEntries={['/verify-otp?email=student@university.edu.vn']}>
          <VerifyOtpPage />
        </MemoryRouter>
      );

      // Check email display text
      expect(screen.getByText(/Email nhận mã:/i)).toBeInTheDocument();
      expect(screen.getByText('student@university.edu.vn')).toBeInTheDocument();

      // Check 6 OTP input boxes
      const inputs = screen.getAllByRole('textbox');
      // 6 otp inputs
      expect(inputs.length).toBeGreaterThanOrEqual(6);

      // Check buttons: "Xác nhận", "Gửi lại mã"
      expect(screen.getByRole('button', { name: /Xác nhận/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Gửi lại mã/i })).toBeInTheDocument();
    });
  });

  describe('ForgotPasswordPage (/forgot-password)', () => {
    it('renders Step 1: Email input + "Gửi mã" button', () => {
      render(
        <MemoryRouter>
          <ForgotPasswordPage />
        </MemoryRouter>
      );

      // Step 1: Input Email + Button Gửi mã
      expect(screen.getByLabelText(/Email tài khoản/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Gửi mã/i })).toBeInTheDocument();
    });

    it('transitions to Step 2 when email is submitted and shows OTP, new password, confirm password, and "Đổi mật khẩu" button', async () => {
      // Mock successful fetch for forgot-password
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, message: 'OTP sent' }),
      });
      global.fetch = mockFetch;

      render(
        <MemoryRouter>
          <ForgotPasswordPage />
        </MemoryRouter>
      );

      const emailInput = screen.getByLabelText(/Email tài khoản/i);
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

      const sendBtn = screen.getByRole('button', { name: /Gửi mã/i });
      fireEvent.click(sendBtn);

      // Wait for Step 2 UI
      await waitFor(() => {
        expect(screen.getByLabelText(/Mã OTP/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^Mật khẩu mới/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Xác nhận mật khẩu mới/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Đổi mật khẩu/i })).toBeInTheDocument();
      });
    });
  });

  describe('Route declaration in routesConfig', () => {
    it('declares /register, /verify-otp, and /forgot-password with public=true and inNav=false', () => {
      const paths = routesConfig.map((r) => r.path);
      expect(paths).toContain('/register');
      expect(paths).toContain('/verify-otp');
      expect(paths).toContain('/forgot-password');

      const registerRoute = routesConfig.find((r) => r.path === '/register');
      expect(registerRoute?.public).toBe(true);
      expect(registerRoute?.inNav).toBe(false);

      const verifyOtpRoute = routesConfig.find((r) => r.path === '/verify-otp');
      expect(verifyOtpRoute?.public).toBe(true);
      expect(verifyOtpRoute?.inNav).toBe(false);

      const forgotPasswordRoute = routesConfig.find((r) => r.path === '/forgot-password');
      expect(forgotPasswordRoute?.public).toBe(true);
      expect(forgotPasswordRoute?.inNav).toBe(false);
    });
  });
});
