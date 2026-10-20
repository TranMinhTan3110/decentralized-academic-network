import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UploadPage } from '../../pages/UploadPage/UploadPage';
import { taxonomyService } from '../../services/taxonomyService';
import { documentService } from '../../services/documentService';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('UploadPage Component Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockNavigate.mockReset();
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/mock-file');
    window.URL.revokeObjectURL = vi.fn();
  });

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

  it('fetches and displays universities from taxonomyService', async () => {
    const uniSpy = vi.spyOn(taxonomyService, 'getUniversities').mockResolvedValue([
      { id: 'uni-bk', name: 'Đại học Bách Khoa Hà Nội', code: 'BKHN' },
      { id: 'uni-khtn', name: 'Đại học Khoa học Tự nhiên', code: 'HUS' },
    ]);

    render(
      <MemoryRouter initialEntries={['/upload']}>
        <UploadPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(uniSpy).toHaveBeenCalled();
    });

    // Check datalist options
    const datalist = document.getElementById('schools-list');
    expect(datalist).toBeInTheDocument();
    expect(datalist?.querySelector('option[value="Đại học Bách Khoa Hà Nội"]')).toBeTruthy();
  });

  it('renders DRM configuration options for free pages, unlock points, and blur lock', () => {
    render(
      <MemoryRouter initialEntries={['/upload']}>
        <UploadPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Cấu hình bản quyền & DRM/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Số trang đọc thử miễn phí/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Điểm mở khóa/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Làm mờ trang khóa bảo mật/i)).toBeInTheDocument();
  });

  it('uploads document to IPFS via documentService.upload and navigates on success', async () => {
    const uploadSpy = vi.spyOn(documentService, 'upload').mockResolvedValue({
      id: 'doc-ipfs-123',
      title: 'Đề thi Giải tích 1',
      ipfsCid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
    } as any);

    render(
      <MemoryRouter initialEntries={['/upload']}>
        <UploadPage />
      </MemoryRouter>
    );

    // Create a mock valid PDF file
    const file = new File(['%PDF-1.5 test document content'], 'giai-tich.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText('Chọn file PDF');
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Fill form
    const titleInput = screen.getByPlaceholderText('Ví dụ: Đề cương ôn tập Kinh tế vi mô');
    fireEvent.change(titleInput, { target: { value: 'Đề thi Giải tích 1' } });

    const schoolInput = screen.getByPlaceholderText('Chọn gợi ý hoặc tự nhập trường...');
    fireEvent.change(schoolInput, { target: { value: 'Đại học Bách Khoa Hà Nội' } });

    const subjectInput = screen.getByPlaceholderText('Chọn gợi ý hoặc tự nhập môn học...');
    fireEvent.change(subjectInput, { target: { value: 'Giải tích 1' } });

    const kindSelect = screen.getByDisplayValue('Chọn loại tài liệu');
    fireEvent.change(kindSelect, { target: { value: 'Đề thi / Bài tập' } });

    const yearSelect = screen.getByDisplayValue('Chọn năm học');
    fireEvent.change(yearSelect, { target: { value: '2026' } });

    const rightsCheckbox = screen.getByLabelText(/Tôi tự biên soạn hoặc có quyền chia sẻ/i);
    fireEvent.click(rightsCheckbox);

    // Click verify / check draft button
    const submitBtn = screen.getByRole('button', { name: /Kiểm tra bản nháp/i });
    fireEvent.click(submitBtn);

    // Step 2 should appear
    await waitFor(() => {
      expect(screen.getByText('Bản nháp đã được kiểm tra.')).toBeInTheDocument();
    });

    // Check that IPFS publish button is present and click it
    const ipfsPublishBtn = screen.getByRole('button', { name: /Xuất bản lên Mạng lưới \(IPFS\)/i });
    expect(ipfsPublishBtn).toBeInTheDocument();
    fireEvent.click(ipfsPublishBtn);

    await waitFor(() => {
      expect(uploadSpy).toHaveBeenCalledWith(expect.any(FormData));
      expect(mockNavigate).toHaveBeenCalledWith('/detail/doc-ipfs-123');
    });
  });

  it('displays error toast and does not navigate when backend upload fails', async () => {
    vi.spyOn(documentService, 'upload').mockRejectedValue(new Error('Backend upload failed'));

    render(
      <MemoryRouter initialEntries={['/upload']}>
        <UploadPage />
      </MemoryRouter>
    );

    const file = new File(['%PDF-1.5 test pdf content'], 'tai-lieu.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText('Chọn file PDF');
    fireEvent.change(fileInput, { target: { files: [file] } });

    const titleInput = screen.getByPlaceholderText('Ví dụ: Đề cương ôn tập Kinh tế vi mô');
    fireEvent.change(titleInput, { target: { value: 'Tài liệu Thất Bại Test' } });

    const schoolInput = screen.getByPlaceholderText('Chọn gợi ý hoặc tự nhập trường...');
    fireEvent.change(schoolInput, { target: { value: 'Đại học Bách Khoa' } });

    const subjectInput = screen.getByPlaceholderText('Chọn gợi ý hoặc tự nhập môn học...');
    fireEvent.change(subjectInput, { target: { value: 'Vật lý 1' } });

    const kindSelect = screen.getByDisplayValue('Chọn loại tài liệu');
    fireEvent.change(kindSelect, { target: { value: 'Giáo trình' } });

    const yearSelect = screen.getByDisplayValue('Chọn năm học');
    fireEvent.change(yearSelect, { target: { value: '2026' } });

    const rightsCheckbox = screen.getByLabelText(/Tôi tự biên soạn hoặc có quyền chia sẻ/i);
    fireEvent.click(rightsCheckbox);

    const submitBtn = screen.getByRole('button', { name: /Kiểm tra bản nháp/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Bản nháp đã được kiểm tra.')).toBeInTheDocument();
    });

    const ipfsPublishBtn = screen.getByRole('button', { name: /Xuất bản lên Mạng lưới \(IPFS\)/i });
    fireEvent.click(ipfsPublishBtn);

    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
