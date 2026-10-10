import type { ComponentType, ReactNode } from 'react';
import {
  Compass,
  List,
  Clock3,
  Bookmark,
  User,
  Settings as SettingsIcon,
  Trophy,
  Sparkles,
} from 'lucide-react';
import {
  HomePage,
  ExplorePage,
  SubjectsPage,
  SchoolsPage,
  LibraryPage,
  ProfilePage,
  SettingsPage,
  LeaderboardPage,
  UploadPage,
  LoginPage,
  DetailPage,
  RecentPage,
  QuizPage,
} from '../pages';

export interface RouteConfig {
  path: string;
  label: string;
  icon: ComponentType<{ size?: number | string; className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  element: ReactNode;
  public?: boolean;
  inNav?: boolean;
}

export const routesConfig: RouteConfig[] = [
  {
    path: '/',
    label: 'Home',
    icon: Compass,
    element: <HomePage />,
    public: true,
    inNav: true,
  },
  {
    path: '/explore',
    label: 'Khám phá',
    icon: List,
    element: <ExplorePage />,
    public: true,
    inNav: true,
  },
  {
    path: '/detail/:id',
    label: 'Chi tiết tài liệu',
    icon: Compass,
    element: <DetailPage />,
    public: true,
    inNav: false,
  },
  {
    path: '/kham-pha',
    label: 'Khám phá',
    icon: List,
    element: <ExplorePage />,
    public: true,
    inNav: false,
  },
  {
    path: '/detail',
    label: 'Chi tiết tài liệu',
    icon: Compass,
    element: <DetailPage />,
    public: true,
    inNav: false,
  },
  {
    path: '/mon-hoc',
    label: 'Môn học',
    icon: List,
    element: <SubjectsPage />,
    public: true,
    inNav: false,
  },
  {
    path: '/tai-lieu/:id',
    label: 'Chi tiết tài liệu',
    icon: Compass,
    element: <DetailPage />,
    public: true,
    inNav: false,
  },
  {
    path: '/tai-lieu',
    label: 'Chi tiết tài liệu',
    icon: Compass,
    element: <DetailPage />,
    public: true,
    inNav: false,
  },
  {
    path: '/truong',
    label: 'Trường học',
    icon: List,
    element: <SchoolsPage />,
    public: true,
    inNav: false,
  },
  {
    path: '/recent',
    label: 'Recent',
    icon: Clock3,
    element: <RecentPage />,
    public: false,
    inNav: true,
  },
  {
    path: '/library',
    label: 'Library',
    icon: Bookmark,
    element: <LibraryPage />,
    public: false,
    inNav: true,
  },
  {
    path: '/profile',
    label: 'Hồ sơ',
    icon: User,
    element: <ProfilePage />,
    public: false,
    inNav: true,
  },
  {
    path: '/settings',
    label: 'Cài đặt',
    icon: SettingsIcon,
    element: <SettingsPage />,
    public: false,
    inNav: true,
  },
  {
    path: '/leaderboard',
    label: 'Bảng xếp hạng',
    icon: Trophy,
    element: <LeaderboardPage />,
    public: false,
    inNav: true,
  },
  {
    path: '/quiz',
    label: 'Quiz Ôn Tập',
    icon: Sparkles,
    element: <QuizPage />,
    public: true,
    inNav: true,
  },
  {
    path: '/upload',
    label: 'Tải tài liệu',
    icon: Compass,
    element: <UploadPage />,
    public: true,
    inNav: false,
  },
  {
    path: '/tai-len',
    label: 'Tải tài liệu',
    icon: Compass,
    element: <UploadPage />,
    public: true,
    inNav: false,
  },
  {
    path: '/login',
    label: 'Đăng nhập',
    icon: Compass,
    element: <LoginPage />,
    public: true,
    inNav: false,
  },
];

export const navRoutes = routesConfig.filter((route) => route.inNav !== false);
