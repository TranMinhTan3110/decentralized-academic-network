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
  pages?: number | any;
  fileSize?: string;
  description?: string;
  sharedAt?: string;
  createdAt?: string;
  postText?: string;
  document?: {
    title: string;
    typeLabel: string; // e.g. 'Đề cương', 'Giáo trình', 'Tài liệu'
    category: string;  // e.g. 'Kinh tế vi mô'
    year: string;      // e.g. '2025'
    pagesText: string; // e.g. '2 trang mẫu'
    gradient: string;  // Tailwind gradient string
  };
  likes: number;
  views?: number;
  comments?: number;
  saves: number;
  tabCategory: 'for-you' | 'following' | 'trending';
  tags: string[];
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
];

export const kinds: string[] = ['Đề cương', 'Giáo trình', 'Đề thi / Bài tập', 'Ghi chép', 'Đồ án'];

export const documents: DocumentItem[] = [
  {
    id: 'doc-1',
    title: 'Giải Thuật Học Máy & Ứng Dụng Trong Phân Tích Dữ Liệu Lớn',
    category: 'Khoa Học Máy Tính',
    school: 'bkhn',
    subject: 'cs',
    kind: 'Giáo trình',
    year: '2025',
    gradient: 'from-[#0ea5e9] to-[#2563eb]',
    author: {
      name: 'TS. Trần Minh Đức',
      initials: 'MĐ',
      school: 'Đại học Quốc gia Hà Nội',
      followersCount: '1.4k người theo dõi',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    },
    sharedAt: '5 giờ trước',
    postText: 'Tổng hợp thuật toán KNN, Decision Tree, Random Forest kèm bài tập thực hành Python Colab cho sinh viên.',
    document: {
      title: 'Giải Thuật Học Máy & Ứng Dụng Trong Big Data',
      typeLabel: 'Bài giảng',
      category: 'Khoa Học Máy Tính',
      year: '2024',
      pagesText: '45 trang mẫu',
      gradient: 'from-[#3B82F6] via-[#2563EB] to-[#1D4ED8]',
    },
    likes: 128,
    comments: 32,
    saves: 42,
    tabCategory: 'trending',
  },
  {
    id: 'doc-2',
    title: 'Giáo Trình Cấu Trúc Dữ Liệu & Giải Thuật (C++)',
    category: 'Công Nghệ Thông Tin',
    school: 'bkhn',
    subject: 'cntt',
    kind: 'Giáo trình',
    year: '2024',
    gradient: 'from-[#10b981] to-[#059669]',
    author: {
      name: 'Nguyễn Hoàng Nam',
      initials: 'HN',
      school: 'ĐH Bách Khoa TP.HCM',
      followersCount: '450 người theo dõi',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    },
    pages: 82,
    fileSize: '5.8 MB',
    description: 'Bộ ghi chép chi tiết về Đồ thị, Cây AVL, Bảng băm và các thuật toán sắp xếp tối ưu bộ nhớ.',
    createdAt: '5 giờ trước',
    likes: 310,
    views: 2890,
    saves: 115,
    tabCategory: 'trending',
    tags: ['DataStructure', 'CPP', 'Algorithm'],
  },
  {
    id: 'doc-3',
    title: 'Tài Liệu Ôn Tập Xác Suất Thống Kê Dành Cho Kỹ Sư',
    category: 'Toán Ứng Dụng',
    school: 'neu',
    subject: 'math',
    kind: 'Đề thi / Bài tập',
    year: '2025',
    gradient: 'from-[#f59e0b] to-[#d97706]',
    author: {
      name: 'Lê Thị Thu Thảo',
      role: 'Thạc sĩ Toán Tin',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    },
    pages: 30,
    fileSize: '2.1 MB',
    description: 'Tóm tắt công thức Phân phối Chuẩn, Phân phối Poisson, Kiểm định Giả thuyết H0/H1 có lời giải chi tiết.',
    createdAt: '1 ngày trước',
    likes: 95,
    comments: 12,
    saves: 28,
    tabCategory: 'following',
  },
  {
    id: 'doc-4',
    title: 'Thiết Kế Hệ Thống Phân Tán (Distributed Systems Overview)',
    category: 'Kiến Trúc Phần Mềm',
    school: 'bkhn',
    subject: 'arch',
    kind: 'Ghi chép',
    year: '2024',
    gradient: 'from-[#6366f1] to-[#8b5cf6]',
    author: {
      name: 'Lê Thị Thu Thảo',
      initials: 'TT',
      school: 'ĐH Sư Phạm Hà Nội',
      followersCount: '920 người theo dõi',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    },
    sharedAt: '2 ngày trước',
    postText: 'Tóm tắt công thức Phân phối Chuẩn, Phân phối Poisson và Kiểm định Giả thuyết H0/H1.',
    document: {
      title: 'Tài Liệu Ôn Tập Xác Suất Thống Kê Dành Cho Kỹ Sư',
      typeLabel: 'Đề cương',
      category: 'Toán Ứng Dụng',
      year: '2025',
      pagesText: '8 trang mẫu',
      gradient: 'from-[#F59E0B] via-[#D97706] to-[#B45309]',
    },
    likes: 210,
    comments: 19,
    saves: 85,
    tabCategory: 'trending',
  },
  {
    id: 'doc-neu-1',
    title: 'Cung, cầu và cân bằng thị trường',
    category: 'Kinh tế vi mô',
    school: 'neu',
    subject: 'ktvm',
    kind: 'Đề cương',
    year: '2025',
    gradient: 'from-[#d946ef] via-[#a855f7] to-[#ec4899]',
    author: {
      name: 'Lan Chi',
      role: 'Sinh viên NEU',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    },
    pages: 2,
    fileSize: '1.2 MB',
    description: 'Tóm tắt lý thuyết Cung, Cầu, Tác động của thuế và giá trần/giá sàn kèm bài tập minh họa.',
    createdAt: '1 giờ trước',
    likes: 240,
    views: 1890,
    saves: 95,
    tabCategory: 'for-you',
    tags: ['Microeconomics', 'NEU', 'Exam'],
  },
  {
    id: 'doc-neu-2',
    title: 'Marketing mix: hệ thống hóa mô hình 4P',
    category: 'Marketing căn bản',
    school: 'neu',
    subject: 'mkt',
    kind: 'Đề cương',
    year: '2025',
    gradient: 'from-[#6366f1] via-[#8b5cf6] to-[#d946ef]',
    author: {
      name: 'Đức Minh',
      role: 'Sinh viên NEU',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    },
    pages: 2,
    fileSize: '1.5 MB',
    description: 'Phân tích chiến lược Product, Price, Place, Promotion áp dụng cho doanh nghiệp thực tế.',
    createdAt: '2 giờ trước',
    likes: 180,
    views: 1420,
    saves: 67,
    tabCategory: 'for-you',
    tags: ['Marketing', 'NEU', '4P'],
  },
  {
    id: 'doc-neu-3',
    title: 'Quản trị học - Tóm tắt lý thuyết & câu hỏi thảo luận',
    category: 'Quản trị học',
    school: 'neu',
    subject: 'mkt',
    kind: 'Đề cương',
    year: '2025',
    gradient: 'from-[#0284c7] via-[#3b82f6] to-[#8b5cf6]',
    author: {
      name: 'Bảo Châu',
      role: 'Sinh viên NEU',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80',
    },
    pages: 3,
    fileSize: '2.0 MB',
    description: 'Tổng hợp 4 chức năng cơ bản của quản trị: Hoạch định, Tổ chức, Lãnh đạo, Kiểm tra.',
    createdAt: '3 giờ trước',
    likes: 145,
    views: 1100,
    saves: 52,
    tabCategory: 'for-you',
    tags: ['Management', 'NEU', 'Summary'],
  },
];


