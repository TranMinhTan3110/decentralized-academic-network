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

  it('filters notifications by category tabs (Tất cả, Chưa đọc, Tương tác, Học thuật)', async () => {
    vi.spyOn(notificationService, 'getUnreadCount').mockResolvedValue(1);
    vi.spyOn(notificationService, 'getMyNotifications').mockResolvedValue([
      {
        id: 'n-filter-1',
        recipientUserId: 'u1',
        notificationType: 'DOCUMENT_LIKED',
        title: 'Thích tài liệu Giải tích',
        content: 'Nguyễn Văn A vừa thả tim tài liệu của bạn.',
        documentId: 'doc-1',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'n-filter-2',
        recipientUserId: 'u1',
        notificationType: 'BADGE_EARNED',
        title: 'Huy hiệu mới',
        content: 'Bạn đạt huy hiệu Người Tiên Phong.',
        isRead: true,
        createdAt: new Date().toISOString(),
      },
    ]);

    render(
      <MemoryRouter>
        <NotificationPopover isAuthenticated={true} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Thông báo/i }));

    await waitFor(() => {
      expect(screen.getByText('Thích tài liệu Giải tích')).toBeInTheDocument();
      expect(screen.getByText('Huy hiệu mới')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Chưa đọc' }));
    expect(screen.getByText('Thích tài liệu Giải tích')).toBeInTheDocument();
    expect(screen.queryByText('Huy hiệu mới')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Học thuật' }));
    expect(screen.getByText('Huy hiệu mới')).toBeInTheDocument();
    expect(screen.queryByText('Thích tài liệu Giải tích')).not.toBeInTheDocument();
  });

  it('deletes an individual notification when clicking the delete button', async () => {
    vi.spyOn(notificationService, 'getUnreadCount').mockResolvedValue(1);
    vi.spyOn(notificationService, 'getMyNotifications').mockResolvedValue([
      {
        id: 'n-del-1',
        recipientUserId: 'u1',
        notificationType: 'COMMENT_REPLIED',
        title: 'Phản hồi bình luận mới',
        content: 'Trần Thị B đã trả lời bình luận của bạn.',
        documentId: 'doc-2',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ]);
    const deleteSpy = vi.spyOn(notificationService, 'deleteNotification').mockResolvedValue();

    render(
      <MemoryRouter>
        <NotificationPopover isAuthenticated={true} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Thông báo/i }));
    await screen.findByText('Phản hồi bình luận mới');

    const deleteBtn = screen.getByRole('button', { name: /Xóa thông báo/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('n-del-1');
      expect(screen.queryByText('Phản hồi bình luận mới')).not.toBeInTheDocument();
    });
  });
});
