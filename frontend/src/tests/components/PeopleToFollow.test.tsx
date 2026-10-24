import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PeopleToFollow } from '../../components/PeopleToFollow';

describe('PeopleToFollow Component Unit Tests', () => {
  it('renders suggested users list and allows toggling follow state', () => {
    render(<PeopleToFollow />);

    expect(screen.getByText('Gợi ý theo dõi')).toBeInTheDocument();
    expect(screen.getByText('PGS. TS Lê Hoài Nam')).toBeInTheDocument();
    expect(screen.getByText('ThS. Nguyễn Thị Mỹ Linh')).toBeInTheDocument();

    const followButtons = screen.getAllByRole('button', { name: /Theo dõi/i });
    expect(followButtons.length).toBeGreaterThan(0);

    // Follow user
    fireEvent.click(followButtons[0]);
    expect(screen.getByRole('button', { name: /Đang theo dõi/i })).toBeInTheDocument();

    // Unfollow
    const unfollowButton = screen.getByRole('button', { name: /Đang theo dõi/i });
    fireEvent.click(unfollowButton);
    expect(screen.queryByRole('button', { name: /Đang theo dõi/i })).not.toBeInTheDocument();
  });
});
