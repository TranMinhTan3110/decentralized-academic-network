import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotificationPopover } from '../../components/notifications/NotificationPopover';
import { notificationService } from '../../services/notificationService';

describe('NotificationPopover Component Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('displays unread badge count when user is authenticated', async () => {
    vi.spyOn(notificationService, 'getUnreadCount').mockResolvedValue(5);

    render(
      <MemoryRouter>
        <NotificationPopover isAuthenticated={true} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('opens dropdown and displays list of notifications on bell click', async () => {
    vi.spyOn(notificationService, 'getUnreadCount').mockResolvedValue(2);
    vi.spyOn(notificationService, 'getMyNotifications').mockResolvedValue([
      {
        id: 'n-1',
        userId: 'u1',
        type: 'DOCUMENT_LIKED',
        title: 'Tài liệu được yêu thích',
        message: 'Người dùng B đã thích tài liệu của bạn.',
        referenceId: 'doc-100',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'n-2',
        userId: 'u1',
        type: 'DOCUMENT_COMMENTED',
        title: 'Bình luận mới',
        message: 'Có câu hỏi mới trên tài liệu Toán cao cấp.',
        referenceId: 'doc-101',
        isRead: true,
        createdAt: new Date().toISOString(),
      },
    ]);

    render(
      <MemoryRouter>
        <NotificationPopover isAuthenticated={true} />
      </MemoryRouter>
    );

    const bellBtn = screen.getByRole('button', { name: /Thông báo/i });
    fireEvent.click(bellBtn);

    await waitFor(() => {
      expect(screen.getByText('Tài liệu được yêu thích')).toBeInTheDocument();
      expect(screen.getByText('Người dùng B đã thích tài liệu của bạn.')).toBeInTheDocument();
      expect(screen.getByText('Bình luận mới')).toBeInTheDocument();
    });
  });

  it('marks single notification as read when clicked', async () => {
    vi.spyOn(notificationService, 'getUnreadCount').mockResolvedValue(1);
    vi.spyOn(notificationService, 'getMyNotifications').mockResolvedValue([
      {
        id: 'n-click',
        userId: 'u1',
        type: 'DOCUMENT_UNLOCKED',
        title: 'Đã mở khóa thành công',
        message: 'Bạn đã mở khóa tài liệu Kinh tế lượng.',
        referenceId: 'doc-200',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ]);
    const markReadSpy = vi.spyOn(notificationService, 'markAsRead').mockResolvedValue();

    render(
      <MemoryRouter>
        <NotificationPopover isAuthenticated={true} />
      </MemoryRouter>
    );

    const bellBtn = screen.getByRole('button', { name: /Thông báo/i });
    fireEvent.click(bellBtn);

    const notifItem = await screen.findByText('Đã mở khóa thành công');
    fireEvent.click(notifItem);

    await waitFor(() => {
      expect(markReadSpy).toHaveBeenCalledWith('n-click');
    });
  });

  it('marks all notifications as read when clicking "Đọc tất cả"', async () => {
    vi.spyOn(notificationService, 'getUnreadCount').mockResolvedValue(2);
    vi.spyOn(notificationService, 'getMyNotifications').mockResolvedValue([
      {
        id: 'n-all-1',
        userId: 'u1',
        type: 'SYSTEM_ALERT',
        title: 'Thông báo hệ thống',
        message: 'Hệ thống đã nâng cấp lên cụm IPFS v0.27.',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ]);
    const markAllSpy = vi.spyOn(notificationService, 'markAllAsRead').mockResolvedValue();

    render(
      <MemoryRouter>
        <NotificationPopover isAuthenticated={true} />
      </MemoryRouter>
    );

    const bellBtn = screen.getByRole('button', { name: /Thông báo/i });
    fireEvent.click(bellBtn);

    const markAllBtn = await screen.findByRole('button', { name: /Đọc tất cả/i });
    fireEvent.click(markAllBtn);

    await waitFor(() => {
      expect(markAllSpy).toHaveBeenCalled();
    });
  });

  it('correctly parses backend entity fields (notificationType, content, documentId)', async () => {
    vi.spyOn(notificationService, 'getUnreadCount').mockResolvedValue(1);
    vi.spyOn(notificationService, 'getMyNotifications').mockResolvedValue([
      {
        id: 'n-backend-1',
        recipientUserId: 'u-backend-1',
        notificationType: 'DOCUMENT_LIKED',
        title: 'Tài liệu được yêu thích',
        content: 'Nội dung thông báo từ Notification Entity',
        documentId: 'doc-uuid-999',
        isRead: false,
        createdAt: new Date().toISOString(),
      } as any,
    ]);

    render(
      <MemoryRouter>
        <NotificationPopover isAuthenticated={true} />
      </MemoryRouter>
    );

    const bellBtn = screen.getByRole('button', { name: /Thông báo/i });
    fireEvent.click(bellBtn);

    await waitFor(() => {
      expect(screen.getByText('Tài liệu được yêu thích')).toBeInTheDocument();
      expect(screen.getByText('Nội dung thông báo từ Notification Entity')).toBeInTheDocument();
    });
  });
});
