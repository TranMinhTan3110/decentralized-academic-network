// ==============================================================================
// NOTIFICATION SERVICE - DECENTRALIZED ACADEMIC NETWORK (DEDOCU)
// Handles API calls for System & Social Notifications
// ==============================================================================

import { apiClient } from './apiClient';
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
}

export const notificationService = new NotificationService();
