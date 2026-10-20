// ==============================================================================
// DOCUMENT SERVICE - DECENTRALIZED ACADEMIC NETWORK (DEDOCU)
// Handles API calls to Document Service Backend (Port 8082)
// ==============================================================================

import { apiClient } from './apiClient';
import type {
  DocumentDetail,
  DocumentFeedItem,
  DocumentFilterParams,
  DocumentPreview,
  CommentItemDto,
  UnlockStatus,
  AuthorSummary,
  PageResponse,
} from '../types';

class DocumentService {
  /**
   * Lấy danh sách tài liệu Feed (Latest, Top-rated, Most-viewed, Filter theo trường/môn)
   */
  async getFeed(params: DocumentFilterParams = {}): Promise<PageResponse<DocumentFeedItem>> {
    const query = new URLSearchParams();
    if (params.filter) query.set('filter', params.filter);
    if (params.universityId) query.set('universityId', params.universityId);
    if (params.courseId) query.set('courseId', params.courseId);
    if (params.academicYear) query.set('academicYear', params.academicYear);
    if (params.docType) query.set('docType', params.docType);
    if (params.page !== undefined) query.set('page', params.page.toString());
    if (params.size !== undefined) query.set('size', params.size.toString());

    const qs = query.toString();
    const endpoint = qs ? `/api/v1/documents?${qs}` : '/api/v1/documents';
    return apiClient.get<PageResponse<DocumentFeedItem>>(endpoint);
  }

  /**
   * Lấy chi tiết tài liệu theo ID
   */
  async getDetail(id: string): Promise<DocumentDetail> {
    return apiClient.get<DocumentDetail>(`/api/v1/documents/${id}`);
  }

  /**
   * Tìm kiếm toàn văn tài liệu theo từ khóa
   */
  async search(queryText: string, page: number = 0, size: number = 10): Promise<PageResponse<DocumentFeedItem>> {
    const params = new URLSearchParams({
      q: queryText,
      page: page.toString(),
      size: size.toString(),
    });
    return apiClient.get<PageResponse<DocumentFeedItem>>(`/api/v1/documents/search?${params.toString()}`);
  }

  /**
   * Lấy danh sách tài liệu thịnh hành (Trending)
   */
  async getTrending(limit: number = 10): Promise<DocumentFeedItem[]> {
    return apiClient.get<DocumentFeedItem[]>(`/api/v1/documents/trending?limit=${limit}`);
  }

  /**
   * Lấy feed cá nhân hóa (Dành cho bạn)
   */
  async getForYou(page: number = 0, size: number = 10): Promise<PageResponse<DocumentFeedItem>> {
    return this.getFeed({ filter: 'for-you', page, size });
  }

  /**
   * Xem trước metadata tài liệu (Preview)
   */
  async getPreview(id: string): Promise<DocumentPreview> {
    return apiClient.get<DocumentPreview>(`/api/v1/documents/${id}/preview`);
  }

  /**
   * Ghi nhận lượt xem tài liệu
   */
  async recordView(id: string): Promise<void> {
    try {
      await apiClient.post<void>(`/api/v1/documents/${id}/view`);
    } catch {
      // Non-blocking view tracking
    }
  }

  /**
   * Đăng tải tài liệu mới lên Hybrid IPFS (Multipart FormData)
   */
  async upload(formData: FormData): Promise<DocumentDetail> {
    return apiClient.post<DocumentDetail>('/api/v1/documents/upload', formData, true);
  }

  /**
   * Cập nhật thông tin tài liệu
   */
  async update(id: string, payload: Partial<DocumentDetail>): Promise<DocumentDetail> {
    return apiClient.put<DocumentDetail>(`/api/v1/documents/${id}`, payload);
  }

  /**
   * Xóa tài liệu
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/api/v1/documents/${id}`);
  }

  /**
   * Thả tim / Bỏ tim tài liệu (Toggle Like)
   */
  async toggleLike(id: string): Promise<boolean> {
    const res = await apiClient.post<{ liked: boolean }>(`/api/v1/documents/${id}/like`);
    return res?.liked ?? false;
  }

  /**
   * Lấy danh sách người dùng đã thả tim tài liệu
   */
  async getUsersWhoLiked(id: string): Promise<AuthorSummary[]> {
    return apiClient.get<AuthorSummary[]>(`/api/v1/documents/${id}/likes`);
  }

  /**
   * Lưu / Bỏ lưu tài liệu vào bộ sưu tập (Toggle Bookmark)
   */
  async toggleBookmark(id: string, collectionName: string = 'Mặc định'): Promise<boolean> {
    const res = await apiClient.post<{ bookmarked: boolean }>(
      `/api/v1/documents/${id}/bookmark?collectionName=${encodeURIComponent(collectionName)}`
    );
    return res?.bookmarked ?? false;
  }

  /**
   * Bỏ lưu tài liệu khỏi bộ sưu tập
   */
  async removeBookmark(id: string): Promise<void> {
    return apiClient.delete<void>(`/api/v1/documents/${id}/bookmark`);
  }

  /**
   * Lấy danh sách tài liệu đã bookmark của người dùng hiện tại
   */
  async getMyBookmarks(page: number = 0, size: number = 10): Promise<PageResponse<DocumentFeedItem>> {
    return apiClient.get<PageResponse<DocumentFeedItem>>(`/api/v1/documents/bookmarks/me?page=${page}&size=${size}`);
  }

  /**
   * Mở khóa tài liệu bằng điểm
   */
  async unlock(id: string): Promise<boolean> {
    const res = await apiClient.post<{ unlocked: boolean }>(`/api/v1/documents/${id}/unlock`);
    return res?.unlocked ?? false;
  }

  /**
   * Kiểm tra trạng thái mở khóa của tài liệu
   */
  async checkUnlockStatus(id: string): Promise<UnlockStatus> {
    return apiClient.get<UnlockStatus>(`/api/v1/documents/${id}/unlock-status`);
  }

  /**
   * Lấy danh sách tài liệu đã mở khóa của người dùng hiện tại
   */
  async getMyUnlockedDocuments(page: number = 0, size: number = 10): Promise<PageResponse<DocumentFeedItem>> {
    return apiClient.get<PageResponse<DocumentFeedItem>>(`/api/v1/documents/unlocked/me?page=${page}&size=${size}`);
  }

  /**
   * Lấy danh sách bình luận của tài liệu
   */
  async getComments(id: string, page: number = 0, size: number = 20): Promise<PageResponse<CommentItemDto>> {
    return apiClient.get<PageResponse<CommentItemDto>>(`/api/v1/documents/${id}/comments?page=${page}&size=${size}`);
  }

  /**
   * Thêm bình luận mới (hỗ trợ bình luận theo trang và phản hồi lồng nhau)
   */
  async addComment(
    id: string,
    content: string,
    pageNumber?: number | null,
    parentId?: string | null
  ): Promise<CommentItemDto> {
    return apiClient.post<CommentItemDto>(`/api/v1/documents/${id}/comments`, {
      content,
      pageNumber: pageNumber || null,
      parentId: parentId || null,
    });
  }

  /**
   * Xóa bình luận
   */
  async deleteComment(commentId: string): Promise<void> {
    return apiClient.delete<void>(`/api/v1/documents/comments/${commentId}`);
  }

  /**
   * Báo cáo vi phạm tài liệu
   */
  async report(id: string, reason: string, details?: string): Promise<void> {
    return apiClient.post<void>(`/api/v1/documents/${id}/report`, {
      reason,
      description: details,
      details,
    });
  }
}

export const documentService = new DocumentService();
