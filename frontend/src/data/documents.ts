export interface DocumentPage {
  heading: string;
  paragraphs: string[];
}

export interface DocumentItem {
  id: string;
  title: string;
  category: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  pages: DocumentPage[];
  fileSize: string;
  description: string;
  createdAt: string;
  likes: number;
  views: number;
  saves: number;
  tabCategory: 'for-you' | 'following' | 'trending';
  tags: string[];
  subject: string;
  school: string;
  kind: string;
  year: number;
  updated: string;
}

export const schools = [
  { id: 'neu', name: 'Đại học Kinh tế Quốc dân', short: 'NEU', city: 'Hà Nội' },
  { id: 'hust', name: 'Đại học Bách khoa Hà Nội', short: 'HUST', city: 'Hà Nội' },
  { id: 'vnu', name: 'Đại học Quốc gia Hà Nội', short: 'VNU', city: 'Hà Nội' },
  { id: 'ftu', name: 'Đại học Ngoại thương', short: 'FTU', city: 'Hà Nội' },
];

export const subjects = [
  { id: 'microecon', name: 'Kinh tế vi mô', area: 'Kinh tế' },
  { id: 'cs', name: 'Khoa Học Máy Tính', area: 'CNTT' },
  { id: 'cpp', name: 'Cấu trúc dữ liệu & Giải thuật', area: 'CNTT' },
  { id: 'stats', name: 'Xác suất thống kê', area: 'Toán tin' },
];

export const kinds = ['Đề cương', 'Giáo trình', 'Bài tập', 'Đồ án', 'Tóm tắt'];

export function schoolName(id: string): string {
  return schools.find((s) => s.id === id)?.name || id;
}

export function subjectName(id: string): string {
  return subjects.find((s) => s.id === id)?.name || id;
}

