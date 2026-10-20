// ==============================================================================
// RECOMMENDATION SERVICE - DECENTRALIZED ACADEMIC NETWORK (DEDOCU)
// Connects to Python FastAPI Recommendation & AI Microservice (Port 8000)
// ==============================================================================

import { documents, type DocumentItem } from '../data/documents';
import { authService, type ApiResponse } from './authService';

export interface RecommendationItem {
  document_id: string;
  title: string;
  score: number;
  reason: string;
}

export interface RecommendationResponse {
  total: number;
  algorithm_applied: string;
  items: RecommendationItem[];
}

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

// Academic curricula metadata templates matching Vietnamese universities
const SAMPLE_ACADEMIC_METADATA = [
  {
    title: 'Cấu Trúc Dữ Liệu và Giải Thuật (Nâng Cao)',
    category: 'Khoa Học Máy Tính',
    school: 'ĐH Bách Khoa TP.HCM',
    authorName: 'PGS. TS Lê Hoài Nam',
    authorRole: 'Khoa CNTT',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    tags: ['DataStructure', 'Algorithms', 'AI'],
  },
  {
    title: 'Giáo Trình Cấu Trúc Dữ Liệu & Giải Thuật (C++)',
    category: 'Công Nghệ Thông Tin',
    school: 'ĐH Bách Khoa Hà Nội',
    authorName: 'Nguyễn Hoàng Nam',
    authorRole: 'Giảng viên',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    tags: ['CPP', 'DataStructure', 'Optimization'],
  },
  {
    title: 'Giải Thuật Học Máy & Phân Tích Dữ Liệu Lớn',
    category: 'Trí Tuệ Nhân Tạo',
    school: 'ĐH Quốc Gia Hà Nội',
    authorName: 'ThS. Minh Đức',
    authorRole: 'Nghiên cứu sinh AI',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    tags: ['MachineLearning', 'BigData', 'Python'],
  },
  {
    title: 'Thiết Kế Hệ Thống Phân Tán Quy Mô Lớn',
    category: 'Kỹ Thuật Phần Mềm',
    school: 'ĐH Bách Khoa',
    authorName: 'Đặng Quốc Huy',
    authorRole: 'Kỹ sư phần mềm cao cấp',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=80',
    tags: ['DistributedSystems', 'Microservices', 'Cloud'],
  },
  {
    title: 'Tài Liệu Ôn Tập Xác Suất Thống Kê & Ứng Dụng',
    category: 'Toán Ứng Dụng',
    school: 'ĐH Khoa Học Tự Nhiên',
    authorName: 'TS. Phạm Minh Tuấn',
    authorRole: 'Khoa Toán - Tin',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80',
    tags: ['Probability', 'Statistics', 'Mathematics'],
  },
  {
    title: 'Pháp Luật Đại Cương & Hệ Thống Văn Bản Pháp Lý',
    category: 'Luật Học & Xã Hội',
    school: 'ĐH Luật Hà Nội',
    authorName: 'ThS. Nguyễn Thị Mai',
    authorRole: 'Khoa Pháp luật Cơ bản',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
    tags: ['Law', 'GeneralLegal', 'Vietnam'],
  },
];

/**
 * Fetch top trending recommendations from the backend Recommendation microservice
 */
