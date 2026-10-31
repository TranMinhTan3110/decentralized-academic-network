// ==============================================================================
// NOTIFICATION TYPES - DECENTRALIZED ACADEMIC NETWORK (DEDOCU)
// System & Social Notifications (Like, Comment, Unlock, Moderation)
// ==============================================================================

export type NotificationTypeEnum =
  | 'DOCUMENT_LIKED'
  | 'DOCUMENT_COMMENTED'
  | 'DOCUMENT_UNLOCKED'
  | 'DOCUMENT_APPROVED'
  | 'DOCUMENT_REJECTED'
  | 'SYSTEM_ALERT';

export interface NotificationDto {
  id: string;
  userId?: string;
  recipientUserId?: string;
  actorUserId?: string;
  type?: NotificationTypeEnum | string;
  notificationType?: NotificationTypeEnum | string;
  title: string;
  message?: string;
  content?: string;
  referenceId?: string;
  documentId?: string;
  referenceType?: string;
  isRead: boolean;
  createdAt: string;
}
