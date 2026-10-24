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

vi.mock('../../services/quizService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/quizService')>();
  return {
    ...actual,
    generateQuizFromBackend: vi.fn().mockImplementation(async (docId, difficulty, count, title) => ({
      quizId: 'mock-quiz-123',
      documentId: docId,
      title: title || 'Đề trắc nghiệm AI',
      difficulty,
      totalQuestions: count,
      questions: [
        {
          id: 'q-1',
          question: 'Kiểm thử hộp đen là gì?',
          options: ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'],
          correctAnswerIndex: 0,
          explanation: 'Lời giải chi tiết',
          sourceSection: 'Trang 1',
        },
      ],
      isServerGenerated: true,
    })),
    submitQuizToBackend: vi.fn().mockImplementation(async (quizId, _answers, _questions) => ({
      attempt_id: 'mock-attempt-1',
      quiz_id: quizId,
      score: 1,
      total_questions: 1,
      percentage: 100,
      time_spent_seconds: 30,
      feedback: 'Xuất sắc!',
      details: [
        {
          question_id: 'q-1',
          question_index: 1,
          question_text: 'Kiểm thử hộp đen là gì?',
          selected_option: 'B',
          correct_answer: 'B',
          is_correct: true,
          explanation: 'Lời giải chi tiết từ tài liệu nguồn.',
          source_page: 1,
          source_heading: 'Trang 1',
        },
      ],
      completed_at: new Date().toISOString(),
    })),
    fetchMyQuizHistory: vi.fn().mockResolvedValue([]),
    uploadAndGenerateQuiz: vi.fn(),
  };
});

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

    // Enters practice view
    await waitFor(() => {
      expect(screen.getByText(/Tiến độ hoàn thành:/i)).toBeInTheDocument();
      expect(screen.getByText(/Câu 1:/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Nộp bài kiểm tra ngay/i })).toBeInTheDocument();
    });
  });

  it('allows selecting answer options, submitting, and viewing score result', async () => {
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

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Nộp bài kiểm tra ngay/i })).toBeInTheDocument();
    });

    // Answer first question
    const optionB = screen.getAllByRole('button', { name: /B/i })[0];
    fireEvent.click(optionB);

    // Submit quiz
    const submitBtn = screen.getByRole('button', { name: /Nộp bài kiểm tra ngay/i });
    fireEvent.click(submitBtn);

    // Result card revealed
    await waitFor(() => {
      expect(screen.getByText('Bảng Điểm AI Chính Thức')).toBeInTheDocument();
      expect(screen.getAllByText(/Lời giải chi tiết từ tài liệu nguồn:/i)[0]).toBeInTheDocument();
    });
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