export async function fetchTrendingRecommendations(
  limit: number = 10
): Promise<RecommendationResponse | null> {
  const isTest = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test';
  const controller = !isTest && typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), 4000) : null;

  try {
    const response = await fetch(`${API_BASE_URL}/recommendations/trending?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller?.signal,
    });

    if (!response.ok) {
      console.warn(`[RecommendationService] Backend tra ve HTTP status ${response.status}`);
      return null;
    }

    const json: ApiResponse<RecommendationResponse> = await response.json();
    return json.data || null;
  } catch (error) {
    if (!isTest) {
      console.warn('[RecommendationService] Khong the ket noi Backend AI (Port 8000), su dung du lieu du phong:', error);
    }
    return null;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/**
 * Fetch personalized recommendations for the current student (Multi-Armed Bandit Epsilon-Greedy)
 */
export async function fetchPersonalRecommendations(
  universityId?: string,
  major?: string,
  limit: number = 10
): Promise<RecommendationResponse | null> {
  const isTest = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test';
  const controller = !isTest && typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), 4000) : null;

  try {
    const token = authService.getAccessToken();
    const currentUser = authService.getCurrentUser();

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    const queryParams = new URLSearchParams();
    queryParams.set('limit', String(limit));
    if (universityId) {
      queryParams.set('university_id', universityId);
    }
    const resolvedMajor = major || currentUser?.major;
    if (resolvedMajor) {
      queryParams.set('major', resolvedMajor);
    }

    if (!token) {
      // Khi chua co Token dang nhap, goi backend lay danh muc de xuat xu huong (Trending AI) thay vi tra ve null
      return fetchTrendingRecommendations(limit);
    }

    headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/recommendations/me?${queryParams.toString()}`, {
      method: 'GET',
      headers,
      signal: controller?.signal,
    });

    if (!response.ok) {
      console.warn(`[RecommendationService] Backend /me tra ve HTTP status ${response.status}`);
      if (response.status === 401) {
        // Fallback sang trending tu Backend AI
        return fetchTrendingRecommendations(limit);
      }
      return null;
    }

    const json: ApiResponse<RecommendationResponse> = await response.json();
    return json.data || null;
  } catch (error) {
    if (!isTest) {
      console.warn('[RecommendationService] Khong the ket noi Backend AI (Port 8000), su dung du lieu du phong:', error);
    }
    return null;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/**
 * Maps recommendation items received from Backend into DocumentItem objects for UI FeedCard rendering
 */
export function mapTrendingToDocumentItems(
  trendingItems: RecommendationItem[]
): DocumentItem[] {
  if (!trendingItems || trendingItems.length === 0) {
    return documents.filter((doc) => doc.tabCategory === 'trending');
  }

  return trendingItems.map((item, index) => {
    // If ID matches an existing catalog document in documents.ts, enrich it
    const existingDoc = documents.find((d) => d.id === item.document_id);
    const meta = SAMPLE_ACADEMIC_METADATA[index % SAMPLE_ACADEMIC_METADATA.length];

    const displayTitle = item.title && !item.title.startsWith('Tài liệu thịnh hành')
      ? item.title
      : (existingDoc?.title || meta.title);

    const category = existingDoc?.category || meta.category;
    const school = existingDoc?.school || meta.school;
    const author = existingDoc?.author || {
      name: meta.authorName,
      role: meta.authorRole,
      school: meta.school,
      followersCount: `${Math.round(item.score * 45 + 180)} người theo dõi`,
      avatar: meta.avatar,
    };

    return {
      id: item.document_id,
      title: displayTitle,
      category,
      school,
      author,
      sharedAt: 'Vừa cập nhật xu hướng',
      createdAt: 'Hôm nay',
      postText: `${item.reason} • Điểm thưởng thuật toán AI: ${item.score.toFixed(1)} điểm`,
      document: {
        title: displayTitle,
        typeLabel: 'Tài liệu xu hướng',
        category,
        year: '2026',
        pagesText: `Điểm số AI: ${item.score.toFixed(1)}`,
        gradient: 'from-[#0284C7] via-[#0EA5E9] to-[#38BDF8]',
      },
      likes: Math.max(25, Math.round(item.score * 16)),
      views: Math.max(120, Math.round(item.score * 85)),
      comments: Math.max(6, Math.round(item.score * 3)),
      saves: Math.max(10, Math.round(item.score * 5)),
      tabCategory: 'trending',
      tags: existingDoc?.tags || meta.tags,
    };
  });
}

/**
 * Maps personalized recommendation items into DocumentItem objects for UI FeedCard rendering
 */
export function mapPersonalToDocumentItems(
  personalItems: RecommendationItem[]
): DocumentItem[] {
  if (!personalItems || personalItems.length === 0) {
    return documents;
  }

  return personalItems.map((item, index) => {
    const existingDoc = documents.find((d) => d.id === item.document_id);
    const meta = SAMPLE_ACADEMIC_METADATA[index % SAMPLE_ACADEMIC_METADATA.length];

    const displayTitle = item.title && !item.title.startsWith('Tài liệu')
      ? item.title
      : (existingDoc?.title || meta.title);

    const category = existingDoc?.category || meta.category;
    const school = existingDoc?.school || meta.school;
    const author = existingDoc?.author || {
      name: meta.authorName,
      role: meta.authorRole,
      school: meta.school,
      followersCount: `${Math.round(item.score * 50 + 150)} người theo dõi`,
      avatar: meta.avatar,
    };

    return {
      id: item.document_id,
      title: displayTitle,
      category,
      school,
      author,
      sharedAt: 'Gợi ý cho bạn',
      createdAt: 'Hôm nay',
      postText: `${item.reason} • Điểm thưởng thuật toán AI: ${item.score.toFixed(1)} điểm`,
      document: {
        title: displayTitle,
        typeLabel: 'Tài liệu đề xuất',
        category,
        year: '2026',
        pagesText: `Điểm số AI: ${item.score.toFixed(1)}`,
        gradient: 'from-[#0369A1] via-[#0284C7] to-[#38BDF8]',
      },
      likes: Math.max(30, Math.round(item.score * 18)),
      views: Math.max(150, Math.round(item.score * 90)),
      comments: Math.max(8, Math.round(item.score * 4)),
      saves: Math.max(15, Math.round(item.score * 6)),
      tabCategory: 'for-you',
      tags: existingDoc?.tags || meta.tags,
    };
  });
}
