export interface DocumentItem {
  id: string;
  title: string;
  category: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  pages: number;
  fileSize: string;
  description: string;
  createdAt: string;
  likes: number;
  views: number;
  saves: number;
  tabCategory: 'for-you' | 'following' | 'trending';
  tags: string[];
}

export const documents: DocumentItem[] = [
  {
    id: 'doc-1',
    title: 'Giải Thuật Học Máy & Ứng Dụng Trong Phân Tích Dữ Liệu Lớn',
    category: 'Khoa Học Máy Tính',
    author: {
      name: 'TS. Trần Minh Đức',
      role: 'Giảng viên ĐHQG',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    },
    pages: 45,
    fileSize: '3.2 MB',
    description: 'Tổng hợp thuật toán KNN, Decision Tree, Random Forest kèm bài tập Python mẫu thực hành trên Colab.',
    createdAt: '2 giờ trước',
    likes: 128,
    views: 1450,
    saves: 42,
    tabCategory: 'for-you',
    tags: ['MachineLearning', 'Python', 'AI'],
  },
  {
    id: 'doc-2',
    title: 'Giáo Trình Cấu Trúc Dữ Liệu & Giải Thuật (C++)',
    category: 'Công Nghệ Thông Tin',
    author: {
      name: 'Nguyễn Hoàng Nam',
      role: 'Sinh viên K65 Bách Khoa',
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
    views: 890,
    saves: 28,
    tabCategory: 'following',
    tags: ['Math', 'Statistics', 'Engineering'],
  },
  {
    id: 'doc-4',
    title: 'Thiết Kế Hệ Thống Phân Tán (Distributed Systems Overview)',
    category: 'Kiến Trúc Phần Mềm',
    author: {
      name: 'Phạm Vũ Hoàng',
      role: 'Senior System Architect',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    },
    pages: 60,
    fileSize: '4.5 MB',
    description: 'Khái niệm Raft Consensus, CAP Theorem, Eventual Consistency và kiến trúc Microservices hiện đại.',
    createdAt: '2 ngày trước',
    likes: 420,
    views: 3500,
    saves: 210,
    tabCategory: 'trending',
    tags: ['SystemDesign', 'Distributed', 'Backend'],
  },
  {
    id: 'doc-5',
    title: 'Ghi Chép Môn Hóa Sinh Y Học - Chuyển Hóa Năng Lượng',
    category: 'Y Dược',
    author: {
      name: 'Đặng Mai Phương',
      role: 'Sinh viên Y Hà Nội',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80',
    },
    pages: 28,
    fileSize: '1.9 MB',
    description: 'Sơ đồ tư duy Chu trình Krebs, Chuỗi chuyền Electron và Chuyển hóa Lipid rõ ràng, dễ hiểu.',
    createdAt: '3 ngày trước',
    likes: 74,
    views: 620,
    saves: 19,
    tabCategory: 'following',
    tags: ['Biochemistry', 'Medicine', 'Notes'],
  },
  {
    id: 'doc-6',
    title: 'Tổng Quan Về Blockchain & Hợp Đồng Thông Minh (Smart Contracts)',
    category: 'Công Nghệ Chuỗi Khối',
    author: {
      name: 'Vũ Minh Tuấn',
      role: 'Blockchain Researcher',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
    },
    pages: 50,
    fileSize: '3.8 MB',
    description: 'Tìm hiểu cơ chế đồng thuận PoW/PoS, lập trình Solidity cơ bản và bảo mật Smart Contract trên Ethereum.',
    createdAt: '4 ngày trước',
    likes: 215,
    views: 1980,
    saves: 88,
    tabCategory: 'for-you',
    tags: ['Blockchain', 'Web3', 'Solidity'],
  }
];
