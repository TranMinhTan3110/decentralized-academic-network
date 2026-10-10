import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Directory } from '../../pages/Directory';

describe('Directory Page Unit Tests', () => {
  it('renders Subject Directory page correctly', () => {
    render(
      <MemoryRouter>
        <Directory type="subject" />
      </MemoryRouter>
    );

    expect(screen.getByText('TRA CỨU / MÔN HỌC')).toBeInTheDocument();
    expect(screen.getByText('Tìm đúng môn. Học đúng phần.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nhập tên môn học')).toBeInTheDocument();
    expect(screen.getByText('Kinh tế vi mô')).toBeInTheDocument();
  });

  it('renders School Directory page correctly', () => {
    render(
      <MemoryRouter>
        <Directory type="school" />
      </MemoryRouter>
    );

    expect(screen.getByText('TRA CỨU / TRƯỜNG ĐẠI HỌC')).toBeInTheDocument();
    expect(screen.getByText('Mỗi trường, một kho kiến thức.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Tên trường hoặc tên viết tắt')).toBeInTheDocument();
  });

  it('filters subjects when searching', () => {
    render(
      <MemoryRouter>
        <Directory type="subject" />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText('Nhập tên môn học');
    fireEvent.change(input, { target: { value: 'Kinh tế' } });

    expect(screen.getByText('Kinh tế vi mô')).toBeInTheDocument();
    expect(screen.queryByText('Đại số tuyến tính')).not.toBeInTheDocument();
  });
});
