import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input, SearchInput } from '../../components/ui/Input/Input';

describe('Input Component', () => {
  it('renders input with label and hint correctly', () => {
    render(
      <Input
        label="Email address"
        hint="We will never share your email."
        placeholder="enter email"
      />
    );

    expect(screen.getByText('Email address')).toBeInTheDocument();
    expect(screen.getByText('We will never share your email.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('enter email')).toBeInTheDocument();
  });

  it('renders error message when error prop is provided', () => {
    render(<Input label="Password" error="Password is required" />);

    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });
});

describe('SearchInput Component', () => {
  it('renders topbar SearchInput with placeholder', () => {
    render(<SearchInput variant="topbar" placeholder="Search documents..." />);
    expect(screen.getByPlaceholderText('Search documents...')).toBeInTheDocument();
  });

  it('triggers onSearchSubmit when form is submitted', async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();

    render(
      <SearchInput
        variant="topbar"
        placeholder="Find paper..."
        onSearchSubmit={handleSubmit}
      />
    );

    const input = screen.getByPlaceholderText('Find paper...');
    await user.type(input, 'Software Architecture{enter}');

    expect(handleSubmit).toHaveBeenCalled();
  });
});
