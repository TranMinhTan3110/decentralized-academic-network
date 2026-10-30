import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminDocumentsPage } from '../../pages/admin/AdminDocumentsPage/AdminDocumentsPage';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
    },
}));

const mockWriteText = vi.fn().mockResolvedValue(undefined);

describe('AdminDocumentsPage Component Unit Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.defineProperty(navigator, 'clipboard', {
            value: {
                writeText: mockWriteText,
            },
            writable: true,
            configurable: true,
        });
    });

    it('renders breadcrumb, title, subtitle, and tabs with counts', () => {
        render(
            <MemoryRouter>
                <AdminDocumentsPage />
            </MemoryRouter>
        );

        expect(screen.getByText('Admin / Tài liệu')).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 1, name: 'Quản lý & Kiểm duyệt tài liệu' })).toBeInTheDocument();
        expect(
            screen.getByText('Mô hình hậu kiểm: đăng ngay, chỉ xử lý khi bị gắn cờ hoặc có báo cáo')
        ).toBeInTheDocument();

        // Tabs
        expect(screen.getByRole('button', { name: /tất cả tài liệu/i })).toBeInTheDocument();
        const reviewTab = screen.getByRole('button', { name: /cần kiểm duyệt/i });
        expect(reviewTab).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /đã công khai/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /đã gỡ bỏ/i })).toBeInTheDocument();

        // Check badge for review tab (4 docs needing review initially)
        expect(within(reviewTab).getByText('4')).toBeInTheDocument();
        expect(screen.getByText('8 tài liệu')).toBeInTheDocument();
    });

    it('renders initial list of 8 documents with titles, authors, and statuses', () => {
        render(
            <MemoryRouter>
                <AdminDocumentsPage />
            </MemoryRouter>
        );

        expect(screen.getByText('Đề cương Ôn thi Giải tích 3 ĐHBK')).toBeInTheDocument();
        expect(screen.getByText('Slide Bài giảng Vật lý Đại cương')).toBeInTheDocument();
        expect(screen.getByText('Giáo trình Kinh tế vi mô (bản scan nguyên cuốn)')).toBeInTheDocument();
        expect(screen.getByText('Đề thi Giữa kỳ Cấu trúc dữ liệu & Giải thuật')).toBeInTheDocument();
        expect(screen.getByText('Ghi chú bài giảng Lập trình mạng INT1332')).toBeInTheDocument();
        expect(screen.getByText('Bài tập Xác suất thống kê có lời giải')).toBeInTheDocument();
        expect(screen.getByText('Tổng hợp lý thuyết Mạch điện tử')).toBeInTheDocument();
        expect(screen.getByText('Bản scan sách Giải tích Thomas (NXB có ISBN)')).toBeInTheDocument();

        // Check author initials avatars
        expect(screen.getByText('VA')).toBeInTheDocument();
        expect(screen.getByText('TB')).toBeInTheDocument();
        expect(screen.getByText('MQ')).toBeInTheDocument();
        expect(screen.getByText('TH')).toBeInTheDocument();
    });

    it('filters documents when switching to "Cần kiểm duyệt" tab', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <AdminDocumentsPage />
            </MemoryRouter>
        );

        const reviewTab = screen.getByRole('button', { name: /cần kiểm duyệt/i });
        await user.click(reviewTab);

        expect(screen.getByText('4 tài liệu')).toBeInTheDocument();
        expect(screen.getByText('Đề cương Ôn thi Giải tích 3 ĐHBK')).toBeInTheDocument();
        expect(screen.getByText('Slide Bài giảng Vật lý Đại cương')).toBeInTheDocument();
        expect(screen.getByText('Giáo trình Kinh tế vi mô (bản scan nguyên cuốn)')).toBeInTheDocument();
        expect(screen.getByText('Đề thi Giữa kỳ Cấu trúc dữ liệu & Giải thuật')).toBeInTheDocument();

        // Published document should not be present
        expect(screen.queryByText('Ghi chú bài giảng Lập trình mạng INT1332')).not.toBeInTheDocument();
    });

    it('filters documents when switching to "Đã công khai" tab', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <AdminDocumentsPage />
            </MemoryRouter>
        );

        const publishedTab = screen.getByRole('button', { name: /đã công khai/i });
        await user.click(publishedTab);

        expect(screen.getByText('3 tài liệu')).toBeInTheDocument();
        expect(screen.getByText('Ghi chú bài giảng Lập trình mạng INT1332')).toBeInTheDocument();
        expect(screen.getByText('Bài tập Xác suất thống kê có lời giải')).toBeInTheDocument();
        expect(screen.getByText('Tổng hợp lý thuyết Mạch điện tử')).toBeInTheDocument();
        expect(screen.queryByText('Đề cương Ôn thi Giải tích 3 ĐHBK')).not.toBeInTheDocument();
    });

    it('filters documents when switching to "Đã gỡ bỏ" tab', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <AdminDocumentsPage />
            </MemoryRouter>
        );

        const rejectedTab = screen.getByRole('button', { name: /đã gỡ bỏ/i });
        await user.click(rejectedTab);

        expect(screen.getByText('1 tài liệu')).toBeInTheDocument();
        expect(screen.getByText('Bản scan sách Giải tích Thomas (NXB có ISBN)')).toBeInTheDocument();
        expect(screen.queryByText('Đề cương Ôn thi Giải tích 3 ĐHBK')).not.toBeInTheDocument();
    });

    it('filters documents using search query input', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <AdminDocumentsPage />
            </MemoryRouter>
        );

        const searchInput = screen.getByRole('textbox', { name: /tìm theo tiêu đề hoặc cid/i });
        await user.type(searchInput, 'kinh tế vi mô');

        expect(screen.getByText('1 tài liệu')).toBeInTheDocument();
        expect(screen.getByText('Giáo trình Kinh tế vi mô (bản scan nguyên cuốn)')).toBeInTheDocument();
        expect(screen.queryByText('Đề cương Ôn thi Giải tích 3 ĐHBK')).not.toBeInTheDocument();
    });

    it('copies CID to clipboard and shows toast notification', async () => {
        const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText');

        render(
            <MemoryRouter>
                <AdminDocumentsPage />
            </MemoryRouter>
        );

        const copyBtn = screen.getByRole('button', {
            name: /sao chép cid của đề cương ôn thi giải tích 3 đhbk/i,
        });
        fireEvent.click(copyBtn);

        expect(writeTextSpy).toHaveBeenCalledWith('bafybeic2h7g5y391a4z6p9lq2v7n8m');
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Đã sao chép mã CID vào clipboard!');
        });
    });

    it('approves a document directly from table and shows success toast', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <AdminDocumentsPage />
            </MemoryRouter>
        );

        // Find "Phê duyệt" buttons - first one corresponds to 'Đề cương Ôn thi Giải tích 3 ĐHBK'
        const approveButtons = screen.getAllByRole('button', { name: 'Phê duyệt' });
        expect(approveButtons.length).toBeGreaterThan(0);

        await user.click(approveButtons[0]);

        expect(toast.success).toHaveBeenCalledWith(
            expect.stringContaining('Đã phê duyệt tài liệu: Đề cương Ôn thi Giải tích 3 ĐHBK')
        );

        // Badge counter for pending review should now decrease from 4 to 3
        const reviewTab = screen.getByRole('button', { name: /cần kiểm duyệt/i });
        expect(within(reviewTab).getByText('3')).toBeInTheDocument();
    });

    it('opens preview modal, displays document details, and allows approving from inside the modal', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <AdminDocumentsPage />
            </MemoryRouter>
        );

        const previewBtn = screen.getByRole('button', {
            name: /xem trước tài liệu đề cương ôn thi giải tích 3 đhbk/i,
        });
        await user.click(previewBtn);

        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(within(dialog).getByText('Xem trước tài liệu · 14.2 MB')).toBeInTheDocument();
        expect(within(dialog).getByText('Nguyễn Văn An')).toBeInTheDocument();
        expect(within(dialog).getByText('Toán ứng dụng')).toBeInTheDocument();
        expect(within(dialog).getByText('ĐH Bách Khoa Hà Nội')).toBeInTheDocument();
        expect(within(dialog).getByText('bafybeic2h7g5y391a4z6p9lq2v7n8m')).toBeInTheDocument();

        // Click "Phê duyệt tài liệu" inside modal
        const modalApproveBtn = within(dialog).getByRole('button', { name: /phê duyệt tài liệu/i });
        await user.click(modalApproveBtn);

        expect(toast.success).toHaveBeenCalledWith(
            expect.stringContaining('Đã phê duyệt tài liệu: Đề cương Ôn thi Giải tích 3 ĐHBK')
        );

        // Close modal
        const closeBtn = within(dialog).getByRole('button', { name: /đóng/i });
        await user.click(closeBtn);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('opens rejection modal, confirms removal, and updates document status', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <AdminDocumentsPage />
            </MemoryRouter>
        );

        // Click reject trash button for 'Đề cương Ôn thi Giải tích 3 ĐHBK'
        const rejectBtn = screen.getByRole('button', {
            name: /gỡ bỏ tài liệu đề cương ôn thi giải tích 3 đhbk/i,
        });
        await user.click(rejectBtn);

        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(within(dialog).getByText('Gỡ bỏ khỏi mạng lưới?')).toBeInTheDocument();
        expect(within(dialog).getByText(/sẽ chuyển sang trạng thái/i)).toBeInTheDocument();

        // Confirm rejection
        const confirmBtn = within(dialog).getByRole('button', { name: /xác nhận gỡ bỏ/i });
        await user.click(confirmBtn);

        expect(toast.success).toHaveBeenCalledWith(
            expect.stringContaining('Đã gỡ bỏ tài liệu khỏi mạng lưới: Đề cương Ôn thi Giải tích 3 ĐHBK')
        );
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

        // Switch to "Đã gỡ bỏ" tab - now there should be 2 rejected documents
        const rejectedTab = screen.getByRole('button', { name: /đã gỡ bỏ/i });
        await user.click(rejectedTab);

        expect(screen.getByText('2 tài liệu')).toBeInTheDocument();
        expect(screen.getByText('Đề cương Ôn thi Giải tích 3 ĐHBK')).toBeInTheDocument();
        expect(screen.getByText('Bản scan sách Giải tích Thomas (NXB có ISBN)')).toBeInTheDocument();
    });
});
