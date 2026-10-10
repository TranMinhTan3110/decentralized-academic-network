import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UploadPage } from '../../pages/UploadPage/UploadPage';

describe('UploadPage Component Unit Tests', () => {
  it('renders upload title, dropzone, form fields, and guidance sidebar', () => {
    render(
      <MemoryRouter initialEntries={['/upload']}>
        <UploadPage />
      </MemoryRouter>
    );

    expect(screen.getByText('CHIA SẺ TÀI LIỆU')).toBeInTheDocument();
    expect(screen.getByText('Một ghi chép tốt, thêm một người hiểu.')).toBeInTheDocument();
    expect(screen.getByText('Chọn file hoặc kéo thả vào đây')).toBeInTheDocument();
    expect(screen.getByText('Tiêu đề tài liệu')).toBeInTheDocument();
    expect(screen.getByText('Trường đại học')).toBeInTheDocument();
    expect(screen.getByText('Môn học')).toBeInTheDocument();
    expect(screen.getByText('Loại tài liệu')).toBeInTheDocument();
    expect(screen.getByText('Năm học')).toBeInTheDocument();
    expect(screen.getByText(/Dễ tìm/i)).toBeInTheDocument();
  });

  it('shows error messages when submitting without required fields', () => {
    render(
      <MemoryRouter initialEntries={['/upload']}>
        <UploadPage />
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /Kiểm tra bản nháp/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Vui lòng kiểm tra các trường được đánh dấu trước khi tiếp tục.')).toBeInTheDocument();
  });

  it('allows typing custom school and subject names in text inputs', () => {
    render(
      <MemoryRouter initialEntries={['/upload']}>
        <UploadPage />
      </MemoryRouter>
    );

    const schoolInput = screen.getByPlaceholderText('Chọn gợi ý hoặc tự nhập trường...') as HTMLInputElement;
    const subjectInput = screen.getByPlaceholderText('Chọn gợi ý hoặc tự nhập môn học...') as HTMLInputElement;

    fireEvent.change(schoolInput, { target: { value: 'Đại học Y Hà Nội' } });
    fireEvent.change(subjectInput, { target: { value: 'Hóa sinh y học' } });

    expect(schoolInput.value).toBe('Đại học Y Hà Nội');
    expect(subjectInput.value).toBe('Hóa sinh y học');
  });
});
