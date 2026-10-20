export interface School {
  id: string;
  name: string;
  short: string;
  city?: string;
}

export interface Subject {
  id: string;
  name: string;
  area?: string;
  code?: string;
}

export interface DocumentPage {
  heading: string;
  paragraphs: string[];
}

export interface DocumentItem {
  id: string;
  title: string;
  category: string;
  school?: string;
  subject?: string;
  kind?: string;
  year?: string | number;
  gradient?: string;
  author: {
    name: string;
    initials?: string;
    role?: string;
    school?: string;
    followersCount?: string;
    avatar?: string;
  };
  pages?: number | string | DocumentPage[];
  fileSize?: string;
  description?: string;
  sharedAt?: string;
  createdAt?: string;
  postText?: string;
  document?: {
    title: string;
    typeLabel: string;
    category: string;
    year: string;
    pagesText: string;
    gradient: string;
  };
  likes: number;
  views?: number;
  comments?: number;
  saves: number;
  tabCategory: 'for-you' | 'following' | 'trending';
  tags?: string[];
  updated?: string;
}

export const schools: School[] = [
  { id: 'neu', name: 'Đại học Kinh tế Quốc dân', short: 'NEU', city: 'Hà Nội' },
  { id: 'bkhn', name: 'Đại học Bách khoa Hà Nội', short: 'BKHN', city: 'Hà Nội' },
  { id: 'ussh', name: 'Đại học KHXH & Nhân văn', short: 'USSH', city: 'Hà Nội' },
  { id: 'hmu', name: 'Đại học Y Hà Nội', short: 'HMU', city: 'Hà Nội' },
];

export const subjects: Subject[] = [
  { id: 'ktvm', name: 'Kinh tế vi mô', area: 'Kinh tế', code: 'KT' },
  { id: 'dstt', name: 'Đại số tuyến tính', area: 'Toán học', code: 'ĐS' },
  { id: 'xstk', name: 'Xác suất thống kê', area: 'Toán học', code: 'XS' },
  { id: 'mkt', name: 'Marketing căn bản', area: 'Kinh tế', code: 'MKT' },
  { id: 'cs', name: 'Khoa Học Máy Tính', area: 'Công nghệ', code: 'CS' },
  { id: 'cntt', name: 'Công Nghệ Thông Tin', area: 'Công nghệ', code: 'CT' },
  { id: 'arch', name: 'Kiến Trúc Phần Mềm', area: 'Công nghệ', code: 'SA' },
];

export const kinds: string[] = ['Đề cương', 'Giáo trình', 'Đề thi / Bài tập', 'Ghi chép', 'Đồ án'];

export function schoolName(id?: string): string {
  if (!id) return 'Đại học Kinh tế Quốc dân';
  const match = schools.find((s) => s.id === id);
  return match ? match.name : id;
}

export function subjectName(id?: string): string {
  if (!id) return 'Môn học chung';
  const match = subjects.find((s) => s.id === id);
  return match ? match.name : id;
}

/**
 * @deprecated Runtime mock documents have been removed in favor of backend API endpoints.
 * Use mockTestDocuments from src/tests/fixtures/documents.fixture.ts for unit tests.
 */
export const documents: DocumentItem[] = [];
