import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminHeader } from '../../components/admin/layout/AdminHeader/AdminHeader';

describe('AdminHeader Component', () => {
    it('renders search input and triggers onSearchChange', async () => {
        const handleSearchChange = vi.fn();
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminHeader searchQuery="" onSearchChange={handleSearchChange} />
            </MemoryRouter>
        );

        const searchInput = screen.getByPlaceholderText(/Tìm tài liệu, CID, email, mã hash giao dịch.../i);
        expect(searchInput).toBeInTheDocument();

        await user.type(searchInput, 'hash123');
        expect(handleSearchChange).toHaveBeenCalled();
    });

    it('triggers onSearchSubmit when form is submitted', async () => {
        const handleSearchSubmit = vi.fn();
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminHeader searchQuery="test query" onSearchSubmit={handleSearchSubmit} />
            </MemoryRouter>
        );

        const searchInput = screen.getByPlaceholderText(/Tìm tài liệu, CID, email, mã hash giao dịch.../i);
        await user.type(searchInput, '{enter}');

        expect(handleSearchSubmit).toHaveBeenCalledTimes(1);
    });

    it('renders "Về User Hub" link leading to root "/"', () => {
        render(
            <MemoryRouter>
                <AdminHeader />
            </MemoryRouter>
        );

        const backLink = screen.getByRole('link', { name: /về user hub/i });
        expect(backLink).toBeInTheDocument();
        expect(backLink).toHaveAttribute('href', '/');
    });

    it('displays IPFS Node status chip and toggle menu button', async () => {
        const handleToggleMenu = vi.fn();
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <AdminHeader isNodeConnected={true} onToggleMenu={handleToggleMenu} />
            </MemoryRouter>
        );

        expect(screen.getByText(/IPFS Node: Connected/i)).toBeInTheDocument();

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
