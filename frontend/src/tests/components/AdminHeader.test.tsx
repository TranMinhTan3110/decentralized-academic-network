import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminHeader } from '../../components/admin/layout/AdminHeader/AdminHeader';

describe('AdminHeader Component', () => {
    it('does not render search input, "Về User Hub" link, or IPFS node chip', () => {
        render(
            <MemoryRouter>
                <AdminHeader />
            </MemoryRouter>
        );

        expect(screen.queryByRole('search')).not.toBeInTheDocument();
        expect(screen.queryByPlaceholderText(/Tìm tài liệu/i)).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /về user hub/i })).not.toBeInTheDocument();
        expect(screen.queryByText(/IPFS Node:/i)).not.toBeInTheDocument();
    });

    it('displays mobile menu toggle button and triggers onToggleMenu', async () => {
        const handleToggleMenu = vi.fn();
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminHeader onToggleMenu={handleToggleMenu} />
            </MemoryRouter>
        );

        const toggleBtn = screen.getByRole('button', { name: /mở menu quản trị/i });
        await user.click(toggleBtn);
        expect(handleToggleMenu).toHaveBeenCalledTimes(1);
    });

    it('renders admin profile information and triggers notifications click', async () => {
        const handleNotifications = vi.fn();
        const handleProfile = vi.fn();
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminHeader
                    adminUser={{ name: 'Trần Minh Tân', email: 'tan@example.com' }}
                    adminRole="Council Auditor"
                    onNotificationsClick={handleNotifications}
                    onProfileClick={handleProfile}
                    hasUnreadNotifications={true}
                />
            </MemoryRouter>
        );

        expect(screen.getByText('Trần Minh Tân')).toBeInTheDocument();
        expect(screen.getByText('Council Auditor')).toBeInTheDocument();

        const bellButton = screen.getByRole('button', { name: /thông báo khẩn cấp/i });
        await user.click(bellButton);
        expect(handleNotifications).toHaveBeenCalledTimes(1);

        const profileButton = screen.getByRole('button', { name: /hồ sơ admin trần minh tân/i });
        await user.click(profileButton);
        expect(handleProfile).toHaveBeenCalledTimes(1);
    });
});
