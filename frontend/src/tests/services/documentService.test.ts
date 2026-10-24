import { describe, it, expect, vi, beforeEach } from 'vitest';
import { documentService } from '../../services/documentService';
import { taxonomyService } from '../../services/taxonomyService';
import { notificationService } from '../../services/notificationService';
import { apiClient } from '../../services/apiClient';

describe('Document, Taxonomy & Notification Services Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('documentService', () => {
    it('calls getFeed with correct parameters', async () => {
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({
        content: [],
        page: 0,
        size: 10,
        totalElements: 0,
        totalPages: 0,
        last: true,
      });

      await documentService.getFeed({ filter: 'latest', page: 0, size: 10 });
      expect(getSpy).toHaveBeenCalledWith(expect.stringContaining('/api/v1/documents?filter=latest&page=0&size=10'));
    });

    it('calls getDetail with document id', async () => {
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({
        id: 'doc-123',
        title: 'Test Document',
      });

      const res = await documentService.getDetail('doc-123');
      expect(getSpy).toHaveBeenCalledWith('/api/v1/documents/doc-123');
      expect(res.id).toBe('doc-123');
    });

    it('calls search with query parameter', async () => {
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({ content: [] });
      await documentService.search('Giải tích', 0, 10);
      expect(getSpy).toHaveBeenCalledWith(expect.stringContaining('/api/v1/documents/search?q=Gi%E1%BA%A3i+t%C3%ADch'));
    });

    it('calls upload with FormData and isFormData flag true', async () => {
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({ id: 'doc-uploaded' });
      const formData = new FormData();
      formData.append('title', 'Tài liệu');

      const res = await documentService.upload(formData);
      expect(postSpy).toHaveBeenCalledWith('/api/v1/documents/upload', formData, true);
      expect(res.id).toBe('doc-uploaded');
    });

    it('calls toggleLike and returns boolean status', async () => {
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({ liked: true });
      const liked = await documentService.toggleLike('doc-123');
      expect(postSpy).toHaveBeenCalledWith('/api/v1/documents/doc-123/like');
      expect(liked).toBe(true);
    });

    it('calls unlock and returns boolean status', async () => {
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({ unlocked: true });
      const unlocked = await documentService.unlock('doc-123');
      expect(postSpy).toHaveBeenCalledWith('/api/v1/documents/doc-123/unlock');
      expect(unlocked).toBe(true);
    });

    it('calls getForYou and routes to documents feed with filter for-you', async () => {
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({ content: [] });
      await documentService.getForYou(0, 10);
      expect(getSpy).toHaveBeenCalledWith(expect.stringContaining('/api/v1/documents?filter=for-you&page=0&size=10'));
    });

    it('calls report with reason and description compatible with backend', async () => {
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue(null);
      await documentService.report('doc-123', 'SPAM', 'Nội dung quảng cáo rác');
      expect(postSpy).toHaveBeenCalledWith(
        '/api/v1/documents/doc-123/report',
        expect.objectContaining({
          reason: 'SPAM',
          description: 'Nội dung quảng cáo rác',
          details: 'Nội dung quảng cáo rác',
        })
      );
    });
  });

  describe('taxonomyService', () => {
    it('fetches universities from taxonomy endpoint', async () => {
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue([
        { id: 'uni-1', name: 'Đại học Bách Khoa Hà Nội' },
      ]);

      const res = await taxonomyService.getUniversities();
      expect(getSpy).toHaveBeenCalledWith('/api/v1/universities');
      expect(res).toHaveLength(1);
    });

    it('fetches courses with area filter', async () => {
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue([
        { id: 'c-1', name: 'Kinh tế vi mô' },
      ]);

      const res = await taxonomyService.getCourses('Kinh tế');
      expect(getSpy).toHaveBeenCalledWith(expect.stringContaining('/api/v1/courses?area=Kinh+t%E1%BA%BF'));
      expect(res).toHaveLength(1);
    });
  });

  describe('notificationService', () => {
    it('returns unread count from endpoint', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({ unreadCount: 5 });
      const count = await notificationService.getUnreadCount();
      expect(count).toBe(5);
    });

    it('calls markAsRead and markAllAsRead correctly', async () => {
      const putSpy = vi.spyOn(apiClient, 'put').mockResolvedValue(null);

      await notificationService.markAsRead('notif-1');
      expect(putSpy).toHaveBeenCalledWith('/api/v1/notifications/notif-1/read');

      await notificationService.markAllAsRead();
      expect(putSpy).toHaveBeenCalledWith('/api/v1/notifications/read-all');
    });
  });
});
