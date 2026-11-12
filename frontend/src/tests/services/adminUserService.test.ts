import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  adminUserService,
  mapDtoToAdminUser,
  type AdminUserDto,
} from '../../services/adminUserService';
import { authService } from '../../services/authService';

describe('AdminUserService Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('mapDtoToAdminUser', () => {
    it('maps AdminUserDto to AdminUser correctly with school recognition and formatted date', () => {
      const dto: AdminUserDto = {
        id: '11111111-1111-1111-1111-111111111111',
        fullName: 'Nguyễn Văn A',
        username: 'nguyenvana',
        email: 'a@hust.edu.vn',
        role: 'ADMIN',
        status: 'ACTIVE',
        universityName: 'Đại học Bách Khoa Hà Nội',
        major: 'Kỹ thuật Máy tính',
        reputationPoints: 120,
        scholarTitle: 'Học giả Uy tín',
        totalUploads: 15,
        createdAt: '2026-10-15T08:30:00Z',
      };

      const mapped = mapDtoToAdminUser(dto);

      expect(mapped.id).toBe(dto.id);
      expect(mapped.fullName).toBe('Nguyễn Văn A');
      expect(mapped.username).toBe('nguyenvana');
      expect(mapped.email).toBe('a@hust.edu.vn');
      expect(mapped.role).toBe('ADMIN');
      expect(mapped.status).toBe('ACTIVE');
      expect(mapped.school).toBe('HUST');
      expect(mapped.faculty).toBe('Kỹ thuật Máy tính');
      expect(mapped.reputation).toBe(120);
      expect(mapped.title).toBe('Học giả Uy tín');
      expect(mapped.documentsCount).toBe(15);
      expect(mapped.joinedDate).toBe('15/10/2026');
    });

    it('maps university abbreviations for NEU, PTIT, FTU, UEH', () => {
      const baseDto: AdminUserDto = {
        id: 'user-1',
        fullName: 'Test',
        username: 'test',
        email: 'test@example.com',
        role: 'USER',
        status: 'ACTIVE',
        reputationPoints: 0,
        totalUploads: 0,
        createdAt: '2026-01-01',
      };

      expect(mapDtoToAdminUser({ ...baseDto, universityName: 'Đại học Kinh tế Quốc dân' }).school).toBe('NEU');
      expect(mapDtoToAdminUser({ ...baseDto, universityName: 'Học viện Công nghệ Bưu chính Viễn thông' }).school).toBe('PTIT');
      expect(mapDtoToAdminUser({ ...baseDto, universityName: 'Đại học Ngoại thương' }).school).toBe('FTU');
      expect(mapDtoToAdminUser({ ...baseDto, universityName: 'Đại học Kinh tế TP.HCM' }).school).toBe('UEH');
    });
  });

  describe('API calls', () => {
    it('getUsers fetches successfully when server responds', async () => {
      const mockBackendResponse = {
        success: true,
        message: 'Thành công',
        data: {
          content: [
            {
              id: 'u-backend-1',
              fullName: 'Lê Văn Backend',
              username: 'levanb',
              email: 'b@dedocu.vn',
              role: 'USER',
              status: 'ACTIVE',
              universityName: 'Đại học Bách Khoa Hà Nội',
              major: 'CNTT',
              reputationPoints: 100,
              scholarTitle: 'Tân binh',
              totalUploads: 5,
              createdAt: '2026-11-01T00:00:00Z',
            },
          ],
          pageable: { pageNumber: 0, pageSize: 20 },
          totalElements: 1,
          totalPages: 1,
          last: true,
          first: true,
          empty: false,
        },
      };

      vi.spyOn(authService, 'getAccessToken').mockReturnValue('mock-jwt-token');
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockBackendResponse),
      } as Response);

      const result = await adminUserService.getUsers({ search: 'backend', role: 'USER' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/users?search=backend&role=USER'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-jwt-token',
          }),
        })
      );
      expect(result.content).toHaveLength(1);
      expect(result.content[0].fullName).toBe('Lê Văn Backend');
    });

    it('updateUserStatus sends PUT request with status and reason', async () => {
      const mockResponse = {
        success: true,
        message: 'Thành công',
        data: {
          id: 'user-lock-id',
          status: 'BANNED',
          bannedReason: 'Vi phạm bản quyền',
        },
      };

      vi.spyOn(authService, 'getAccessToken').mockReturnValue('admin-token');
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockResponse),
      } as Response);

      await adminUserService.updateUserStatus('user-lock-id', {
        status: 'BANNED',
        reason: 'Vi phạm bản quyền',
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/users/user-lock-id/status'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ status: 'BANNED', reason: 'Vi phạm bản quyền' }),
        })
      );
    });

    it('updateUserRole sends PUT request with new role', async () => {
      const mockResponse = {
        success: true,
        message: 'Thành công',
        data: {
          id: 'user-role-id',
          role: 'ADMIN',
        },
      };

      vi.spyOn(authService, 'getAccessToken').mockReturnValue('admin-token');
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockResponse),
      } as Response);

      await adminUserService.updateUserRole('user-role-id', { role: 'ADMIN' });

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/users/user-role-id/role'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ role: 'ADMIN' }),
        })
      );
    });

    it('getUserStats returns stats from backend or fallback default', async () => {
      const mockStats = {
        success: true,
        data: {
          totalUsers: 25,
          activeUsers: 20,
          bannedUsers: 2,
          unverifiedUsers: 3,
          adminUsers: 2,
        },
      };

      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockStats),
      } as Response);

      const stats = await adminUserService.getUserStats();
      expect(stats?.totalUsers).toBe(25);
    });

    it('falls back to mock users when network fails', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

      const result = await adminUserService.getUsers({ search: 'Tấn' });
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.content[0].fullName).toContain('Tấn');
    });
  });
});
