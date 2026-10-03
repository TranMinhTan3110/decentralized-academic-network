import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar } from '../../components/ui/Avatar/Avatar';

describe('Avatar Component', () => {
  it('renders initial letter when name is provided', () => {
    render(<Avatar name="Minh Tan" />);
    expect(screen.getByText('M')).toBeInTheDocument();
  });

  it('renders initial letter from user profile object', () => {
    render(<Avatar user={{ name: 'KTPM' }} />);
    expect(screen.getByText('K')).toBeInTheDocument();
  });

  it('renders custom avatar text if avatar is passed', () => {
    render(<Avatar avatar="CS" name="Computer Science" />);
    expect(screen.getByText('CS')).toBeInTheDocument();
  });
});
