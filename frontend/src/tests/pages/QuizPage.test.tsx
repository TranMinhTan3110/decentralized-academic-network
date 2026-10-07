import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QuizPage } from '../../pages/QuizPage';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
  Toaster: () => null,
}));

describe('QuizPage Component Unit Tests', () => {
  it('renders header banner and document selector', () => {
    render(
      <MemoryRouter>
        <QuizPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Tạo Quiz & Luyện Tập Trắc Nghiệm')).toBeInTheDocument();
    expect(screen.getByText('BỘ CÔNG CỤ ÔN TẬP THÔNG MINH')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tạo Quiz Ngay/i })).toBeInTheDocument();
  });

  it('generates quiz questions when clicking generate button', () => {
    render(
      <MemoryRouter>
        <QuizPage />
      </MemoryRouter>
    );

    const generateBtn = screen.getByRole('button', { name: /Tạo Quiz Ngay/i });
    fireEvent.click(generateBtn);

    expect(screen.getByRole('button', { name: /Luyện Tập Trực Tiếp/i })).toBeInTheDocument();
    expect(screen.getByText('Câu 1')).toBeInTheDocument();
  });
});
