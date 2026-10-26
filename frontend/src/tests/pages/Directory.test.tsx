import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Directory } from '../../pages/Directory';
import { taxonomyService } from '../../services/taxonomyService';

const MOCK_UNIS = [
  { id: 'uni-neu', name: 'Đại học Kinh tế Quốc dân', code: 'NEU', city: 'Hà Nội' },
  { id: 'uni-bk', name: 'Đại học Bách Khoa Hà Nội', code: 'BKHN', city: 'Hà Nội' },
];
const MOCK_COURSES = [
  { id: 'course-ktvm', name: 'Kinh tế vi mô', area: 'Kinh tế', code: 'KTVM' },
  { id: 'course-dstt', name: 'Đại số tuyến tính', area: 'Toán học', code: 'DSTT' },
];

describe('Directory Page Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(taxonomyService, 'getUniversities').mockResolvedValue(MOCK_UNIS as any);
    vi.spyOn(taxonomyService, 'getCourses').mockResolvedValue(MOCK_COURSES as any);
  });

  it('renders Subject Directory page with taxonomy courses', async () => {
    render(
      <MemoryRouter>
        <Directory type="subject" />
      </MemoryRouter>
    );

    expect(screen.getByText('TRA CỨU / MÔN HỌC')).toBeInTheDocument();
    expect(screen.getByText('Tìm đúng môn. Học đúng phần.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nhập tên môn học')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Kinh tế vi mô')).toBeInTheDocument();
    });
  });

  it('renders School Directory page with taxonomy universities', async () => {
    render(
      <MemoryRouter>
        <Directory type="school" />
      </MemoryRouter>
    );

    expect(screen.getByText('TRA CỨU / TRƯỜNG ĐẠI HỌC')).toBeInTheDocument();
    expect(screen.getByText('Mỗi trường, một kho kiến thức.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Tên trường hoặc tên viết tắt')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Đại học Kinh tế Quốc dân')).toBeInTheDocument();
    });
  });

  it('filters subjects when searching', async () => {
    render(
      <MemoryRouter>
        <Directory type="subject" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Kinh tế vi mô')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Nhập tên môn học');
    fireEvent.change(input, { target: { value: 'Kinh tế' } });

    expect(screen.getByText('Kinh tế vi mô')).toBeInTheDocument();
    expect(screen.queryByText('Đại số tuyến tính')).not.toBeInTheDocument();
  });
});
