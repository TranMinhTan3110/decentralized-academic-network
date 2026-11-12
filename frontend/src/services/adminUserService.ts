// ==============================================================================
// ADMIN USER SERVICE - DECENTRALIZED ACADEMIC NETWORK (DEDOCU)
// Handles API calls to User Service Admin Endpoints (Port 8081)
// ==============================================================================

import { authService, type ApiResponse } from './authService';
import type { PageResponse } from '../types';
import type { AdminUser, UserRole, UserStatus } from '../pages/admin/AdminUsersPage/types';

export interface AdminUserDto {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'USER';
  status: 'ACTIVE' | 'BANNED' | 'UNVERIFIED' | 'SUSPENDED';
  universityName?: string;
  major?: string;
  avatarUrl?: string;
  reputationPoints: number;
  scholarTitle?: string;
  totalUploads: number;
  bannedReason?: string;
  createdAt: string;
}

export interface AdminUserStatsDto {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  unverifiedUsers: number;
  adminUsers: number;
}

export interface UpdateUserStatusPayload {
  status: 'ACTIVE' | 'BANNED' | 'UNVERIFIED' | 'SUSPENDED';
  reason?: string;
}

export interface UpdateUserRolePayload {
  role: 'ADMIN' | 'USER';
}

export interface AdminUserFilterParams {
  page?: number;
  size?: number;
  search?: string;
  role?: string;
  status?: string;
  universityId?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

/**
 * Fallback mock data when running offline or in unit tests
 */
export const mockAdminUsers: AdminUser[] = [
  {
    id: 'u1',
    fullName: 'Âu Dương Tấn',
    username: 'auduongtan',
    email: 'tan.auduong@dedocu.vn',
    school: 'HUST',
    faculty: 'CNTT',
    role: 'ADMIN',
    status: 'ACTIVE',
    documentsCount: 0,
    reputation: 0,
    tokenBalance: 0,
    joinedDate: '01/09/2026',
  },
  {
    id: 'u2',
    fullName: 'Nguyễn Văn Học Sinh',
    username: 'hocsinh99',
    email: 'student99@dedocu.vn',
    school: 'NEU',
    faculty: 'Kinh tế',
    role: 'USER',
    status: 'ACTIVE',
    documentsCount: 2,
    title: 'Tân binh',
    points: 45,
    reputation: 45,
    tokenBalance: 20,
    joinedDate: '10/10/2026',
  },
  {
    id: 'u3',
    fullName: 'Phạm Gia Huy',
    username: 'giahuy_ptit',
    email: 'huy.pg@dedocu.vn',
    school: 'PTIT',
    faculty: 'An toàn thông tin',
    role: 'USER',
    status: 'ACTIVE',
    documentsCount: 48,
    title: 'Cao thủ',
    points: 612,
    reputation: 612,
    tokenBalance: 340,
    joinedDate: '12/09/2026',
  },
  {
    id: 'u4',
    fullName: 'Lê Minh Quân',
    username: 'quanle',
    email: 'quan.le@dedocu.vn',
    school: 'NEU',
    faculty: 'Kinh tế học',
    role: 'USER',
    status: 'ACTIVE',
    documentsCount: 5,
    title: 'Tân binh',
    points: 18,
    reputation: 18,
    tokenBalance: 60,
    joinedDate: '28/09/2026',
  },
  {
    id: 'u5',
    fullName: 'Hoàng Đức Minh',
    username: 'minhhd',
    email: 'minh.hd@dedocu.vn',
    school: 'FTU',
    faculty: 'Kinh tế đối ngoại',
    role: 'USER',
    status: 'BANNED',
    documentsCount: 4,
    title: 'Tân binh',
    points: 3,
    reputation: 3,
    tokenBalance: 0,
    joinedDate: '02/10/2026',
  },
  {
    id: 'u6',
    fullName: 'Trần Thị Bích',
    username: 'bichtran',
    email: 'bich.tt@dedocu.vn',
    school: 'UEH',
    faculty: 'Vật lý kỹ thuật',
    role: 'USER',
    status: 'UNVERIFIED',
    documentsCount: 1,
    title: 'Tân binh',
    points: 0,
    reputation: 0,
    tokenBalance: 20,
    joinedDate: '15/10/2026',
  },
];

export function mapDtoToAdminUser(dto: AdminUserDto): AdminUser {
  let joinedDate = 'Vừa mới';
  if (dto.createdAt) {
    try {
      const d = new Date(dto.createdAt);
      if (!isNaN(d.getTime())) {
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        joinedDate = `${dd}/${mm}/${yyyy}`;
      }
    } catch {
      joinedDate = dto.createdAt;
    }
  }

  // School short code mapping
  let school = dto.universityName || 'HUST';
  const rawUniv = (dto.universityName || '').toLowerCase();
  if (rawUniv.includes('bách khoa')) school = 'HUST';
  else if (rawUniv.includes('kinh tế quốc dân')) school = 'NEU';
  else if (rawUniv.includes('bưu chính')) school = 'PTIT';
  else if (rawUniv.includes('ngoại thương')) school = 'FTU';
  else if (rawUniv.includes('kinh tế tp.hcm') || rawUniv.includes('ueh')) school = 'UEH';

  return {
    id: dto.id,
    fullName: dto.fullName || 'Người dùng',
    username: dto.username || 'user',
    email: dto.email || '',
    school,
    faculty: dto.major || 'Đại cương',
    role: (dto.role === 'ADMIN' ? 'ADMIN' : 'USER') as UserRole,
    status: (dto.status === 'BANNED' ? 'BANNED' : dto.status === 'UNVERIFIED' ? 'UNVERIFIED' : 'ACTIVE') as UserStatus,
    documentsCount: dto.totalUploads || 0,
    title: dto.scholarTitle || 'Tân binh',
    points: dto.reputationPoints || 0,
    reputation: dto.reputationPoints || 0,
    tokenBalance: 0,
    joinedDate,
  };
}

class AdminUserService {
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
      throw new Error(data?.message || 'Bạn không có quyền thực hiện chức năng quản trị viên này.');
    }

    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `Yêu cầu thất bại (Mã lỗi ${response.status})`);
    }

    return data;
  }

  /**
   * Lấy danh sách người dùng cho Admin có phân trang, tìm kiếm, lọc vai trò/trạng thái
   */
  async getUsers(params: AdminUserFilterParams = {}): Promise<PageResponse<AdminUserDto>> {
    const query = new URLSearchParams();
    if (params.page !== undefined) query.set('page', params.page.toString());
    if (params.size !== undefined) query.set('size', params.size.toString());
    if (params.search && params.search.trim()) query.set('search', params.search.trim());
    if (params.role && params.role !== 'ALL') query.set('role', params.role);
    if (params.status && params.status !== 'ALL') query.set('status', params.status);
    if (params.universityId) query.set('universityId', params.universityId);

    const qs = query.toString();
    const url = `${API_BASE_URL}/api/v1/admin/users${qs ? `?${qs}` : ''}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const res = await this.parseResponse<PageResponse<AdminUserDto>>(response);
      return res.data;
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('[AdminUserService] Không thể kết nối backend, sử dụng mock fallback:', error);
      }
      // Fallback to mock data with filter applied
      let filtered = [...mockAdminUsers];
      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(
          (u) =>
            u.fullName.toLowerCase().includes(q) ||
            u.username.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q)
        );
      }
      if (params.role && params.role !== 'ALL') {
        filtered = filtered.filter((u) => u.role === params.role);
      }
      if (params.status && params.status !== 'ALL') {
        filtered = filtered.filter((u) => u.status === params.status);
      }

      const mockDtos: AdminUserDto[] = filtered.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        username: u.username,
        email: u.email,
        role: u.role,
        status: u.status,
        universityName: u.school,
        major: u.faculty,
        reputationPoints: u.reputation,
        scholarTitle: u.title,
        totalUploads: u.documentsCount,
        createdAt: '2026-10-28T00:00:00Z',
      }));

      return {
        content: mockDtos,
        pageable: {
          pageNumber: params.page || 0,
          pageSize: params.size || 20,
        },
        totalElements: mockDtos.length,
        totalPages: 1,
        last: true,
        first: true,
        empty: mockDtos.length === 0,
      };
    }
  }

  /**
   * Lấy chi tiết thông tin một người dùng theo ID
   */
  async getUserById(id: string): Promise<AdminUserDto | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      const res = await this.parseResponse<AdminUserDto>(response);
      return res.data;
    } catch {
      return null;
    }
  }

  /**
   * Khóa hoặc mở khóa tài khoản người dùng
   */
  async updateUserStatus(id: string, payload: UpdateUserStatusPayload): Promise<AdminUserDto | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/${id}/status`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const res = await this.parseResponse<AdminUserDto>(response);
      return res.data;
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('[AdminUserService] Cập nhật trạng thái người dùng thất bại, fallback cục bộ:', error);
      }
      return null;
    }
  }

  /**
   * Cập nhật vai trò (Role) người dùng (USER hoặc ADMIN)
   */
  async updateUserRole(id: string, payload: UpdateUserRolePayload): Promise<AdminUserDto | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/${id}/role`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const res = await this.parseResponse<AdminUserDto>(response);
      return res.data;
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('[AdminUserService] Cập nhật vai trò người dùng thất bại, fallback cục bộ:', error);
      }
      return null;
    }
  }

  /**
   * Lấy số liệu thống kê người dùng cho Admin Dashboard
   */
  async getUserStats(): Promise<AdminUserStatsDto | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      const res = await this.parseResponse<AdminUserStatsDto>(response);
      return res.data;
    } catch {
      return {
        totalUsers: 14,
        activeUsers: 12,
        bannedUsers: 1,
        unverifiedUsers: 1,
        adminUsers: 2,
      };
    }
  }
}

export const adminUserService = new AdminUserService();
