import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DocxViewer, mergeConsecutiveBorderedParagraphs, hasSideBorder } from '../../components/ui/DocxViewer';
import * as docxPreview from 'docx-preview';
import { documentService } from '../../services/documentService';

vi.mock('docx-preview', () => ({
  renderAsync: vi.fn().mockImplementation(async (_data, container) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'docx-wrapper';
    const page1 = document.createElement('section');
    page1.className = 'docx';
    const page2 = document.createElement('section');
    page2.className = 'docx';
    wrapper.appendChild(page1);
    wrapper.appendChild(page2);
    container.appendChild(wrapper);
    return Promise.resolve();
  }),
}));

vi.mock('../../services/documentService', () => ({
  documentService: {
    download: vi.fn(),
  },
}));

function createMockBlob(): Blob {
  const buffer = new ArrayBuffer(8);
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  blob.arrayBuffer = vi.fn().mockResolvedValue(buffer);
  return blob;
}

describe('DocxViewer Component Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially and then calls renderAsync', async () => {
    const fakeBlob = createMockBlob();
    vi.mocked(documentService.download).mockResolvedValue(fakeBlob);

    render(
      <DocxViewer
        documentId="doc-123"
        title="Báo cáo bài tập lớn.docx"
      />
    );

    expect(screen.getByText(/Đang nạp và dàn trang tài liệu Word/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(docxPreview.renderAsync).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.queryByText(/Đang nạp và dàn trang tài liệu Word/i)).not.toBeInTheDocument();
      expect(screen.getByText('2 trang')).toBeInTheDocument();
    });
  });

  it('handles zoom in and zoom out controls', async () => {
    const fakeBlob = createMockBlob();
    vi.mocked(documentService.download).mockResolvedValue(fakeBlob);

    render(
      <DocxViewer
        documentId="doc-456"
        title="Báo cáo"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    const zoomInBtn = screen.getByRole('button', { name: /Phóng to/i });
    const zoomOutBtn = screen.getByRole('button', { name: /Thu nhỏ/i });

    fireEvent.click(zoomInBtn);
    expect(screen.getByText('110%')).toBeInTheDocument();

    fireEvent.click(zoomOutBtn);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('renders DRM unlock banner when document is locked and exceeds freePagesLimit', async () => {
    const fakeBlob = createMockBlob();
    vi.mocked(documentService.download).mockResolvedValue(fakeBlob);
    const onUnlockRequest = vi.fn();

    render(
      <DocxViewer
        documentId="doc-drm"
        title="Báo cáo có DRM"
        hasUnlocked={false}
        isBlurLocked={true}
        freePagesLimit={1}
        unlockPoints={15}
        onUnlockRequest={onUnlockRequest}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Đọc thử 1 \/ 2 trang/i)).toBeInTheDocument();
    });

    const unlockBtn = screen.getByRole('button', { name: /Mở khóa \(15 điểm\)/i });
    expect(unlockBtn).toBeInTheDocument();

    fireEvent.click(unlockBtn);
    expect(onUnlockRequest).toHaveBeenCalledTimes(1);
  });

  it('shows friendly error state when fetching docx fails', async () => {
    vi.mocked(documentService.download).mockRejectedValue(new Error('Network error'));

    render(
      <DocxViewer
        documentId="invalid-doc"
        title="Tài liệu hỏng"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Không thể hiển thị tài liệu Word')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Thử tải lại/i })).toBeInTheDocument();
    });
  });

  it('merges consecutive bordered paragraphs into a single unified box border without divider lines', () => {
    const container = document.createElement('div');
    const p1 = document.createElement('p');
    p1.setAttribute('style', 'border-top: 3pt solid black; border-bottom: 3pt solid black; border-left: 3pt solid black; border-right: 3pt solid black;');

    const p2 = document.createElement('p');
    p2.setAttribute('style', 'border-top: 3pt solid black; border-bottom: 3pt solid black; border-left: 3pt solid black; border-right: 3pt solid black;');

    const p3 = document.createElement('p');
    p3.setAttribute('style', 'border-top: 3pt solid black; border-bottom: 3pt solid black; border-left: 3pt solid black; border-right: 3pt solid black;');

    container.appendChild(p1);
    container.appendChild(p2);
    container.appendChild(p3);

    mergeConsecutiveBorderedParagraphs(container);

    // Đoạn đầu: có top, không có bottom
    expect(hasSideBorder(p1, 'top')).toBe(true);
    expect(hasSideBorder(p1, 'bottom')).toBe(false);

    // Đoạn giữa: không có top, không có bottom
    expect(hasSideBorder(p2, 'top')).toBe(false);
    expect(hasSideBorder(p2, 'bottom')).toBe(false);

    // Đoạn cuối: không có top, có bottom
    expect(hasSideBorder(p3, 'top')).toBe(false);
    expect(hasSideBorder(p3, 'bottom')).toBe(true);
  });
});
