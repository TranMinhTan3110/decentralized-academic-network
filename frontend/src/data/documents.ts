export interface DocumentItem {
  id: string;
  author: {
    name: string;
    initials: string;
    school: string;
    followersCount: string;
    avatar?: string;
  };
  sharedAt: string;
  postText: string;
  document: {
    title: string;
    typeLabel: string; // e.g. 'Đề cương', 'Giáo trình', 'Tài liệu'
    category: string;  // e.g. 'Kinh tế vi mô'
    year: string;      // e.g. '2025'
    pagesText: string; // e.g. '2 trang mẫu'
    gradient: string;  // Tailwind gradient string
  };
  likes: number;
  comments: number;
  saves: number;
  tabCategory: 'for-you' | 'following' | 'trending';
}

export const documents: DocumentItem[] = [
  {
    id: 'doc-1',
    author: {
      name: 'Lan Chi',
      initials: 'LC',
      school: 'Đại học Bách khoa Hà Nội',
      followersCount: '86 người theo dõi',
    },
    sharedAt: '2 giờ trước',
    postText: 'Mình gom lại phần nền tảng và thêm một ví dụ để dễ ôn trước khi làm bài.',
    document: {
      title: 'Cung, cầu và cân bằng thị trường',
      typeLabel: 'Đề cương',
      category: 'Kinh tế vi mô',
      year: '2025',
      pagesText: '2 trang mẫu',
      gradient: 'from-[#8B5CF6] via-[#A855F7] to-[#EC4899]',
    },
    likes: 18,
    comments: 4,
    saves: 5,
    tabCategory: 'for-you',
  },
  {
    id: 'doc-2',
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
    id: 'doc-3',
    author: {
      name: 'Nguyễn Hoàng Nam',
      initials: 'HN',
      school: 'ĐH Bách Khoa TP.HCM',
      followersCount: '450 người theo dõi',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    },
    sharedAt: '1 ngày trước',
    postText: 'Bộ ghi chép chi tiết về Đồ thị, Cây AVL và Bảng băm môn Cấu trúc dữ liệu nâng cao.',
    document: {
      title: 'Giáo Trình Cấu Trúc Dữ Liệu & Giải Thuật (C++)',
      typeLabel: 'Ghi chép',
      category: 'Công Nghệ Thông Tin',
      year: '2025',
      pagesText: '12 trang mẫu',
      gradient: 'from-[#10B981] via-[#059669] to-[#047857]',
    },
    likes: 95,
    comments: 12,
    saves: 28,
    tabCategory: 'following',
  },
  {
    id: 'doc-4',
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
    id: 'doc-5',
    author: {
      name: 'Phạm Vũ Hoàng',
      initials: 'VH',
      school: 'ĐH Công Nghệ - ĐHQGHN',
      followersCount: '2.1k người theo dõi',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    },
    sharedAt: '3 ngày trước',
    postText: 'Tổng hợp khái niệm Raft Consensus, CAP Theorem và kiến trúc Microservices hiện đại.',
    document: {
      title: 'Thiết Kế Hệ Thống Phân Tán (Distributed Systems)',
      typeLabel: 'Tài liệu',
      category: 'Kiến Trúc Phần Mềm',
      year: '2024',
      pagesText: '15 trang mẫu',
      gradient: 'from-[#06B6D4] via-[#0891B2] to-[#0E7490]',
    },
    likes: 420,
    comments: 48,
    saves: 210,
    tabCategory: 'for-you',
  }
];
