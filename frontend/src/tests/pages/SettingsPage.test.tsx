import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SettingsPage } from '../../pages/SettingsPage/SettingsPage';
import { userService } from '../../services';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
  Toaster: () => null,
}));

vi.mock('../../services', async () => {
  const actual = await vi.importActual<typeof import('../../services')>('../../services');
  return {
    ...actual,
    userService: {
      getProfile: vi.fn().mockResolvedValue({
        fullName: 'Nguyễn Văn A',
        email: 'test@example.com',
        universityName: 'Đại học Bách Khoa',
        major: 'Khoa học Máy tính',
        bio: 'Sinh viên IT',
        avatarUrl: '',
      }),
      updateProfile: vi.fn().mockResolvedValue({
        fullName: 'Nguyễn Văn B',
        email: 'test@example.com',
        universityName: 'Đại học Bách Khoa',
        major: 'Khoa học Máy tính',
        bio: 'Sinh viên IT',
        avatarUrl: '',
      }),
      changePassword: vi.fn().mockResolvedValue(undefined),
      deleteAccount: vi.fn().mockResolvedValue(undefined),
    },
  };
});

describe('SettingsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders settings layout with title and navigation tabs', () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Cài đặt tài khoản/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Hồ sơ cá nhân/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mật khẩu & Bảo mật/i })).toBeInTheDocument();
  });

  it('switches tabs when clicking navigation buttons', async () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    // Click Security tab
    const securityTab = screen.getByRole('button', { name: /Mật khẩu & Bảo mật/i });
    fireEvent.click(securityTab);

    expect(screen.getByRole('button', { name: /Cập nhật mật khẩu/i })).toBeInTheDocument();

    // Click Profile tab back
    const profileTab = screen.getByRole('button', { name: /Hồ sơ cá nhân/i });
    fireEvent.click(profileTab);

    expect(screen.getByRole('button', { name: /Lưu thay đổi/i })).toBeInTheDocument();
  });

  it('handles profile saving submission', async () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    const nameInput = screen.getByLabelText(/Tên hiển thị/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Nguyễn Văn B');

    const saveBtn = screen.getByRole('button', { name: /Lưu thay đổi/i });
    await userEvent.click(saveBtn);

    await waitFor(() => {
      expect(userService.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Nguyễn Văn B',
        })
      );
    });
  });

  it('handles password change submission', async () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    const securityTab = screen.getByRole('button', { name: /Mật khẩu & Bảo mật/i });
    fireEvent.click(securityTab);

    const currentPassInput = screen.getByLabelText(/Mật khẩu hiện tại/i);
    const newPassInput = screen.getByLabelText(/^Mật khẩu mới/i);
    const confirmPassInput = screen.getByLabelText(/Xác nhận mật khẩu mới/i);

    await userEvent.type(currentPassInput, 'OldPass@123');
    await userEvent.type(newPassInput, 'NewPass@456');
    await userEvent.type(confirmPassInput, 'NewPass@456');

    const submitBtn = screen.getByRole('button', { name: /Cập nhật mật khẩu/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(userService.changePassword).toHaveBeenCalledWith({
        currentPassword: 'OldPass@123',
        newPassword: 'NewPass@456',
      });
    });
  });

  it('handles account deletion confirmation and submission', async () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    const securityTab = screen.getByRole('button', { name: /Mật khẩu & Bảo mật/i });
    fireEvent.click(securityTab);

    // Initial delete button in danger zone
    const openDeleteBtn = screen.getByRole('button', { name: /Xóa tài khoản này/i });
    expect(openDeleteBtn).toBeInTheDocument();

    await userEvent.click(openDeleteBtn);

    // Confirmation dialog appears
    const confirmDeleteBtn = screen.getByRole('button', { name: /Xác nhận xóa tài khoản/i });
    expect(confirmDeleteBtn).toBeInTheDocument();

    await userEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(userService.deleteAccount).toHaveBeenCalled();
    });
  });
});
