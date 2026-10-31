import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QuizPage } from '../../pages/QuizPage';
import { documentService } from '../../services/documentService';

// QuizPage nạp danh sách tài liệu thư viện qua documentService.getFeed — mock để dropdown có 'doc-1'
vi.mock('../../services/documentService', () => ({
  documentService: {
    getFeed: vi.fn().mockResolvedValue({
      content: [
        {
          id: 'doc-1',
          title: 'Kiểm thử Hộp Đen & Hộp Trắng',
          courseName: 'Kỹ thuật phần mềm',
          docType: 'SLIDE',
          academicYear: '2026',
          totalPages: 30,
          likeCount: 10,
          author: { id: 'u-1', fullName: 'TS. Nguyễn Văn A' },
        },
        {
          id: 'doc-2',
          title: 'Cấu trúc Dữ liệu & Giải thuật Cơ bản',
          courseName: 'Cấu trúc dữ liệu',
          docType: 'TEXTBOOK',
          academicYear: '2026',
          totalPages: 120,
          likeCount: 8,
          author: { id: 'u-2', fullName: 'TS. Trần Thị B' },
        },
      ],
      pageNumber: 0,
      pageSize: 20,
      totalElements: 2,
      totalPages: 1,
      last: true,
    }),
  },
}));

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

    // Chờ dropdown nạp xong danh sách thư viện (getFeed là async)
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Kiểm thử Hộp Đen/ })).toBeInTheDocument();
    });

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
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Kiểm thử Hộp Đen/ })).toBeInTheDocument();
    });
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
    const sampleHistory = [
      {
        id: 'user-quiz-1',
        title: 'Kiểm thử Hộp Đen & Hộp Trắng',
        sourceDocName: '5_Kiểm thử hộp đen.pdf',
        questionCount: 5,
        correctCount: 4,
        scorePercent: 80,
        createdAt: 'Vừa xong',
        questions: [
          {
            id: 'q-1',
            question: 'Kiểm thử hộp đen là gì?',
            options: ['A', 'B', 'C', 'D'],
            correctAnswerIndex: 0,
          },
        ],
        userAnswers: { 'q-1': 0 },
      },
    ];
    window.localStorage.setItem('dedocu_quiz_history_v2', JSON.stringify(sampleHistory));

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

  it('prompts confirmation modal before clearing all quiz history', () => {
    const sampleHistory = [
      {
        id: 'user-quiz-2',
        title: 'Cấu trúc dữ liệu',
        sourceDocName: 'data_structures.pdf',
        questionCount: 5,
        correctCount: 5,
        scorePercent: 100,
        createdAt: 'Hôm nay',
        questions: [],
        userAnswers: {},
      },
    ];
    window.localStorage.setItem('dedocu_quiz_history_v2', JSON.stringify(sampleHistory));

    render(
      <MemoryRouter>
        <QuizPage />
      </MemoryRouter>
    );

    const clearAllBtn = screen.getByRole('button', { name: /Xóa toàn bộ lịch sử/i });
    expect(clearAllBtn).toBeInTheDocument();

    // Click clear all history
    fireEvent.click(clearAllBtn);

    // Confirmation modal should appear
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Xác nhận xóa toàn bộ lịch sử?')).toBeInTheDocument();
    expect(screen.getByText(/lượt thi và kết quả làm bài trắc nghiệm sẽ bị xóa sạch/i)).toBeInTheDocument();

    // Clicking "Hủy bỏ" closes modal without clearing
    const cancelBtn = screen.getByRole('button', { name: /Hủy bỏ/i });
    fireEvent.click(cancelBtn);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Xóa toàn bộ lịch sử/i })).toBeInTheDocument();

    // Clicking "Xác nhận xóa tất cả" clears history
    fireEvent.click(clearAllBtn);
    const confirmBtn = screen.getByRole('button', { name: /Xác nhận xóa tất cả/i });
    fireEvent.click(confirmBtn);

    // Modal closes and empty history state appears
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText(/Chưa có lượt thi trắc nghiệm nào được ghi lại/i)).toBeInTheDocument();
  });
});

