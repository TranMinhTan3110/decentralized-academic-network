// ==============================================================================
// USER SERVICE - DECENTRALIZED ACADEMIC NETWORK (DEDOCU)
// Handles API calls to User Service Profile & Security Endpoints
// ==============================================================================

import { authService, type ApiResponse, type UserDto } from './authService';
import type { AuthorSummary } from '../types';

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

  /**
   * Lấy thông tin hồ sơ công khai của người dùng khác theo username hoặc ID
   */
  async getPublicProfile(identifier: string): Promise<UserDto> {
    const clean = identifier.startsWith('@') ? identifier.slice(1) : identifier;
    const response = await fetch(`${API_BASE_URL}/api/v1/users/public/${encodeURIComponent(clean)}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const data = await this.parseResponse<UserDto>(response);
    return data.data;
  }

  /**
   * Lấy danh sách huy hiệu của người dùng
   */
  async getUserBadges(identifier: string) {
    const clean = identifier.startsWith('@') ? identifier.slice(1) : identifier;
    const response = await fetch(`${API_BASE_URL}/api/v1/users/${encodeURIComponent(clean)}/badges`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const data = await this.parseResponse<import('./authService').BadgeDto[]>(response);
    return data.data;
  }

  /**
   * Lấy toàn bộ danh mục huy hiệu trong hệ thống DeDocu
   */
  async getBadgeCatalog(): Promise<import('./authService').BadgeDto[]> {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/badges/catalog`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const data = await this.parseResponse<import('./authService').BadgeDto[]>(response);
    return data.data;
  }

  /**
   * Kiểm tra xem người dùng hiện tại đã follow user này chưa
   */
  async isFollowing(identifier: string): Promise<boolean> {
    try {
      const clean = identifier.startsWith('@') ? identifier.slice(1) : identifier;
      const response = await fetch(`${API_BASE_URL}/api/v1/users/${encodeURIComponent(clean)}/is-following`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await this.parseResponse<boolean>(response);
      return Boolean(data.data);
    } catch {
      return false;
    }
  }

  /**
   * Bấm Theo dõi / Hủy theo dõi một người dùng
   */
  async toggleFollow(identifier: string): Promise<{ isFollowing: boolean; followerCount: number; followingCount: number }> {
    const clean = identifier.startsWith('@') ? identifier.slice(1) : identifier;
    const response = await fetch(`${API_BASE_URL}/api/v1/users/${encodeURIComponent(clean)}/toggle-follow`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    const data = await this.parseResponse<{ isFollowing: boolean; followerCount: number; followingCount: number }>(response);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dedocu:follow-changed', { detail: { identifier: clean, ...data.data } }));
    }
    return data.data;
  }

  /**
   * Lấy danh sách ID (UUID) những người mà user đang theo dõi
   */
  async getFollowingIds(userId: string): Promise<string[]> {
    if (!userId) return [];
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/${encodeURIComponent(userId)}/following-ids`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) return [];
      const json = (await response.json()) as ApiResponse<string[]>;
      return Array.isArray(json?.data) ? json.data : [];
    } catch {
      return [];
    }
  }

  /**
   * Lấy danh sách học giả gợi ý theo dõi từ Backend (Port 8081)
   */
  async getSuggestedUsers(limit: number = 5): Promise<AuthorSummary[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/suggested?limit=${limit}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) return [];
      const json = (await response.json()) as ApiResponse<AuthorSummary[]>;
      return Array.isArray(json?.data) ? json.data : [];
    } catch {
      return [];
    }
  }
}

export const userService = new UserService();
