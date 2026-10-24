// ==============================================================================
// DOCUMENT TYPES - DECENTRALIZED ACADEMIC NETWORK (DEDOCU)
// Mirrors Document Service Backend DTOs (Spring Boot 3)
// ==============================================================================

export type DocumentTypeEnum =
  | 'SLIDE'
  | 'EXAM'
  | 'SUMMARY'
  | 'SYLLABUS'
  | 'EXERCISE'
  | 'TEXTBOOK'
  | 'OTHER';

export interface AuthorSummary {
  id?: string;
  userId?: string;
  fullName: string;
  name?: string;
  username?: string;
  email?: string;
  avatarUrl?: string;
  avatar?: string;
  avatarText?: string;
  reputationPoints?: number;
  role?: string;
  badge?: string;
  points?: number;
}

export interface DocumentFeedItem {
  id: string;
  title: string;
  description?: string;
  docType: DocumentTypeEnum | string;
  academicYear?: string;
  semester?: string;
  thumbnailUrl?: string;
  totalPages?: number;
  freePages?: number;
  isBlurLocked?: boolean;
  unlockPointsRequired: number;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  bookmarkCount: number;
  universityName?: string;
  courseName?: string;
  author?: AuthorSummary;
  hasLiked?: boolean;
  hasBookmarked?: boolean;
  hasUnlocked?: boolean;
  createdAt: string;
}

export interface DocumentDetail {
  id: string;
  title: string;
  description?: string;
  caption?: string;
  docType: DocumentTypeEnum | string;
  academicYear?: string;
  semester?: string;
  ipfsCid?: string;
  previewIpfsCid?: string;
  fileUrl?: string;
  fileSizeBytes?: number;
  fileExtension?: string;
  thumbnailUrl?: string;
  totalPages: number;
  freePages: number;
  isBlurLocked: boolean;
  unlockPointsRequired: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED' | string;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  downloadCount: number;
  bookmarkCount: number;
  universityId?: string;
  universityName?: string;
  courseId?: string;
  courseName?: string;
  author?: AuthorSummary;
  hasLiked?: boolean;
  hasBookmarked?: boolean;
  hasUnlocked?: boolean;
  createdAt: string;
  updatedAt?: string;
  pages?: Array<{ heading: string; paragraphs: string[] }>;
  school?: string;
  subject?: string;
  documentType?: string;
  kind?: string;
  year?: string | number;
}

export interface DocumentPreview {
  documentId: string;
  title: string;
  totalPages: number;
  freePages: number;
  isBlurLocked: boolean;
  previewIpfsCid?: string;
  thumbnailUrl?: string;
  unlockPointsRequired: number;
  hasUnlocked: boolean;
}

export interface CommentItemDto {
  id: string;
  documentId: string;
  parentId?: string | null;
  pageNumber?: number | null;
  content: string;
  likeCount: number;
  author?: AuthorSummary;
  replies?: CommentItemDto[];
  createdAt: string;
}

export interface UnlockStatus {
  documentId: string;
  hasUnlocked: boolean;
  unlocked?: boolean;
  unlockPointsRequired: number;
  userBalance?: number;
  unlockedAt?: string | null;
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface DocumentFilterParams {
  filter?: 'latest' | 'top-rated' | 'most-viewed' | 'for-you' | 'following' | 'my-uploads' | string;
  universityId?: string;
  courseId?: string;
  academicYear?: string;
  docType?: string;
  page?: number;
  size?: number;
}
