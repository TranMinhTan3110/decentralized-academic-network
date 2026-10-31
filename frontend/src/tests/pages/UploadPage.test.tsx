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

const MOCK_UNIS = [
  { id: 'uni-bk', name: 'Đại học Bách Khoa Hà Nội', code: 'BKHN' },
  { id: 'uni-khtn', name: 'Đại học Khoa học Tự nhiên', code: 'HUS' },
];
const MOCK_COURSES = [
  { id: 'course-gt1', name: 'Giải tích 1', code: 'GT1' },
  { id: 'course-vl1', name: 'Vật lý 1', code: 'VL1' },
];

function mockTaxonomy() {
  vi.spyOn(taxonomyService, 'getUniversities').mockResolvedValue(MOCK_UNIS as any);
  vi.spyOn(taxonomyService, 'getCourses').mockResolvedValue(MOCK_COURSES as any);
}

async function fillAndVerify(opts: {
  title: string;
  schoolInput?: string;
  courseInput?: string;
  kindValue?: string;
  yearInput?: string;
}) {
  const file = new File(['%PDF-1.5 test document content'], 'tai-lieu.pdf', { type: 'application/pdf' });
  const fileInput = screen.getByLabelText('Chọn file PDF');
  fireEvent.change(fileInput, { target: { files: [file] } });

  const titleInput = screen.getByPlaceholderText('Ví dụ: Đề cương ôn tập Kinh tế vi mô');
  fireEvent.change(titleInput, { target: { value: opts.title } });

  const schoolInput = screen.getByLabelText('Trường đại học');
  fireEvent.change(schoolInput, { target: { value: opts.schoolInput ?? 'Đại học Bách Khoa Hà Nội' } });

  const courseInput = screen.getByLabelText('Môn học');
  fireEvent.change(courseInput, { target: { value: opts.courseInput ?? 'Giải tích 1' } });

  const kindSelect = screen.getByLabelText('Loại tài liệu');
  fireEvent.change(kindSelect, { target: { value: opts.kindValue ?? 'EXAM' } });

  const yearInput = screen.getByLabelText('Năm học');
  fireEvent.change(yearInput, { target: { value: opts.yearInput ?? '2026' } });

  const submitBtn = screen.getByRole('button', { name: /Kiểm tra bản nháp/i });
  fireEvent.click(submitBtn);

  await waitFor(() => {
    expect(screen.getByText('Bản nháp đã được kiểm tra.')).toBeInTheDocument();
  });
}

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

  it('shows error messages when submitting without required fields or with invalid custom inputs', () => {
    render(
      <MemoryRouter initialEntries={['/upload']}>
        <UploadPage />
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /Kiểm tra bản nháp/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Vui lòng kiểm tra các trường được đánh dấu trước khi tiếp tục.')).toBeInTheDocument();

    // Test invalid numeric-only school, invalid symbol-only subject, and invalid year
    fireEvent.change(screen.getByLabelText('Trường đại học'), { target: { value: '123456' } });
    fireEvent.change(screen.getByLabelText('Môn học'), { target: { value: '@@@' } });
    fireEvent.change(screen.getByLabelText('Năm học'), { target: { value: '2099' } });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/Tên trường đại học không hợp lệ/i)).toBeInTheDocument();
    expect(screen.getByText(/Tên môn học không hợp lệ/i)).toBeInTheDocument();
    expect(screen.getByText(/Năm học phải nằm trong khoảng từ 1990/i)).toBeInTheDocument();
  });

  it('fetches and displays universities and courses from taxonomyService as datalist suggestions', async () => {
    mockTaxonomy();

    const { container } = render(
      <MemoryRouter initialEntries={['/upload']}>
        <UploadPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const uniOption = container.querySelector('#university-suggestions option[value="Đại học Bách Khoa Hà Nội"]');
      expect(uniOption).not.toBeNull();
      expect(uniOption?.getAttribute('data-id')).toBe('uni-bk');
    });

    const courseOption = container.querySelector('#course-suggestions option[value="Giải tích 1"]');
    expect(courseOption).not.toBeNull();
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

  it('sends universityId/courseId when matched with suggestion and custom names when typed freely', async () => {
    mockTaxonomy();
    const uploadSpy = vi.spyOn(documentService, 'upload').mockResolvedValue({
      id: 'doc-ipfs-123',
      title: 'Đề thi Giải tích 1',
      ipfsCid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
    } as any);

    const { container } = render(
      <MemoryRouter initialEntries={['/upload']}>
        <UploadPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(container.querySelector('#university-suggestions option[value="Đại học Bách Khoa Hà Nội"]')).not.toBeNull();
    });

    await fillAndVerify({
      title: 'Đề thi Giải tích 1',
      schoolInput: 'Đại học Bách Khoa Hà Nội',
      courseInput: 'Giải tích 1',
      yearInput: '2025-2026',
    });

    const ipfsPublishBtn = screen.getByRole('button', { name: /Đồng ý & Đăng tài liệu/i });
    fireEvent.click(ipfsPublishBtn);

    await waitFor(() => {
      expect(uploadSpy).toHaveBeenCalledWith(expect.any(FormData));
      expect(mockNavigate).toHaveBeenCalledWith('/detail/doc-ipfs-123');
    });

    const formData = uploadSpy.mock.calls[0][0] as FormData;
    expect(formData.get('universityId')).toBe('uni-bk');
    expect(formData.get('universityName')).toBe('Đại học Bách Khoa Hà Nội');
    expect(formData.get('courseId')).toBe('course-gt1');
    expect(formData.get('courseName')).toBe('Giải tích 1');
    expect(formData.get('docType')).toBe('EXAM');
    expect(formData.get('academicYear')).toBe('2025-2026');
    expect(formData.get('freePages')).toBe('3');
    expect(formData.get('blurLockEnabled')).toBe('true');
  });

  it('displays error toast and does not navigate when backend upload fails', async () => {
    mockTaxonomy();
    vi.spyOn(documentService, 'upload').mockRejectedValue(new Error('Backend upload failed'));

    render(
      <MemoryRouter initialEntries={['/upload']}>
        <UploadPage />
      </MemoryRouter>
    );

    await fillAndVerify({
      title: 'Tài liệu Thất Bại Test',
      schoolInput: 'Đại học Công nghệ Sài Gòn',
      courseInput: 'Cấu trúc dữ liệu và Giải thuật',
      yearInput: '2026',
    });

    const ipfsPublishBtn = screen.getByRole('button', { name: /Đồng ý & Đăng tài liệu/i });
    fireEvent.click(ipfsPublishBtn);

    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
