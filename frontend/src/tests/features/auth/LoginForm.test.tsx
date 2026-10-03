import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../../../features/auth/components/LoginForm';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
  Toaster: () => null,
}));

describe('LoginForm Component', () => {
    it('renders all form fields, labels, and Google sign-in button', () => {
        render(<LoginForm />);

        expect(screen.getByRole('heading', { name: /Đăng nhập tài khoản/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Mật khẩu/i, { selector: 'input' })).toBeInTheDocument();
        expect(screen.getByText(/Ghi nhớ đăng nhập/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /^Đăng nhập$/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Đăng nhập nhanh qua Google/i })).toBeInTheDocument();
    });

    it('shows error messages when submitting empty form', async () => {
        render(<LoginForm />);

        const submitBtn = screen.getByRole('button', { name: /^Đăng nhập$/i });
        fireEvent.click(submitBtn);

        expect(await screen.findByText(/Vui lòng nhập email của bạn/i)).toBeInTheDocument();
        expect(screen.getByText(/Vui lòng nhập mật khẩu/i)).toBeInTheDocument();
    });

    it('validates email format', async () => {
        render(<LoginForm />);

        const emailInput = screen.getByLabelText(/Email/i);
        await userEvent.type(emailInput, 'invalid-email');

        const submitBtn = screen.getByRole('button', { name: /^Đăng nhập$/i });
        fireEvent.click(submitBtn);

        expect(await screen.findByText(/Địa chỉ email không hợp lệ/i)).toBeInTheDocument();
    });

    it('toggles password visibility when clicking eye button', async () => {
        render(<LoginForm />);

        const passwordInput = screen.getByLabelText(/Mật khẩu/i, { selector: 'input' }) as HTMLInputElement;
        expect(passwordInput.type).toBe('password');

        const toggleBtn = screen.getByRole('button', { name: /Hiện mật khẩu/i });
        await userEvent.click(toggleBtn);

        expect(passwordInput.type).toBe('text');
    });

    it('calls onLoginSuccess on valid submission', async () => {
        const handleSuccess = vi.fn();
        render(<LoginForm onLoginSuccess={handleSuccess} />);

        const emailInput = screen.getByLabelText(/Email/i);
        const passwordInput = screen.getByLabelText(/Mật khẩu/i, { selector: 'input' });

        await userEvent.type(emailInput, 'test@university.edu.vn');
        await userEvent.type(passwordInput, 'secret123');

        const submitBtn = screen.getByRole('button', { name: /^Đăng nhập$/i });
        await userEvent.click(submitBtn);

        await waitFor(() => {
            expect(handleSuccess).toHaveBeenCalledWith({
                email: 'test@university.edu.vn',
                rememberMe: false,
            });
        });
    });

    it('triggers Google login callback when clicking Google button', async () => {
        const handleGoogle = vi.fn().mockResolvedValue(undefined);
        render(<LoginForm onGoogleLogin={handleGoogle} />);

        const googleBtn = screen.getByRole('button', { name: /Đăng nhập nhanh qua Google/i });
        await userEvent.click(googleBtn);

        expect(handleGoogle).toHaveBeenCalled();
    });
});
