// ==============================================================================
// USER SERVICE - DECENTRALIZED ACADEMIC NETWORK (DEDOCU)
// Handles API calls to User Service Profile & Security Endpoints
// ==============================================================================

import { authService, type ApiResponse, type UserDto } from './authService';

export interface UpdateProfileRequest {
  fullName: string;
  major?: string;
  bio?: string;
  universityName?: string;
  avatarUrl?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

class UserService {
  private getAuthHeaders(): HeadersInit {
    const token = authService.getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private async parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
    let data: ApiResponse<T> | null = null;
    const text = await response.text();
    if (text) {
      try {
        data = JSON.parse(text) as ApiResponse<T>;
      } catch {
        data = null;
      }
    }

    if (response.status === 401 || response.status === 403) {
      authService.logout();
      window.dispatchEvent(new Event('storage'));
      throw new Error(data?.message || 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.');
    }

    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `Yêu cầu thất bại (Mã lỗi ${response.status})`);
    }

    return data;
  }

  /**
   * Lấy profile đầy đủ của tài khoản hiện tại từ Backend (Port 8081)
   */
  async getProfile(): Promise<UserDto> {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const data = await this.parseResponse<UserDto>(response);
    return data.data;
  }

  /**
   * Cập nhật thông tin cá nhân (Tên, chuyên ngành, tiểu sử, trường đại học, avatar)
   */
  async updateProfile(profileData: UpdateProfileRequest): Promise<UserDto> {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(profileData),
    });

    const data = await this.parseResponse<UserDto>(response);

    // Đồng bộ session local với dữ liệu mới từ backend
    authService.updateCurrentUser(data.data);

    return data.data;
  }

  /**
   * Đổi mật khẩu tài khoản
   */
  async changePassword(passData: ChangePasswordRequest): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/change-password`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(passData),
    });

    await this.parseResponse<void>(response);
  }

  /**
   * Xóa tài khoản vĩnh viễn (Soft-delete / vô hiệu hóa tài khoản)
   */
  async deleteAccount(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    await this.parseResponse<void>(response);

    // Đăng xuất và xóa phiên làm việc sau khi xóa tài khoản
    authService.logout();
  }
}

export const userService = new UserService();