export const documents: DocumentItem[] = [
  {
    id: 'doc-1',
    title: 'Cung, cầu và cân bằng thị trường',
    category: 'Kinh tế vi mô',
    author: {
      name: 'Lan Chi',
      role: 'Đại học Bách khoa Hà Nội',
      avatar: 'LC',
    },
    pages: [
      {
        heading: '01. Cung và cầu',
        paragraphs: [
          'Lượng cầu là số lượng hàng hóa mà người mua sẵn sàng và có khả năng mua tại một mức giá, trong một khoảng thời gian xác định. Khi các yếu tố khác không đổi, giá tăng thường làm lượng cầu giảm.',
          'Cần phân biệt sự di chuyển dọc đường cầu do giá của chính hàng hóa thay đổi với sự dịch chuyển đường cầu do thu nhập, thị hiếu hoặc giá hàng hóa liên quan thay đổi.',
        ],
      },
      {
        heading: '02. Điểm cân bằng thị trường',
        paragraphs: [
          'Thị trường đạt trạng thái cân bằng tại mức giá Pe và lượng Qe mà tại đó lượng cung bằng lượng cầu (Qs = Qd).',
          'Sự thay đổi của các yếu tố ngoài giá sẽ làm dịch chuyển đường cung hoặc đường cầu, dẫn đến giá và lượng cân bằng mới.',
        ],
      },
    ],
    fileSize: '1.5 MB',
    description: 'Hệ thống các khái niệm nền tảng, cách xác định điểm cân bằng và bài tập dịch chuyển đường cung, cầu.',
    createdAt: '2 giờ trước',
    likes: 1200,
    views: 3400,
    saves: 89,
    tabCategory: 'for-you',
    tags: ['Microecon', 'NEU', 'Economics'],
    subject: 'microecon',
    school: 'neu',
    kind: 'Đề cương',
    year: 2025,
    updated: '2026-09-12',
  },
  {
    id: 'doc-2',
    title: 'Độ co giãn của cầu theo giá',
    category: 'Kinh tế vi mô',
    author: {
      name: 'Trần Mỹ Linh',
      role: 'Đại học Ngoại thương',
      avatar: 'ML',
    },
    pages: [
      {
        heading: '01. Khái niệm độ co giãn theo giá',
        paragraphs: [
          'Độ co giãn của cầu theo giá đo lường phần trăm thay đổi trong lượng cầu khi giá của hàng hóa đó thay đổi 1%.',
        ],
      },
      {
        heading: '02. Các yếu tố tác động',
        paragraphs: [
          'Sự sẵn có của hàng hóa thay thế, tính chất thiết yếu hay xa xỉ của hàng hóa, tỷ trọng chi tiêu trong thu nhập và khoảng thời gian phân tích.',
        ],
      },
    ],
    fileSize: '1.2 MB',
    description: 'Bài tập tình huống và công thức tính độ co giãn của cầu theo giá, thu nhập và giá chéo.',
    createdAt: '3 ngày trước',
    likes: 850,
    views: 2100,
    saves: 95,
    tabCategory: 'for-you',
    tags: ['Microecon', 'FTU', 'Elasticity'],
    subject: 'microecon',
    school: 'ftu',
    kind: 'Bài tập',
    year: 2024,
    updated: '2026-08-30',
  },
  {
    id: 'doc-3',
    title: 'Giáo Trình Cấu Trúc Dữ Liệu & Giải Thuật (C++)',
    category: 'Công Nghệ Thông Tin',
    author: {
      name: 'Nguyễn Hoàng Nam',
      role: 'Sinh viên K65 Bách Khoa',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    },
    pages: [
      {
        heading: '01. Đồ thị và Cây tìm kiếm cân bằng AVL',
        paragraphs: [
          'Bộ ghi chép chi tiết về Đồ thị, Cây AVL, Bảng băm và các thuật toán sắp xếp tối ưu bộ nhớ.',
        ],
      },
    ],
    fileSize: '5.8 MB',
    description: 'Bộ ghi chép chi tiết về Đồ thị, Cây AVL, Bảng băm và các thuật toán sắp xếp tối ưu bộ nhớ.',
    createdAt: '5 giờ trước',
    likes: 310,
    views: 2890,
    saves: 115,
    tabCategory: 'trending',
    tags: ['DataStructure', 'CPP', 'Algorithm'],
    subject: 'cpp',
    school: 'hust',
    kind: 'Giáo trình',
    year: 2024,
    updated: '2026-07-15',
  },
  {
    id: 'doc-4',
    title: 'Tài Liệu Ôn Tập Xác Suất Thống Kê Dành Cho Kỹ Sư',
    category: 'Toán Ứng Dụng',
    author: {
      name: 'Lê Thị Thu Thảo',
      role: 'Thạc sĩ Toán Tin',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    },
    pages: [
      {
        heading: '01. Phân phối xác suất chuẩn & Poisson',
        paragraphs: [
          'Tóm tắt công thức Phân phối Chuẩn, Phân phối Poisson, Kiểm định Giả thuyết H0/H1 có lời giải chi tiết.',
        ],
      },
    ],
    fileSize: '2.1 MB',
    description: 'Tóm tắt công thức Phân phối Chuẩn, Phân phối Poisson, Kiểm định Giả thuyết H0/H1 có lời giải chi tiết.',
    createdAt: '1 ngày trước',
    likes: 95,
    views: 890,
    saves: 28,
    tabCategory: 'following',
    tags: ['Math', 'Statistics', 'Engineering'],
    subject: 'stats',
    school: 'hust',
    kind: 'Đề cương',
    year: 2025,
    updated: '2026-09-01',
  },
  {
    id: 'doc-5',
    title: 'Thiết Kế Hệ Thống Phân Tán (Distributed Systems Overview)',
    category: 'Kiến Trúc Phần Mềm',
    author: {
      name: 'Phạm Vũ Hoàng',
      role: 'Senior System Architect',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    },
    pages: [
      {
        heading: '01. Khái niệm Raft Consensus & CAP Theorem',
        paragraphs: [
          'Khái niệm Raft Consensus, CAP Theorem, Eventual Consistency và kiến trúc Microservices hiện đại.',
        ],
      },
    ],
    fileSize: '4.5 MB',
    description: 'Khái niệm Raft Consensus, CAP Theorem, Eventual Consistency và kiến trúc Microservices hiện đại.',
    createdAt: '2 ngày trước',
    likes: 420,
    views: 3500,
    saves: 210,
    tabCategory: 'trending',
    tags: ['SystemDesign', 'Distributed', 'Backend'],
    subject: 'cs',
    school: 'vnu',
    kind: 'Giáo trình',
    year: 2025,
    updated: '2026-09-10',
  },
  {
    id: 'doc-6',
    title: 'Ghi Chép Môn Hóa Sinh Y Học - Chuyển Hóa Năng Lượng',
    category: 'Y Dược',
    author: {
      name: 'Đặng Mai Phương',
      role: 'Sinh viên Y Hà Nội',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80',
    },
    pages: [
      {
        heading: '01. Chu trình Krebs và Chuyển hóa Lipid',
        paragraphs: [
          'Sơ đồ tư duy Chu trình Krebs, Chuỗi chuyền Electron và Chuyển hóa Lipid rõ ràng, dễ hiểu.',
        ],
      },
    ],
    fileSize: '1.9 MB',
    description: 'Sơ đồ tư duy Chu trình Krebs, Chuỗi chuyền Electron và Chuyển hóa Lipid rõ ràng, dễ hiểu.',
    createdAt: '3 ngày trước',
    likes: 74,
    views: 620,
    saves: 19,
    tabCategory: 'following',
    tags: ['Biochemistry', 'Medicine', 'Notes'],
    subject: 'stats',
    school: 'vnu',
    kind: 'Tóm tắt',
    year: 2025,
    updated: '2026-09-15',
  },
];
