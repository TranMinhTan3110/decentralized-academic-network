import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminReportsPage } from '../../pages/admin/AdminReportsPage/AdminReportsPage';
import { documentService } from '../../services/documentService';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
    },
}));

const mockWriteText = vi.fn().mockResolvedValue(undefined);

describe('AdminReportsPage Component Unit Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        try {
            window.localStorage?.clear();
        } catch {}
        Object.defineProperty(navigator, 'clipboard', {
            value: {
                writeText: mockWriteText,
            },
            writable: true,
            configurable: true,
        });
    });

    it('renders breadcrumb, title, subtitle, and open report count badge', () => {
        render(
            <MemoryRouter>
                <AdminReportsPage />
            </MemoryRouter>
        );

        expect(screen.getByText('Admin / Báo cáo vi phạm')).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 1, name: 'Xử lý báo cáo vi phạm' })).toBeInTheDocument();
        expect(
            screen.getByText(/Ghi chú bài giảng, đề cương tự soạn: được chia sẻ/i)
        ).toBeInTheDocument();

        // 3 open cases badge
        expect(screen.getByText('3 vụ đang mở')).toBeInTheDocument();
    });

    it('renders initial 3 violation reports with reasons, documents, authors, and notes', () => {
        render(
            <MemoryRouter>
                <AdminReportsPage />
            </MemoryRouter>
        );

        // Titles
        expect(screen.getByText('Giáo trình Kinh tế vi mô (bản scan nguyên cuốn)')).toBeInTheDocument();
        expect(screen.getByText('Slide Bài giảng Vật lý Đại cương')).toBeInTheDocument();
        expect(screen.getByText('Đề thi Giữa kỳ Cấu trúc dữ liệu & Giải thuật')).toBeInTheDocument();

        // Reasons
        const copyrightBadges = screen.getAllByText('COPYRIGHT_INFRINGEMENT');
        expect(copyrightBadges).toHaveLength(2);
        expect(screen.getByText('POOR_QUALITY')).toBeInTheDocument();

        // Status "Đang mở"
        const openBadges = screen.getAllByText('Đang mở');
        expect(openBadges).toHaveLength(3);

        // Reporters & Authors
        expect(screen.getByText('NXB Giáo dục (đại diện)')).toBeInTheDocument();
        expect(screen.getByText('Lê Minh Quân')).toBeInTheDocument();
        expect(screen.getByText('TS. Lê Hữu Phước')).toBeInTheDocument();
        expect(screen.getByText('Trần Thị Bích')).toBeInTheDocument();
        expect(screen.getByText('sv_nguyenvan')).toBeInTheDocument();
        expect(screen.getByText('Võ Thanh Hà')).toBeInTheDocument();

        // Note quotes
        expect(
            screen.getByText(/Tài liệu là bản scan toàn bộ giáo trình thương mại có ISBN/i)
        ).toBeInTheDocument();
        expect(
            screen.getByText(/Nhiều trang slide trùng khớp với bài giảng của tôi/i)
        ).toBeInTheDocument();
        expect(
            screen.getByText(/File mờ, nhiều trang bị cắt, không đọc được phần đáp án/i)
        ).toBeInTheDocument();
    });

    it('opens document preview modal and closes it', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <AdminReportsPage />
            </MemoryRouter>
        );

        const viewButtons = screen.getAllByRole('button', { name: /xem tài liệu/i });
        expect(viewButtons).toHaveLength(3);

        await user.click(viewButtons[0]);

        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(within(dialog).getByText(/Xem trước tài liệu bị báo cáo/i)).toBeInTheDocument();
        expect(within(dialog).getByText('Lê Minh Quân')).toBeInTheDocument();
        expect(within(dialog).getByText('bafybeih4d1k77qwe5r0sz88m2cx')).toBeInTheDocument();

        // Close modal
        const closeBtns = within(dialog).getAllByRole('button', { name: /đóng/i });
        await user.click(closeBtns[0]);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('confirms violation and takedown via confirmation modal', async () => {
        const moderateSpy = vi.spyOn(documentService, 'moderateDocument').mockResolvedValue(undefined);
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <AdminReportsPage />
            </MemoryRouter>
        );

        const confirmButtons = screen.getAllByRole('button', { name: /xác nhận vi phạm & gỡ bỏ/i });
        await user.click(confirmButtons[0]);

        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(within(dialog).getByText('Xác nhận vi phạm & gỡ bỏ?')).toBeInTheDocument();
        expect(within(dialog).getByText(/sẽ bị gỡ \(REJECTED\) và tài khoản của/i)).toBeInTheDocument();

        // Confirm
        const submitBtn = within(dialog).getByRole('button', { name: /xác nhận & gỡ bỏ/i });
        await user.click(submitBtn);

        expect(moderateSpy).toHaveBeenCalledWith(
            'a0000000-0000-0000-0000-000000000001',
            expect.objectContaining({ status: 'REJECTED' })
        );
        expect(toast.success).toHaveBeenCalledWith(
            expect.stringContaining('Đã xác nhận vi phạm và gỡ bỏ tài liệu')
        );
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

        // Status badge updated
        expect(screen.getByText('Đã xác nhận & gỡ bỏ')).toBeInTheDocument();

        // Open badge decreased to 2
        expect(screen.getByText('2 vụ đang mở')).toBeInTheDocument();
    });

    it('dismisses a report and protects the document', async () => {
        const moderateSpy = vi.spyOn(documentService, 'moderateDocument').mockResolvedValue(undefined);
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <AdminReportsPage />
            </MemoryRouter>
        );

        const dismissButtons = screen.getAllByRole('button', { name: /bác bỏ báo cáo/i });
        await user.click(dismissButtons[1]); // Dismiss report 2

        expect(moderateSpy).toHaveBeenCalledWith(
            'a0000000-0000-0000-0000-000000000002',
            expect.objectContaining({ status: 'PUBLISHED' })
        );
        expect(toast.info).toHaveBeenCalledWith('Đã bác bỏ báo cáo, tài liệu được bảo vệ');

        // Status badge updated
        expect(screen.getByText('Đã bác bỏ')).toBeInTheDocument();

        // Open badge decreased to 2
        expect(screen.getByText('2 vụ đang mở')).toBeInTheDocument();
    });

    it('copies CID in preview modal and triggers clipboard writeText', async () => {
        render(
            <MemoryRouter>
                <AdminReportsPage />
            </MemoryRouter>
        );

        const viewButtons = screen.getAllByRole('button', { name: /xem tài liệu/i });
        fireEvent.click(viewButtons[0]);

        const copyBtn = screen.getByRole('button', { name: /sao chép toàn bộ cid/i });
        fireEvent.click(copyBtn);

        expect(mockWriteText).toHaveBeenCalledWith('bafybeih4d1k77qwe5r0sz88m2cx');
    });

    it('loads reports from the API with server-side pagination', async () => {
        vi.stubEnv('NODE_ENV', 'development');
        try {
            const reportsSpy = vi.spyOn(documentService, 'getAdminReports').mockResolvedValue({
                content: [
                    {
                        id: 'api-report-1',
                        documentId: 'api-doc-1',
                        documentTitle: 'Tài liệu bị báo cáo từ API',
                        reporterName: 'Người báo cáo API',
                        authorName: 'Tác giả API',
                        reason: 'SPAM',
                        description: 'Nội dung quảng cáo rác',
                        status: 'PENDING',
                        createdAt: '2026-11-20T00:00:00Z',
                    },
                ],
                pageNumber: 0,
                pageSize: 10,
                totalElements: 12,
                totalPages: 2,
                last: false,
            });

            render(
                <MemoryRouter>
                    <AdminReportsPage />
                </MemoryRouter>
            );

            await waitFor(() => {
                expect(reportsSpy).toHaveBeenCalledWith(0, 10);
            });
            expect(await screen.findByText('Tài liệu bị báo cáo từ API')).toBeInTheDocument();
            expect(screen.getByText('12 vụ đang mở')).toBeInTheDocument();

            const user = userEvent.setup();
            await user.click(screen.getByRole('button', { name: 'Trang sau' }));
            await waitFor(() => {
                expect(reportsSpy).toHaveBeenCalledWith(1, 10);
            });
        } finally {
            vi.unstubAllEnvs();
        }
    });
});
