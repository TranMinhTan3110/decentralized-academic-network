import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Swal from 'sweetalert2';
import { toast } from 'sonner';
import { AdminDocumentsPage } from '../../pages/admin/AdminDocumentsPage/AdminDocumentsPage';

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

    it('renders breadcrumb, title, subtitle, search input, and total count', () => {
        render(
            <MemoryRouter>
                <AdminDocumentsPage />
            </MemoryRouter>
        );

        expect(screen.getByText('Admin / Quản lý bài đăng')).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 1, name: 'Quản lý bài đăng' })).toBeInTheDocument();
        expect(
            screen.getByText('Danh sách bài đăng và tương tác học thuật trên mạng xã hội chia sẻ phi tập trung')
        ).toBeInTheDocument();

        expect(
            screen.getByRole('textbox', { name: /tìm theo tiêu đề bài đăng, tác giả hoặc cid/i })
        ).toBeInTheDocument();
        expect(screen.getByText('Hiển thị 8 / 8 bài đăng')).toBeInTheDocument();
    });

    it('renders initial list of 8 posts with titles, authors, and interaction metrics', () => {
        render(
            <MemoryRouter>
                <AdminDocumentsPage />
            </MemoryRouter>
        );

        // Check titles
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

        // Check interaction column headers
        expect(screen.getByRole('columnheader', { name: 'Tên bài đăng' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Tác giả' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Lượt đọc' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Thích' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Bình luận' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Chia sẻ' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Thao tác' })).toBeInTheDocument();
    });

    it('filters posts using search query input by title, author, or CID', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <AdminDocumentsPage />
            </MemoryRouter>
        );

        const searchInput = screen.getByRole('textbox', {
            name: /tìm theo tiêu đề bài đăng, tác giả hoặc cid/i,
        });

        // Search by title
        await user.type(searchInput, 'kinh tế vi mô');
        expect(screen.getByText('Hiển thị 1 / 8 bài đăng')).toBeInTheDocument();
        expect(screen.getByText('Giáo trình Kinh tế vi mô (bản scan nguyên cuốn)')).toBeInTheDocument();
        expect(screen.queryByText('Đề cương Ôn thi Giải tích 3 ĐHBK')).not.toBeInTheDocument();

        // Clear and search by author
        await user.clear(searchInput);
        await user.type(searchInput, 'Phạm Gia Huy');
        expect(screen.getByText('Hiển thị 1 / 8 bài đăng')).toBeInTheDocument();
        expect(screen.getByText('Ghi chú bài giảng Lập trình mạng INT1332')).toBeInTheDocument();

        // Search with non-matching term
        await user.clear(searchInput);
        await user.type(searchInput, 'KhongCoKetQuaNaoHet123');
        expect(screen.getByText('Hiển thị 0 / 8 bài đăng')).toBeInTheDocument();
        expect(screen.getByText('Không tìm thấy bài đăng nào phù hợp.')).toBeInTheDocument();
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

    it('opens post details preview modal, displays post info and metrics, and closes modal', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <AdminDocumentsPage />
            </MemoryRouter>
        );

        const previewBtn = screen.getByRole('button', {
            name: /xem chi tiết bài đăng đề cương ôn thi giải tích 3 đhbk/i,
        });
        await user.click(previewBtn);

        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(within(dialog).getByText('Chi tiết bài đăng')).toBeInTheDocument();
        expect(within(dialog).getByText(/đề cương ôn thi giải tích 3 đhbk · 14.2 mb/i)).toBeInTheDocument();
        expect(within(dialog).getByText('Nguyễn Văn An')).toBeInTheDocument();
        expect(within(dialog).getByText('Toán ứng dụng')).toBeInTheDocument();
        expect(within(dialog).getByText('ĐH Bách Khoa Hà Nội')).toBeInTheDocument();
        expect(within(dialog).getByText('bafybeic2h7g5y391a4z6p9lq2v7n8m')).toBeInTheDocument();

        // Check social interaction metrics inside modal
        expect(within(dialog).getByText('1,240')).toBeInTheDocument(); // reads
        expect(within(dialog).getByText('86')).toBeInTheDocument();    // likes
        expect(within(dialog).getByText('18')).toBeInTheDocument();    // comments
        expect(within(dialog).getByText('24')).toBeInTheDocument();    // shares

        // Close modal via bottom "Đóng" button
        const closeBtn = within(dialog).getByRole('button', { name: 'Đóng' });
        await user.click(closeBtn);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('deletes a post from table row after SweetAlert2 confirmation', async () => {
        const swalSpy = vi.spyOn(Swal, 'fire').mockResolvedValue({ isConfirmed: true } as any);
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminDocumentsPage />
            </MemoryRouter>
        );

        // Click delete button for 'Đề cương Ôn thi Giải tích 3 ĐHBK'
        const deleteBtn = screen.getByRole('button', {
            name: /xóa bài đăng đề cương ôn thi giải tích 3 đhbk/i,
        });
        await user.click(deleteBtn);

        expect(swalSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Xóa bài đăng?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ba1a1a',
                confirmButtonText: 'Xác nhận xóa',
            })
        );

        // Document should be removed from the list
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith(
                expect.stringContaining('Đã xóa bài đăng: Đề cương Ôn thi Giải tích 3 ĐHBK')
            );
        });
        expect(screen.queryByText('Đề cương Ôn thi Giải tích 3 ĐHBK')).not.toBeInTheDocument();
        expect(screen.getByText('Hiển thị 7 / 7 bài đăng')).toBeInTheDocument();
    });

    it('does not delete a post when SweetAlert2 is cancelled', async () => {
        vi.spyOn(Swal, 'fire').mockResolvedValue({ isConfirmed: false } as any);
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminDocumentsPage />
            </MemoryRouter>
        );

        const deleteBtn = screen.getByRole('button', {
            name: /xóa bài đăng đề cương ôn thi giải tích 3 đhbk/i,
        });
        await user.click(deleteBtn);

        expect(screen.getByText('Đề cương Ôn thi Giải tích 3 ĐHBK')).toBeInTheDocument();
        expect(screen.getByText('Hiển thị 8 / 8 bài đăng')).toBeInTheDocument();
        expect(toast.success).not.toHaveBeenCalled();
    });

    it('deletes a post from inside post details modal after SweetAlert2 confirmation', async () => {
        vi.spyOn(Swal, 'fire').mockResolvedValue({ isConfirmed: true } as any);
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminDocumentsPage />
            </MemoryRouter>
        );

        // Open modal
        const previewBtn = screen.getByRole('button', {
            name: /xem chi tiết bài đăng đề cương ôn thi giải tích 3 đhbk/i,
        });
        await user.click(previewBtn);

        const dialog = screen.getByRole('dialog');
        const modalDeleteBtn = within(dialog).getByRole('button', { name: /xóa bài đăng/i });
        await user.click(modalDeleteBtn);

        // Modal should close and doc should be removed
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith(
                expect.stringContaining('Đã xóa bài đăng: Đề cương Ôn thi Giải tích 3 ĐHBK')
            );
        });
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(screen.queryByText('Đề cương Ôn thi Giải tích 3 ĐHBK')).not.toBeInTheDocument();
        expect(screen.getByText('Hiển thị 7 / 7 bài đăng')).toBeInTheDocument();
    });
});
