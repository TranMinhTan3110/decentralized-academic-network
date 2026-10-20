import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QuizPage } from '../../pages/QuizPage';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn().mockReturnValue('loading-toast-id'),
  },
  Toaster: () => null,
}));

describe('QuizPage (DeDocu AI Quiz Studio) Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  it('renders branding header, drag & drop zone, and quiz history section', () => {
    render(
      <MemoryRouter>
        <QuizPage />
      </MemoryRouter>
    );

    expect(screen.getByText('DEDOCU AI QUIZ STUDIO')).toBeInTheDocument();
    expect(screen.getByText('Tạo Đề Thi Trắc Nghiệm Tự Động Từ Tài Liệu')).toBeInTheDocument();
    expect(
      screen.getByText(/Kéo thả tài liệu bài giảng \(\.PDF, \.TXT, \.DOC, \.DOCX\) vào đây/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Lịch Sử Ôn Luyện Trắc Nghiệm')).toBeInTheDocument();
  });

  it('enforces mandatory file requirement: disabled button when no file is selected', () => {
    render(
      <MemoryRouter>
        <QuizPage />
      </MemoryRouter>
    );

    const generateBtn = screen.getByRole('button', { name: /Tạo Đề Thi Trắc Nghiệm Ngay/i });
    expect(generateBtn).toBeDisabled();
    expect(
      screen.getByText(/Bắt buộc phải đính kèm tệp tài liệu hoặc chọn 1 tài liệu từ thư viện/i)
    ).toBeInTheDocument();
  });

  it('unlocks generation when selecting a library document and generates quiz', async () => {
    vi.useFakeTimers();

    render(
      <MemoryRouter>
        <QuizPage />
      </MemoryRouter>
    );

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();

    // Select the first library document
    fireEvent.change(select, { target: { value: 'doc-1' } });

    // Document is attached and button is enabled
    expect(screen.getByText('Đã gắn tài liệu nguồn')).toBeInTheDocument();
    const generateBtn = screen.getByRole('button', { name: /Tạo Đề Thi Trắc Nghiệm Ngay/i });
    expect(generateBtn).not.toBeDisabled();

    // Click to generate quiz
    fireEvent.click(generateBtn);
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Enters practice view
    expect(screen.getByText(/Tiến độ hoàn thành:/i)).toBeInTheDocument();
    expect(screen.getByText(/Câu 1:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nộp bài kiểm tra ngay/i })).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('allows selecting answer options, submitting, and viewing score result', async () => {
    vi.useFakeTimers();

    render(
      <MemoryRouter>
        <QuizPage />
      </MemoryRouter>
    );

    // Select doc and generate
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'doc-1' } });
    const generateBtn = screen.getByRole('button', { name: /Tạo Đề Thi Trắc Nghiệm Ngay/i });
    fireEvent.click(generateBtn);
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Answer first question
    const optionB = screen.getAllByRole('button', { name: /B/i })[0];
    fireEvent.click(optionB);

    // Submit quiz
    const submitBtn = screen.getByRole('button', { name: /Nộp bài kiểm tra ngay/i });
    fireEvent.click(submitBtn);

    // Result card revealed
    expect(screen.getByText('Bảng Điểm AI Chính Thức')).toBeInTheDocument();
    expect(screen.getAllByText(/Lời giải chi tiết từ tài liệu nguồn:/i)[0]).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('allows retaking a quiz from the history section', () => {
    render(
      <MemoryRouter>
        <QuizPage />
      </MemoryRouter>
    );

    const retakeButtons = screen.getAllByRole('button', { name: /Làm lại đề này/i });
    expect(retakeButtons.length).toBeGreaterThan(0);

    // Click retake on the first history item
    fireEvent.click(retakeButtons[0]);

    // Opens directly into practice view
    expect(screen.getByText(/Tiến độ hoàn thành:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nộp bài kiểm tra ngay/i })).toBeInTheDocument();
  });
});
