import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Loader2, MessageSquare, Heart, Unlock, FileText, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { notificationService } from '../../services/notificationService';
import type { NotificationDto } from '../../types';

export interface NotificationPopoverProps {
  isAuthenticated?: boolean;
}

export function NotificationPopover({ isAuthenticated = false }: NotificationPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load unread count on mount or auth change
  const refreshUnreadCount = async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    refreshUnreadCount();
  }, [isAuthenticated]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getMyNotifications();
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOpen = () => {
    if (!isOpen && isAuthenticated) {
      loadNotifications();
    }
    setIsOpen((prev) => !prev);
  };

  const handleMarkAsRead = async (item: NotificationDto) => {
    if (!item.isRead) {
      try {
        await notificationService.markAsRead(item.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Ignore
      }
    }

    const targetDocId = item.documentId || item.referenceId;
    if (targetDocId) {
      setIsOpen(false);
      navigate(`/detail/${targetDocId}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('Đã đánh dấu tất cả thông báo là đã đọc');
    } catch (err: any) {
      toast.error(err?.message || 'Không thể cập nhật trạng thái thông báo.');
    }
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case 'DOCUMENT_LIKED':
        return <Heart size={15} className="text-[#E11D48] shrink-0" />;
      case 'DOCUMENT_COMMENTED':
        return <MessageSquare size={15} className="text-[#0284C7] shrink-0" />;
      case 'DOCUMENT_UNLOCKED':
        return <Unlock size={15} className="text-[#16A34A] shrink-0" />;
      case 'DOCUMENT_APPROVED':
        return <FileText size={15} className="text-[#10B981] shrink-0" />;
      default:
        return <Info size={15} className="text-[#64748B] shrink-0" />;
    }
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* BELL BUTTON */}
      <button
        type="button"
        onClick={handleToggleOpen}
        aria-label="Thông báo"
        className="p-1.5 sm:p-2 text-[#334155] hover:text-[#0284C7] hover:bg-[#F1F5F9] rounded-lg transition-colors relative flex items-center justify-center cursor-pointer"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#EF4444] text-white text-[10px] font-extrabold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1 shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN POPOVER */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#E2E8F0] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-[#0F172A]">Thông báo</h4>
              {unreadCount > 0 && (
                <span className="text-[11px] font-bold bg-[#E0F2FE] text-[#0369A1] px-2 py-0.5 rounded-full">
                  {unreadCount} mới
                </span>
              )}
            </div>

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-xs text-[#0284C7] hover:text-[#0369A1] flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                title="Đánh dấu tất cả là đã đọc"
              >
                <CheckCheck size={14} />
                <span>Đọc tất cả</span>
              </button>
            )}
          </div>

          {/* LIST */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-[#F1F5F9]">
            {!isAuthenticated ? (
              <div className="py-8 text-center px-4">
                <p className="text-xs text-[#64748B]">Đăng nhập để xem thông báo học tập của bạn.</p>
              </div>
            ) : loading ? (
              <div className="py-8 flex items-center justify-center gap-2 text-xs text-[#64748B]">
                <Loader2 size={16} className="animate-spin text-[#0284C7]" />
                <span>Đang tải thông báo...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center px-4">
                <Bell size={24} className="mx-auto text-[#CBD5E1] mb-2" />
                <p className="text-xs text-[#64748B]">Bạn chưa có thông báo nào.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleMarkAsRead(item)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-[#F8FAFC] transition-colors cursor-pointer text-left ${
                    !item.isRead ? 'bg-[#F0F9FF]/60' : ''
                  }`}
                >
                  <div className="mt-0.5 p-1.5 bg-[#F1F5F9] rounded-lg">
                    {renderIcon(item.notificationType || item.type || '')}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className={`text-xs truncate ${!item.isRead ? 'font-bold text-[#0F172A]' : 'font-medium text-[#334155]'}`}>
                        {item.title}
                      </p>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#0284C7] shrink-0" aria-label="Chưa đọc" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#64748B] line-clamp-2 leading-relaxed">
                      {item.content || item.message}
                    </p>
                    <span className="text-[10px] text-[#94A3B8] mt-1 block">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : ''}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
