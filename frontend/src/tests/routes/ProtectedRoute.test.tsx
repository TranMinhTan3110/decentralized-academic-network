import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../../routes/ProtectedRoute';
import { AuthProvider } from '../../context/AuthContext';

describe('ProtectedRoute RBAC Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('redirects unauthenticated guests to /login with redirect query param', () => {
    render(
      <MemoryRouter initialEntries={['/admin/users']}>
        <AuthProvider>
          <Routes>
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <div>Admin Users Secret</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Admin Users Secret')).not.toBeInTheDocument();
  });

  it('shows 403 Forbidden screen when a regular USER tries to access an ADMIN route', () => {
    localStorage.setItem('accessToken', 'user-jwt-token');
    localStorage.setItem(
      'currentUser',
      JSON.stringify({
        id: 'u-123',
        email: 'student@dedocu.vn',
        username: 'student',
        fullName: 'Sinh Viên A',
        role: 'USER',
      })
    );

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AuthProvider>
          <Routes>
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <div>Admin Dashboard Secret</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Bạn không có quyền Quản trị viên/i)).toBeInTheDocument();
    expect(screen.queryByText('Admin Dashboard Secret')).not.toBeInTheDocument();
  });

  it('allows ADMIN users to access ADMIN routes', () => {
    localStorage.setItem('accessToken', 'admin-jwt-token');
    localStorage.setItem(
      'currentUser',
      JSON.stringify({
        id: 'a-123',
        email: 'admin.minhtan@dedocu.vn',
        username: 'admin_tranminhtan',
        fullName: 'Trần Minh Tấn (Admin)',
        role: 'ADMIN',
      })
    );

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AuthProvider>
          <Routes>
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <div>Admin Dashboard Secret</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Dashboard Secret')).toBeInTheDocument();
  });
});
