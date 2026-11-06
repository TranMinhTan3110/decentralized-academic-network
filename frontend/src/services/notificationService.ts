// ==============================================================================
// NOTIFICATION SERVICE - DECENTRALIZED ACADEMIC NETWORK (DEDOCU)
// Handles API calls for System & Social Notifications
// ==============================================================================

import { apiClient } from './apiClient';
import { authService } from './authService';
import type { NotificationDto } from '../types';

class NotificationService {
  /**
   * Lấy danh sách thông báo của người dùng hiện tại
   */
  async getMyNotifications(): Promise<NotificationDto[]> {
    const res = await apiClient.get<NotificationDto[] | { content: NotificationDto[] }>('/api/v1/notifications?page=0&size=50');
    // Backend trả PageResponse; các client cũ kỳ vọng mảng — chuẩn hóa về mảng
    return Array.isArray(res) ? res : (res?.content ?? []);
  }

  /**
   * Lấy số lượng thông báo chưa đọc
   */
  async getUnreadCount(): Promise<number> {
    try {
      const res = await apiClient.get<{ unreadCount: number }>('/api/v1/notifications/unread-count');
      return res?.unreadCount ?? 0;
    } catch {
      return 0;
    }
  }

  /**
   * Đánh dấu 1 thông báo là đã đọc
   */
  async markAsRead(id: string): Promise<void> {
    return apiClient.put<void>(`/api/v1/notifications/${id}/read`);
  }

  /**
   * Đánh dấu tất cả thông báo là đã đọc
   */
  async markAllAsRead(): Promise<void> {
    return apiClient.put<void>('/api/v1/notifications/read-all');
  }

  /**
   * Xóa 1 thông báo của người dùng hiện tại
   */
  async deleteNotification(id: string): Promise<void> {
    return apiClient.delete<void>(`/api/v1/notifications/${id}`);
  }

  /**
   * Đăng ký nhận thông báo thời gian thực qua Server-Sent Events (SSE)
   */
  subscribeToStream(onNotification: (notification: NotificationDto) => void): () => void {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      return () => {};
    }
    const token = authService.getAccessToken();
    if (!token) {
      return () => {};
    }

    const streamUrl = `${apiClient.getBaseUrl()}/api/v1/notifications/stream?token=${encodeURIComponent(token)}`;
    let es: EventSource | null = null;
    try {
      es = new EventSource(streamUrl);
      es.addEventListener('notification', (event: MessageEvent) => {
        try {
          const parsed = JSON.parse(event.data) as NotificationDto;
          if (parsed && parsed.id) {
            onNotification(parsed);
          }
        } catch {
          // Ignore malformed event
        }
      });
    } catch {
      // Ignore connection setup error
    }

    return () => {
      if (es) {
        es.close();
      }
    };
  }
}

export const notificationService = new NotificationService();
