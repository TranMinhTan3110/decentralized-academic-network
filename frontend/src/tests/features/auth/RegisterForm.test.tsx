import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RegisterForm } from '../../../features/auth/components/RegisterForm';

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
  },
}));

describe('RegisterForm Component', () => {
  it('renders all register form fields, labels, and buttons', () => {
    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Tạo tài khoản mới/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Họ tên/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Mật khẩu/i, { selector: 'input' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Chuyên ngành/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Đăng ký/i })).toBeInTheDocument();
  });

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

  it('validates email format in register form', async () => {
    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/Email/i);
    await userEvent.type(emailInput, 'invalid-email');

    const submitBtn = screen.getByRole('button', { name: /Đăng ký/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Địa chỉ email không đúng định dạng/i)).toBeInTheDocument();
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
