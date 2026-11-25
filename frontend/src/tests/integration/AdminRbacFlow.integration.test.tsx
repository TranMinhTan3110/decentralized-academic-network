import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import { AuthProvider } from '../../context/AuthContext';
import { ProtectedRoute } from '../../routes/ProtectedRoute';
import { MainLayout } from '../../components/layout/MainLayout/MainLayout';
import { AdminLayout } from '../../components/admin/layout/AdminLayout/AdminLayout';
import { LoginPage } from '../../pages/LoginPage/LoginPage';
import { authService } from '../../services/authService';
import { documentService } from '../../services/documentService';

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="current-location">{location.pathname + location.search}</div>;
}

function TestApp({ initialEntries }: { initialEntries: string[] }) {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <LocationDisplay />
        <Routes>
          <Route
            path="/"
            element={
              <MainLayout hideFooter>
                <div>User Home Content</div>
              </MainLayout>
            }
          />
          <Route
            path="/explore"
            element={
              <MainLayout hideFooter>
                <div>Explore Content</div>
              </MainLayout>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminLayout title="Tổng quan quản trị" openReportsCount={2}>
                  <div>Admin Dashboard Content</div>
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminLayout title="Quản lý người dùng" openReportsCount={2}>
                  <div>Admin Users Content</div>
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminLayout title="Cài đặt Admin" openReportsCount={2}>
                  <div>Admin Settings Content</div>
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminLayout title="Báo cáo vi phạm" openReportsCount={2}>
                  <div>Admin Reports Content</div>
                </AdminLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Admin & User RBAC Full Integration Flow', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.spyOn(documentService, 'getAdminReports').mockResolvedValue({
      content: [],
      pageNumber: 0,
      pageSize: 10,
      totalElements: 0,
      totalPages: 0,
      last: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('redirects unauthenticated guest from /admin/users to /login with redirect query', () => {
    render(<TestApp initialEntries={['/admin/users']} />);

    expect(screen.getByTestId('current-location')).toHaveTextContent('/login?redirect=%2Fadmin%2Fusers');
    expect(screen.queryByText('Admin Users Content')).not.toBeInTheDocument();
  });

  it('blocks regular USER on /admin with 403 screen, hides admin link on User UI, and supports switching account', async () => {
    const user = userEvent.setup();
    localStorage.setItem('accessToken', 'user-jwt-token');
    localStorage.setItem(
      'currentUser',
      JSON.stringify({
        id: 'user-001',
        email: 'student@dedocu.vn',
        username: 'student01',
        fullName: 'Sinh Viên Thường',
        role: 'USER',
      })
    );

    render(<TestApp initialEntries={['/admin']} />);

    // 1. Blocked with 403 Forbidden screen
    expect(screen.getByText(/Bạn không có quyền Quản trị viên/i)).toBeInTheDocument();
    expect(screen.queryByText('Admin Dashboard Content')).not.toBeInTheDocument();

    // 2. Click "Về trang chủ" -> navigates to "/" and hides Admin Sidebar link
    await user.click(screen.getByRole('button', { name: /Về trang chủ/i }));
    expect(screen.getByTestId('current-location')).toHaveTextContent('/');
    expect(screen.getByText('User Home Content')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Trang quản trị Admin/i })).not.toBeInTheDocument();
  });

  it('clears session and redirects to /login when USER clicks "Đổi tài khoản" on 403 screen', async () => {
    const user = userEvent.setup();
    localStorage.setItem('accessToken', 'user-jwt-token');
    localStorage.setItem(
      'currentUser',
      JSON.stringify({
        id: 'user-002',
        email: 'student2@dedocu.vn',
        username: 'student02',
        fullName: 'Sinh Viên 2',
        role: 'USER',
      })
    );

    render(<TestApp initialEntries={['/admin']} />);

    await user.click(screen.getByRole('button', { name: /Đổi tài khoản/i }));

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('currentUser')).toBeNull();
    expect(screen.getByTestId('current-location')).toHaveTextContent('/login?redirect=%2Fadmin');
  });

  it('allows ADMIN to switch seamlessly between User UI and Admin Portal, and logs out cleanly to /login', async () => {
    const user = userEvent.setup();
    vi.spyOn(Swal, 'fire').mockResolvedValue({ isConfirmed: true } as any);

    localStorage.setItem('accessToken', 'admin-jwt-token');
    localStorage.setItem('dedocu_user_role', 'ADMIN');
    localStorage.setItem(
      'currentUser',
      JSON.stringify({
        id: '20000000-0000-0000-0000-000000000002',
        email: 'admin.minhtan@dedocu.vn',
        username: 'admin_tranminhtan',
        fullName: 'Trần Minh Tấn (Admin)',
        role: 'ADMIN',
      })
    );

    render(<TestApp initialEntries={['/']} />);

    // 1. Admin sees "Trang quản trị Admin" on User Sidebar
    const adminPortalLink = screen.getByRole('link', { name: /Trang quản trị Admin/i });
    expect(adminPortalLink).toBeInTheDocument();

    // 2. Click enters Admin Portal
    await user.click(adminPortalLink);
    expect(screen.getByTestId('current-location')).toHaveTextContent('/admin');
    expect(screen.getByText('Admin Dashboard Content')).toBeInTheDocument();

    // 3. Click "Giao diện học tập" switches back to User UI
    await user.click(screen.getByRole('link', { name: /Giao diện học tập/i }));
    expect(screen.getByTestId('current-location')).toHaveTextContent('/');
    expect(screen.getByText('User Home Content')).toBeInTheDocument();

    // 4. Go back to Admin Portal and click Logout
    await user.click(screen.getByRole('link', { name: /Trang quản trị Admin/i }));
    expect(screen.getByTestId('current-location')).toHaveTextContent('/admin');

    await user.click(screen.getByRole('button', { name: /Đăng xuất/i }));

    await waitFor(() => {
      expect(screen.getByTestId('current-location')).toHaveTextContent('/login');
    });

    // Session & legacy keys completely wiped
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('currentUser')).toBeNull();
    expect(localStorage.getItem('dedocu_user_role')).toBeNull();
  });

  it('redirects ADMIN to /admin after login', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'login').mockResolvedValue({
      accessToken: 'fresh-admin-token',
      tokenType: 'Bearer',
      user: {
        id: '20000000-0000-0000-0000-000000000002',
        email: 'admin.minhtan@dedocu.vn',
        username: 'admin_tranminhtan',
        fullName: 'Trần Minh Tấn (Admin)',
        role: 'ADMIN',
      },
    });

    render(<TestApp initialEntries={['/login']} />);

    await user.type(screen.getByPlaceholderText(/name@example.com/i), 'admin.minhtan@dedocu.vn');
    await user.type(screen.getByPlaceholderText(/Nhập mật khẩu của bạn/i), 'Password@123');
    await user.click(screen.getByRole('button', { name: /^Đăng nhập$/i }));

    await waitFor(
      () => {
        expect(screen.getByTestId('current-location')).toHaveTextContent('/admin');
      },
      { timeout: 2000 }
    );
    expect(screen.getByText('Admin Dashboard Content')).toBeInTheDocument();
  });

  it('prevents regular USER from redirecting to /admin after login and routes to /explore instead', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'login').mockResolvedValue({
      accessToken: 'fresh-user-token',
      tokenType: 'Bearer',
      user: {
        id: 'user-999',
        email: 'student@dedocu.vn',
        username: 'student999',
        fullName: 'Sinh Viên Test',
        role: 'USER',
      },
    });

    render(<TestApp initialEntries={['/login?redirect=%2Fadmin']} />);

    await user.type(screen.getByPlaceholderText(/name@example.com/i), 'student@dedocu.vn');
    await user.type(screen.getByPlaceholderText(/Nhập mật khẩu của bạn/i), 'Password@123');
    await user.click(screen.getByRole('button', { name: /^Đăng nhập$/i }));

    await waitFor(
      () => {
        expect(screen.getByTestId('current-location')).toHaveTextContent('/explore');
      },
      { timeout: 2000 }
    );
    expect(screen.getByText('Explore Content')).toBeInTheDocument();
  });
});
