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
} from '../../pages';

describe('Page Components Unit Tests', () => {
  it('renders HomePage correctly', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <HomePage />
      </MemoryRouter>
    );
    expect(screen.getByText('DÒNG CHIA SẺ HỌC TẬP')).toBeInTheDocument();
  });

  it('renders ExplorePage correctly', () => {
    render(
      <MemoryRouter initialEntries={['/explore']}>
        <ExplorePage />
      </MemoryRouter>
    );
    expect(screen.getByText('Hôm nay, bạn học gì?')).toBeInTheDocument();
  });

  it('renders LibraryPage correctly', () => {
    render(
      <MemoryRouter initialEntries={['/library']}>
        <LibraryPage />
      </MemoryRouter>
    );
    expect(screen.getByText('LibraryPage')).toBeInTheDocument();
  });

  it('renders ProfilePage correctly', () => {
    render(
      <MemoryRouter initialEntries={['/profile']}>
        <ProfilePage />
      </MemoryRouter>
    );
    expect(screen.getByText('ProfilePage')).toBeInTheDocument();
  });

  it('renders SettingsPage correctly', () => {
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <SettingsPage />
      </MemoryRouter>
    );
    expect(screen.getByText('SettingsPage')).toBeInTheDocument();
  });

  it('renders LeaderboardPage correctly', () => {
    render(
      <MemoryRouter initialEntries={['/leaderboard']}>
        <LeaderboardPage />
      </MemoryRouter>
    );
    expect(screen.getByText('LeaderboardPage')).toBeInTheDocument();
  });

  it('renders UploadPage correctly', () => {
    render(
      <MemoryRouter initialEntries={['/upload']}>
        <UploadPage />
      </MemoryRouter>
    );
    expect(screen.getByText('UploadPage')).toBeInTheDocument();
  });

  it('renders LoginPage correctly', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>
    );
    expect(screen.getByText('LoginPage')).toBeInTheDocument();
  });
});
