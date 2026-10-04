import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SettingsPage } from '../../pages/SettingsPage/SettingsPage';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
  Toaster: () => null,
}));

describe('SettingsPage Component', () => {
  it('renders settings layout with title and navigation tabs', () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Cài đặt tài khoản/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Hồ sơ cá nhân/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mật khẩu & Bảo mật/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tùy chỉnh thông báo/i })).toBeInTheDocument();
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

    // Click Notifications tab
    const notifyTab = screen.getByRole('button', { name: /Tùy chỉnh thông báo/i });
    fireEvent.click(notifyTab);

    expect(screen.getByText(/Thông báo đẩy trên trình duyệt/i)).toBeInTheDocument();
  });

  it('handles profile saving submission', async () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    const nameInput = screen.getByLabelText(/Tên hiển thị/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Nguyễn Văn A');

    const saveBtn = screen.getByRole('button', { name: /Lưu thay đổi/i });
    await userEvent.click(saveBtn);

    await waitFor(() => {
      expect(saveBtn).not.toBeDisabled();
    });
  });
});
