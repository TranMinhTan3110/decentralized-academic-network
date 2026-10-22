import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminTaxonomyPage } from '../../pages/admin/AdminTaxonomyPage/AdminTaxonomyPage';

describe('AdminTaxonomyPage Component', () => {
    it('renders page header, tabs, and initial university table rows', () => {
        render(
            <MemoryRouter>
                <AdminTaxonomyPage />
            </MemoryRouter>
        );

        // Header and breadcrumb
        expect(screen.getByText('Admin / Danh mục học thuật')).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 1, name: /Quản lý danh mục học thuật/i })).toBeInTheDocument();
        expect(screen.getByText('Trường đại học → Khoa / Viện → Môn học')).toBeInTheDocument();

        // Add button exists and does not use gradient
        const addBtn = screen.getByRole('button', { name: /Thêm trường mới/i });
        expect(addBtn).toBeInTheDocument();
        expect(addBtn.className).not.toContain('bg-gradient');

        // Navigation tabs
        expect(screen.getByRole('button', { name: /Trường Đại học/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Khoa \/ Viện/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Môn học/i })).toBeInTheDocument();

        // Table rows from screenshot
        expect(screen.getByText('HUST')).toBeInTheDocument();
        expect(screen.getByText('ĐH Bách Khoa Hà Nội')).toBeInTheDocument();
        expect(screen.getByText('NEU')).toBeInTheDocument();
        expect(screen.getByText('FTU')).toBeInTheDocument();
        expect(screen.getByText('UEH')).toBeInTheDocument();
        expect(screen.getByText('PTIT')).toBeInTheDocument();
    });

    it('opens school modal when clicking "+ Thêm trường mới"', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminTaxonomyPage />
            </MemoryRouter>
        );

        const addBtn = screen.getByRole('button', { name: /Thêm trường mới/i });
        await user.click(addBtn);

        // Modal should appear
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2, name: /Thêm trường đại học mới/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/Mã trường/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Tên trường đại học/i)).toBeInTheDocument();
    });

    it('validates required fields and adds new school to table upon submit', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminTaxonomyPage />
            </MemoryRouter>
        );

        // Open modal
        await user.click(screen.getByRole('button', { name: /Thêm trường mới/i }));

        const modal = screen.getByRole('dialog');

        // Attempt submit without filling
        const submitBtn = within(modal).getByRole('button', { name: /^Thêm trường$/i });
        await user.click(submitBtn);

        expect(within(modal).getByText(/Vui lòng nhập mã trường/i)).toBeInTheDocument();

        // Fill form
        const codeInput = within(modal).getByLabelText(/Mã trường/i);
        const nameInput = within(modal).getByLabelText(/Tên trường đại học/i);

        await user.type(codeInput, 'HCMUT');
        await user.type(nameInput, 'Đại học Bách Khoa TP.HCM');

        // Submit form
        await user.click(submitBtn);

        // Modal closes and new school appears in table
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(screen.getByText('HCMUT')).toBeInTheDocument();
        expect(screen.getByText('Đại học Bách Khoa TP.HCM')).toBeInTheDocument();
        expect(screen.getByText(/Đã thêm trường HCMUT vào danh mục học thuật!/i)).toBeInTheDocument();
    });

    it('supports adding a new faculty in Khoa / Viện tab', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminTaxonomyPage />
            </MemoryRouter>
        );

        // Switch to Khoa / Viện
        const facultiesTab = screen.getByRole('button', { name: /Khoa \/ Viện/i });
        await user.click(facultiesTab);

        // Action button updates to "Thêm Khoa mới"
        const addFacultyBtn = screen.getByRole('button', { name: /Thêm Khoa mới/i });
        expect(addFacultyBtn).toBeInTheDocument();
        expect(addFacultyBtn.className).not.toContain('bg-gradient');

        // Initial faculties from screenshot
        expect(screen.getByText('CNTT')).toBeInTheDocument();
        expect(screen.getByText('Công nghệ thông tin')).toBeInTheDocument();
        expect(screen.getByText('42 môn')).toBeInTheDocument();

        // Open FacultyModal
        await user.click(addFacultyBtn);
        const modal = screen.getByRole('dialog');
        expect(within(modal).getByRole('heading', { level: 2, name: /Thêm Khoa \/ Viện mới/i })).toBeInTheDocument();

        // Fill modal
        await user.type(within(modal).getByLabelText(/Mã Khoa \/ Viện/i), 'SAMI');
        await user.type(within(modal).getByLabelText(/Tên Khoa \/ Viện/i), 'Viện Toán ứng dụng & Tin học');
        const submitBtn = within(modal).getByRole('button', { name: /Tạo Khoa mới/i });
        await user.click(submitBtn);

        // New faculty appears
        expect(screen.getByText('SAMI')).toBeInTheDocument();
        expect(screen.getByText('Viện Toán ứng dụng & Tin học')).toBeInTheDocument();
    });

    it('supports adding a new subject in Môn học tab', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminTaxonomyPage />
            </MemoryRouter>
        );

        // Switch to Môn học tab
        const subjectsTab = screen.getByRole('button', { name: /Môn học/i });
        await user.click(subjectsTab);

        // Action button updates to "Thêm môn học mới"
        const addSubjectBtn = screen.getByRole('button', { name: /Thêm môn học mới/i });
        expect(addSubjectBtn).toBeInTheDocument();
        expect(addSubjectBtn.className).not.toContain('bg-gradient');

        // Initial subjects from screenshot
        expect(screen.getByText('INT1332')).toBeInTheDocument();
        expect(screen.getByText('Lập trình mạng')).toBeInTheDocument();
        expect(screen.getByText('INT1306')).toBeInTheDocument();
        expect(screen.getByText('Cấu trúc dữ liệu và giải thuật')).toBeInTheDocument();

        // Open SubjectModal
        await user.click(addSubjectBtn);
        const modal = screen.getByRole('dialog');
        expect(within(modal).getByRole('heading', { level: 2, name: /Thêm môn học mới/i })).toBeInTheDocument();

        // Fill modal
        await user.type(within(modal).getByLabelText(/Mã môn học/i), 'INT2020');
        await user.type(within(modal).getByLabelText(/Tên môn học/i), 'Trí tuệ nhân tạo');
        const submitBtn = within(modal).getByRole('button', { name: /Tạo môn học mới/i });
        await user.click(submitBtn);

        // New subject appears
        expect(screen.getByText('INT2020')).toBeInTheDocument();
        expect(screen.getByText('Trí tuệ nhân tạo')).toBeInTheDocument();
    });

    it('filters schools when typing in search input', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminTaxonomyPage />
            </MemoryRouter>
        );

        const searchInput = screen.getByPlaceholderText(/Tìm mã trường, tên trường, tỉnh thành/i);
        await user.type(searchInput, 'Ngoại thương');

        expect(screen.getByText('ĐH Ngoại thương')).toBeInTheDocument();
        expect(screen.queryByText('ĐH Bách Khoa Hà Nội')).not.toBeInTheDocument();
    });

    it('does not display status, website, or type in table or school modal', async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminTaxonomyPage />
            </MemoryRouter>
        );

        // Status column and subtitles should not exist
        expect(screen.queryByText(/^Trạng thái$/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Hoạt động/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Công lập/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Website/i)).not.toBeInTheDocument();

        // Open modal and check no status, website or type fields
        await user.click(screen.getByRole('button', { name: /Thêm trường mới/i }));
        const modal = screen.getByRole('dialog');
        expect(within(modal).queryByLabelText(/Loại hình cơ sở/i)).not.toBeInTheDocument();
        expect(within(modal).queryByLabelText(/Website/i)).not.toBeInTheDocument();
        expect(within(modal).queryByLabelText(/Trạng thái/i)).not.toBeInTheDocument();
    });
});
