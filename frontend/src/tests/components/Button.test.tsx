import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../../components/ui/Button/Button';

describe('Button Component', () => {
    it('renders button with text correctly', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('triggers onClick callback when clicked', async () => {
        const handleClick = vi.fn();
        const user = userEvent.setup();

        render(<Button onClick={handleClick}>Submit</Button>);
        const button = screen.getByRole('button', { name: /submit/i });

        await user.click(button);
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not trigger onClick when disabled', async () => {
        const handleClick = vi.fn();
        const user = userEvent.setup();

        render(
            <Button disabled onClick={handleClick}>
                Disabled
            </Button>,
        );
        const button = screen.getByRole('button', { name: /disabled/i });

        expect(button).toBeDisabled();
        await user.click(button);
        expect(handleClick).not.toHaveBeenCalled();
    });

    it('applies correct variant styling classes', () => {
        const { rerender } = render(<Button variant="primary">Primary</Button>);
        expect(screen.getByRole('button')).toHaveClass('bg-[#315dff]');

        rerender(<Button variant="secondary">Secondary</Button>);
        expect(screen.getByRole('button')).toHaveClass('bg-white');

        rerender(<Button variant="upload">Upload</Button>);
        expect(screen.getByRole('button')).toHaveClass('bg-[#ee964b]');
    });
});
