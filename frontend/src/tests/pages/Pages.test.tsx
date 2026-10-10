import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  HomePage,
  ExplorePage,
  LibraryPage,
  ProfilePage,
  SettingsPage,
  LeaderboardPage,
  UploadPage,
  LoginPage,
  RecentPage,
  QuizPage,
} from '../../pages';

describe('Page Components Unit Tests', () => {
  it('renders HomePage correctly', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <HomePage />
      </MemoryRouter>,
    );
    expect(screen.getByText('DÒNG CHIA SẺ HỌC TẬP')).toBeInTheDocument();
  });

  it('renders ExplorePage correctly', () => {
    render(
      <MemoryRouter initialEntries={['/explore']}>
        <ExplorePage />
      </MemoryRouter>,
    );
    expect(screen.getByText('Hôm nay, bạn học gì?')).toBeInTheDocument();
  });

  it('renders LibraryPage correctly', () => {
    render(
      <MemoryRouter initialEntries={['/library']}>
        <LibraryPage />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Library là nơi/i)).toBeInTheDocument();
  });

  it('renders ProfilePage correctly', () => {
    render(
      <MemoryRouter initialEntries={['/profile']}>
        <ProfilePage />
      </MemoryRouter>,
    );
    expect(screen.getAllByText('Lan Chi')[0]).toBeInTheDocument();
  });

  it('renders SettingsPage correctly', () => {
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <SettingsPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('SettingsPage')).toBeInTheDocument();
  });

  it('renders LeaderboardPage correctly', () => {
    render(
      <MemoryRouter initialEntries={['/leaderboard']}>
        <LeaderboardPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('Bảng Xếp Hạng Đóng Góp Học Thuật')).toBeInTheDocument();
  });

  it('renders UploadPage correctly', () => {
    render(
      <MemoryRouter initialEntries={['/upload']}>
        <UploadPage />
      </MemoryRouter>
    );
    expect(screen.getByText('CHIA SẺ TÀI LIỆU')).toBeInTheDocument();
  });

  it('renders LoginPage correctly', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>
    );
    expect(screen.getByText('LoginPage')).toBeInTheDocument();
  });

  it('renders RecentPage correctly', () => {
    render(
      <MemoryRouter initialEntries={['/recent']}>
        <RecentPage />
      </MemoryRouter>
    );
    expect(screen.getByText('DÒNG HOẠT ĐỘNG CỦA BẠN')).toBeInTheDocument();
  });

  it('renders LoginPage correctly', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('LoginPage')).toBeInTheDocument();
  });

  it('renders QuizPage correctly', () => {
    render(
      <MemoryRouter initialEntries={['/quiz']}>
        <QuizPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('Tạo Quiz & Luyện Tập Trắc Nghiệm')).toBeInTheDocument();
  });
});

