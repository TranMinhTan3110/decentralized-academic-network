import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Bell,
  CheckCheck,
  Loader2,
  MessageSquare,
  Heart,
  Unlock,
  FileText,
  Info,
  Bookmark,
  UserPlus,
  Award,
  Sparkles,
  CornerDownRight,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { notificationService } from '../../services/notificationService';
import type { NotificationDto } from '../../types';

export interface NotificationPopoverProps {
  isAuthenticated?: boolean;
}

type NotificationFilterTab = 'ALL' | 'UNREAD' | 'INTERACTION' | 'ACADEMIC';

const INTERACTION_TYPES = new Set([
  'DOCUMENT_LIKED',
  'DOCUMENT_COMMENTED',
  'COMMENT_REPLIED',
  'DOCUMENT_BOOKMARKED',
  'USER_FOLLOWED',
]);

const ACADEMIC_TYPES = new Set([
  'DOCUMENT_UNLOCKED',
  'UNLOCK',
  'DOCUMENT_APPROVED',
  'DOCUMENT_REJECTED',
  'MODERATION',
  'BADGE_EARNED',
  'TIER_UP',
]);

export function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';

  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSeconds < 60) return 'Vừa xong';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

export function NotificationPopover({ isAuthenticated = false }: NotificationPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NotificationFilterTab>('ALL');
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
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }

    const unsubscribe =
      typeof notificationService.subscribeToStream === 'function'
        ? notificationService.subscribeToStream((incoming) => {
            setNotifications((prev) => {
              if (prev.some((n) => n.id === incoming.id)) {
                return prev;
              }
              return [incoming, ...prev];
            });
            if (!incoming.isRead) {
              setUnreadCount((prev) => prev + 1);
            }
            toast.info(incoming.title || 'Thông báo mới', {
              description: incoming.content || incoming.message,
            });
          })
        : () => {};

    return () => {
      unsubscribe();
    };
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

    const rawType = (item.notificationType || item.type || '').toUpperCase();
    const targetDocId = item.documentId || item.referenceId;
    if (targetDocId) {
      setIsOpen(false);
      navigate(`/detail/${targetDocId}`);
      return;
    }
    if (rawType === 'USER_FOLLOWED' && item.actorUserId) {
      setIsOpen(false);
      navigate(`/profile/${item.actorUserId}`);
      return;
    }
    if (rawType === 'BADGE_EARNED' || rawType === 'TIER_UP') {
      setIsOpen(false);
      navigate('/leaderboard');
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

  const handleDeleteNotification = async (e: React.MouseEvent, item: NotificationDto) => {
    e.stopPropagation();
    try {
      if (typeof notificationService.deleteNotification === 'function') {
        await notificationService.deleteNotification(item.id);
      }
      setNotifications((prev) => prev.filter((n) => n.id !== item.id));
      if (!item.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      toast.success('Đã xóa thông báo');
    } catch (err: any) {
      toast.error(err?.message || 'Không thể xóa thông báo.');
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      const rawType = (item.notificationType || item.type || '').toUpperCase();
      if (activeTab === 'UNREAD') return !item.isRead;
      if (activeTab === 'INTERACTION') return INTERACTION_TYPES.has(rawType);
      if (activeTab === 'ACADEMIC') return ACADEMIC_TYPES.has(rawType);
      return true;
    });
  }, [notifications, activeTab]);

  const renderIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'DOCUMENT_LIKED':
        return <Heart size={15} className="text-[#E11D48] shrink-0" />;
      case 'DOCUMENT_COMMENTED':
        return <MessageSquare size={15} className="text-[#0284C7] shrink-0" />;
      case 'COMMENT_REPLIED':
        return <CornerDownRight size={15} className="text-[#2563EB] shrink-0" />;
      case 'DOCUMENT_BOOKMARKED':
        return <Bookmark size={15} className="text-[#D97706] shrink-0" />;
      case 'DOCUMENT_UNLOCKED':
      case 'UNLOCK':
        return <Unlock size={15} className="text-[#16A34A] shrink-0" />;
      case 'DOCUMENT_APPROVED':
        return <FileText size={15} className="text-[#10B981] shrink-0" />;
      case 'DOCUMENT_REJECTED':
      case 'MODERATION':
        return <ShieldAlert size={15} className="text-[#EA580C] shrink-0" />;
      case 'USER_FOLLOWED':
        return <UserPlus size={15} className="text-[#7C3AED] shrink-0" />;
      case 'BADGE_EARNED':
        return <Award size={15} className="text-[#F59E0B] shrink-0" />;
      case 'TIER_UP':
        return <Sparkles size={15} className="text-[#0EA5E9] shrink-0" />;
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

          {/* FILTER TABS */}
          {isAuthenticated && (
            <div className="px-3 py-2 bg-white border-b border-[#F1F5F9] flex items-center gap-1.5 overflow-x-auto">
              {(
                [
                  { id: 'ALL', label: 'Tất cả' },
                  { id: 'UNREAD', label: 'Chưa đọc' },
                  { id: 'INTERACTION', label: 'Tương tác' },
                  { id: 'ACADEMIC', label: 'Học thuật' },
                ] as { id: NotificationFilterTab; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-[#E0F2FE] text-[#0369A1]'
                      : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

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
            ) : filteredNotifications.length === 0 ? (
              <div className="py-8 text-center px-4">
                <Bell size={24} className="mx-auto text-[#CBD5E1] mb-2" />
                <p className="text-xs text-[#64748B]">
                  {activeTab === 'ALL'
                    ? 'Bạn chưa có thông báo nào.'
                    : 'Không có thông báo nào trong mục này.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleMarkAsRead(item)}
                  className={`group p-3.5 flex items-start gap-3 hover:bg-[#F8FAFC] transition-colors cursor-pointer text-left ${
                    !item.isRead ? 'bg-[#F0F9FF]/60' : ''
                  }`}
                >
                  <div className="mt-0.5 p-1.5 bg-[#F1F5F9] rounded-lg">
                    {renderIcon(item.notificationType || item.type || '')}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p
                        className={`text-xs truncate ${
                          !item.isRead ? 'font-bold text-[#0F172A]' : 'font-medium text-[#334155]'
                        }`}
                      >
                        {item.title}
                      </p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!item.isRead && (
                          <span
                            className="w-2 h-2 rounded-full bg-[#0284C7] shrink-0"
                            aria-label="Chưa đọc"
                          />
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteNotification(e, item)}
                          aria-label="Xóa thông báo"
                          title="Xóa thông báo"
                          className="opacity-0 group-hover:opacity-100 p-1 text-[#94A3B8] hover:text-[#EF4444] rounded transition-opacity cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#64748B] line-clamp-2 leading-relaxed">
                      {item.content || item.message}
                    </p>
                    <span className="text-[10px] text-[#94A3B8] mt-1 block">
                      {formatRelativeTime(item.createdAt)}
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
