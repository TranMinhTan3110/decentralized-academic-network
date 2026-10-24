import { describe, it, expect } from 'vitest';
import type {
  DocumentFeedItem,
  DocumentDetail,
  UniversityDto,
  CourseDto,
  NotificationDto,
  PageResponse,
} from '../../types';

describe('Document Service TypeScript Types Validation', () => {
  it('correctly constructs DocumentFeedItem type structure', () => {
    const feedItem: DocumentFeedItem = {
      id: 'doc-uuid-1',
      title: 'Đề cương Ôn tập Kỹ thuật Lập trình',
      description: 'Tổng hợp thuật toán và bài tập',
      docType: 'SUMMARY',
      academicYear: '2025-2026',
      semester: '1',
      thumbnailUrl: 'http://localhost:8080/ipfs/QmThumbnail',
      totalPages: 30,
      freePages: 5,
      isBlurLocked: true,
      unlockPointsRequired: 10,
      likeCount: 42,
      commentCount: 8,
      viewCount: 350,
      bookmarkCount: 12,
      universityName: 'Đại học Bách Khoa Hà Nội',
      courseName: 'Kỹ thuật Lập trình',
      author: {
        userId: 'u-1',
        fullName: 'Nguyễn Văn B',
        username: 'vanb',
        reputationPoints: 120,
      },
      hasLiked: true,
      hasBookmarked: false,
      hasUnlocked: true,
      createdAt: '2026-10-18T10:00:00Z',
    };

    expect(feedItem.id).toBe('doc-uuid-1');
    expect(feedItem.docType).toBe('SUMMARY');
    expect(feedItem.freePages).toBe(5);
    expect(feedItem.hasLiked).toBe(true);
  });

  it('correctly constructs PageResponse generic interface', () => {
    const pageResponse: PageResponse<string> = {
      content: ['item1', 'item2'],
      pageNumber: 0,
      pageSize: 10,
      totalElements: 2,
      totalPages: 1,
      last: true,
    };

    expect(pageResponse.content).toHaveLength(2);
    expect(pageResponse.last).toBe(true);
  });

  it('correctly validates Taxonomy and Notification types', () => {
    const uni: UniversityDto = {
      id: 'uni-1',
      name: 'Đại học Kinh tế Quốc dân',
      code: 'NEU',
      city: 'Hà Nội',
    };

    const course: CourseDto = {
      id: 'course-1',
      code: 'KT101',
      name: 'Kinh tế vi mô',
      area: 'Kinh tế',
    };

    const notif: NotificationDto = {
      id: 'n-1',
      userId: 'u-1',
      type: 'DOCUMENT_LIKED',
      title: 'Có lượt thích mới',
      message: 'Nguyễn Văn A đã thích tài liệu của bạn',
      isRead: false,
      createdAt: '2026-10-18T12:00:00Z',
    };

    expect(uni.code).toBe('NEU');
    expect(course.area).toBe('Kinh tế');
    expect(notif.isRead).toBe(false);
  });
});
