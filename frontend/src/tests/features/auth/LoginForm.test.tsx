import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginForm } from '../../../features/auth/components/LoginForm';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
  Toaster: () => null,
}));

vi.mock('../../../services/authService', () => ({
  authService: {
    login: vi.fn().mockResolvedValue({
      accessToken: 'mock-token',
      tokenType: 'Bearer',
      user: {
        id: '123',
        email: 'test@university.edu.vn',
        username: 'testuser',
        fullName: 'Test User',
        role: 'USER',
      },
    }),
    loginWithGoogle: vi.fn().mockResolvedValue({
      accessToken: 'mock-google-token',
      tokenType: 'Bearer',
      user: {
        id: '456',
        email: 'test@university.edu.vn',
        username: 'googleuser',
        fullName: 'Google User',
        role: 'USER',
      },
    }),
    getCurrentUser: vi.fn().mockReturnValue(null),
    isAuthenticated: vi.fn().mockReturnValue(false),
    setSession: vi.fn(),
    logout: vi.fn(),
  },
}));

describe('LoginForm Component', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('renders all form fields, labels, and Google sign-in button', () => {
        render(
            <MemoryRouter>
                <LoginForm />
            </MemoryRouter>
        );

        expect(screen.getByRole('heading', { name: /Đăng nhập tài khoản/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Mật khẩu/i, { selector: 'input' })).toBeInTheDocument();
        expect(screen.getByText(/Ghi nhớ đăng nhập/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /^Đăng nhập$/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Đăng nhập nhanh qua Google/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Quên mật khẩu\?/i })).toHaveAttribute('href', '/forgot-password');
        expect(screen.getByRole('link', { name: /Đăng ký ngay/i })).toHaveAttribute('href', '/register');
    });

    it('shows error messages when submitting empty form', async () => {
        render(
            <MemoryRouter>
                <LoginForm />
            </MemoryRouter>
        );

        const submitBtn = screen.getByRole('button', { name: /^Đăng nhập$/i });
        fireEvent.click(submitBtn);

        expect(await screen.findByText(/Vui lòng nhập email của bạn/i)).toBeInTheDocument();
        expect(screen.getByText(/Vui lòng nhập mật khẩu/i)).toBeInTheDocument();
    });

    it('validates email format', async () => {
        render(
            <MemoryRouter>
                <LoginForm />
            </MemoryRouter>
        );

        const emailInput = screen.getByLabelText(/Email/i);
        await userEvent.type(emailInput, 'invalid-email');

        const submitBtn = screen.getByRole('button', { name: /^Đăng nhập$/i });
        fireEvent.click(submitBtn);

        expect(await screen.findByText(/Địa chỉ email không hợp lệ/i)).toBeInTheDocument();
    });

    it('toggles password visibility when clicking eye button', async () => {
        render(
            <MemoryRouter>
                <LoginForm />
            </MemoryRouter>
        );

        const passwordInput = screen.getByLabelText(/Mật khẩu/i, { selector: 'input' }) as HTMLInputElement;
        expect(passwordInput.type).toBe('password');

        const toggleBtn = screen.getByRole('button', { name: /Hiện mật khẩu/i });
        await userEvent.click(toggleBtn);

        expect(passwordInput.type).toBe('text');
    });

    it('calls onLoginSuccess on valid submission and saves remembered email', async () => {
        const handleSuccess = vi.fn();
        render(
            <MemoryRouter>
                <LoginForm onLoginSuccess={handleSuccess} />
            </MemoryRouter>
        );

        const emailInput = screen.getByLabelText(/Email/i);
        const passwordInput = screen.getByLabelText(/Mật khẩu/i, { selector: 'input' });
        const rememberCheckbox = screen.getByRole('checkbox');

        await userEvent.type(emailInput, 'test@university.edu.vn');
        await userEvent.type(passwordInput, 'secret123');
        await userEvent.click(rememberCheckbox);

        const submitBtn = screen.getByRole('button', { name: /^Đăng nhập$/i });
        await userEvent.click(submitBtn);

        await waitFor(() => {
            expect(handleSuccess).toHaveBeenCalledWith(expect.objectContaining({
                email: 'test@university.edu.vn',
                rememberMe: true,
            }));
        });

        expect(localStorage.getItem('dan_remembered_email')).toBe('test@university.edu.vn');
    });

    it('triggers Google login callback when clicking Google button', async () => {
        const handleGoogle = vi.fn().mockResolvedValue(undefined);
        render(
            <MemoryRouter>
                <LoginForm onGoogleLogin={handleGoogle} />
            </MemoryRouter>
        );

        const googleBtn = screen.getByRole('button', { name: /Đăng nhập nhanh qua Google/i });
        await userEvent.click(googleBtn);

        expect(handleGoogle).toHaveBeenCalled();
    });
});
