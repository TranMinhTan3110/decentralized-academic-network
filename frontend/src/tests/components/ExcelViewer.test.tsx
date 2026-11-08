import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExcelViewer } from '../../components/ui/ExcelViewer';
import * as XLSX from 'xlsx';
import { documentService } from '../../services/documentService';

vi.mock('../../services/documentService', () => ({
  documentService: {
    download: vi.fn(),
  },
}));

function createMockExcelBlob(): Blob {
  const wb = XLSX.utils.book_new();
  const data1 = [
    ['STT', 'MSSV', 'Họ và tên', 'Điểm'],
    [1, '6451071001', 'Nguyễn Văn Hùng', 8.5],
    [2, '6451071002', 'Trần Thị Mai', 9.0],
    [3, '6451071003', 'Lê Minh Quân', 7.5],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(data1);
  XLSX.utils.book_append_sheet(wb, ws1, 'Bảng điểm');

  const data2 = [
    ['Mã môn', 'Tên môn'],
    ['INT1001', 'Nhập môn CNTT'],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(data2);
  XLSX.utils.book_append_sheet(wb, ws2, 'Danh sách môn');

  const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  blob.arrayBuffer = vi.fn().mockResolvedValue(buffer);
  return blob;
}

function createLargeMockExcelBlob(rowCount: number): Blob {
  const wb = XLSX.utils.book_new();
  const data: any[][] = [['STT', 'Tên mục']];
  for (let i = 1; i <= rowCount; i++) {
    data.push([i, `Mục số ${i}`]);
  }
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Dữ liệu lớn');

  const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  blob.arrayBuffer = vi.fn().mockResolvedValue(buffer);
  return blob;
}

describe('ExcelViewer Component Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders spreadsheet grid with title, column letters and cell contents', async () => {
    const fakeBlob = createMockExcelBlob();
    vi.mocked(documentService.download).mockResolvedValue(fakeBlob);

    render(
      <ExcelViewer
        documentId="doc-excel-1"
        title="Bảng điểm lớp IT64.xlsx"
        fileExtension="xlsx"
      />
    );

    // Initial loading indicator
    expect(screen.getByText(/Đang tải và dựng cấu trúc bảng tính/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/Đang tải và dựng cấu trúc bảng tính/i)).not.toBeInTheDocument();
      expect(screen.getByText('Bảng điểm lớp IT64.xlsx')).toBeInTheDocument();
      expect(screen.getByText('Nguyễn Văn Hùng')).toBeInTheDocument();
      expect(screen.getByText('Trần Thị Mai')).toBeInTheDocument();
      expect(screen.getByText('6451071001')).toBeInTheDocument();
    });

    // Check Excel column header letters
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.getByText('D')).toBeInTheDocument();
  });

  it('allows switching between sheets using bottom tabs', async () => {
    const fakeBlob = createMockExcelBlob();
    vi.mocked(documentService.download).mockResolvedValue(fakeBlob);

    render(
      <ExcelViewer
        documentId="doc-excel-2"
        title="Tài liệu 2 sheet.xlsx"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Bảng điểm')).toBeInTheDocument();
      expect(screen.getByText('Danh sách môn')).toBeInTheDocument();
    });

    // Currently on Sheet 1
    expect(screen.getByText('Nguyễn Văn Hùng')).toBeInTheDocument();

    // Click on Sheet 2
    fireEvent.click(screen.getByText('Danh sách môn'));

    await waitFor(() => {
      expect(screen.getByText('Nhập môn CNTT')).toBeInTheDocument();
      expect(screen.queryByText('Nguyễn Văn Hùng')).not.toBeInTheDocument();
    });
  });

  it('filters and highlights matching cells when searching', async () => {
    const fakeBlob = createMockExcelBlob();
    vi.mocked(documentService.download).mockResolvedValue(fakeBlob);

    render(
      <ExcelViewer
        documentId="doc-excel-3"
        title="Tìm kiếm bảng tính.xlsx"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn Hùng')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Tìm trong bảng tính/i);
    fireEvent.change(searchInput, { target: { value: 'Trần Thị Mai' } });

    await waitFor(() => {
      expect(screen.getByText(/Tìm thấy 1 ô/i)).toBeInTheDocument();
    });
  });

  it('handles zoom in, zoom out, and reset controls', async () => {
    const fakeBlob = createMockExcelBlob();
    vi.mocked(documentService.download).mockResolvedValue(fakeBlob);

    render(
      <ExcelViewer
        documentId="doc-excel-4"
        title="Zoom test.xlsx"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    const zoomInBtn = screen.getByTitle('Phóng to');
    fireEvent.click(zoomInBtn);
    expect(screen.getByText('110%')).toBeInTheDocument();

    const zoomOutBtn = screen.getByTitle('Thu nhỏ');
    fireEvent.click(zoomOutBtn);
    fireEvent.click(zoomOutBtn);
    expect(screen.getByText('90%')).toBeInTheDocument();

    const resetBtn = screen.getByTitle('Khôi phục 100%');
    fireEvent.click(resetBtn);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('renders DRM blur lock and unlock banner when restricted', async () => {
    // 60 rows, freePagesLimit is 1 (approx 25 rows free)
    const fakeBlob = createLargeMockExcelBlob(60);
    vi.mocked(documentService.download).mockResolvedValue(fakeBlob);
    const onUnlockRequest = vi.fn();

    render(
      <ExcelViewer
        documentId="doc-excel-5"
        title="Tài liệu khóa bảo mật.xlsx"
        hasUnlocked={false}
        isBlurLocked={true}
        freePagesLimit={1}
        unlockPoints={20}
        onUnlockRequest={onUnlockRequest}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Đang xem trước 25 \/ 61 dòng miễn phí của trang tính/i)).toBeInTheDocument();
      expect(screen.getByText(/Mở khóa \(20 điểm\)/i)).toBeInTheDocument();
    });

    const unlockBtn = screen.getByText(/Mở khóa \(20 điểm\)/i);
    fireEvent.click(unlockBtn);
    expect(onUnlockRequest).toHaveBeenCalledTimes(1);
  });
});

