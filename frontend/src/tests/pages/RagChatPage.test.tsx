import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RagChatPage } from '../../pages/RagChatPage';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
  Toaster: () => null,
}));

vi.mock('../../services/ragChatService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/ragChatService')>();
  return {
    ...actual,
    createChatSession: vi.fn().mockResolvedValue({
      id: 'session-test-123',
      document_id: 'doc-1',
      title: 'Hỏi đáp bài giảng AI',
      created_at: new Date().toISOString(),
    }),
    askRagQuestion: vi.fn().mockImplementation(async (sessionId, question, docTitle) => {
      return {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        session_id: sessionId,
        role: 'assistant',
        content: `Dựa trên tài liệu "${docTitle || 'Tài liệu học thuật'}", câu trả lời cho "${question}" đã được tổng hợp chính xác.`,
        sources_found: [
          {
            chunk_index: 0,
            page_number: 1,
            heading: 'Chương 1: Khái niệm Cốt lõi',
            snippet: 'Trích lục văn bản bài giảng tương ứng.',
          },
        ],
        suggested_docs: [
          {
            id: 'doc-s1',
            title: 'Tài liệu tham khảo mở rộng',
            subject: 'Công nghệ phần mềm',
            kind: 'Practical',
            ratingText: '98% (12)',
            pagesText: '10 trang',
          },
        ],
        created_at: new Date().toISOString(),
      };
    }),
  };
});

describe('RagChatPage (DeDocu AI Study Workspace) Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  const renderRagChatPage = (initialEntry = '/chat') => {
    return render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <RagChatPage />
      </MemoryRouter>
    );
  };

  it('renders landing view with DeDocu AI branding, drag & drop zone, question input, and empty chat history', () => {
    renderRagChatPage();

    expect(screen.getByText('Trợ Lý Học Thuật AI - DeDocu')).toBeInTheDocument();
    expect(screen.getByText(/Kéo & Thả tài liệu học tập vào đây/i)).toBeInTheDocument();
    expect(screen.getByText('Lịch sử đoạn chat')).toBeInTheDocument();
    expect(screen.getByText('Chưa có đoạn chat nào')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Hỏi tôi bất kỳ điều gì về tài liệu/i)).toBeInTheDocument();
  });

  it('allows submitting a question from the landing page to create 1 new chat session and enter workspace', async () => {
    renderRagChatPage();

    const input = screen.getByPlaceholderText(/Hỏi tôi bất kỳ điều gì về tài liệu/i);
    const sendBtn = screen.getByRole('button', { name: /Gửi câu hỏi/i });

    fireEvent.change(input, { target: { value: 'Ôn tập kiến thức Scrum Sprint' } });
    fireEvent.click(sendBtn);

    // Transitions to Notebook workspace view
    await waitFor(() => {
      expect(screen.getByText('Tất cả đoạn chat')).toBeInTheDocument();
      expect(screen.getByText('Tác vụ ôn tập')).toBeInTheDocument();
      expect(screen.getAllByText('Ôn tập kiến thức Scrum Sprint').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('persists created chat session in history and allows clicking to reopen it', async () => {
    renderRagChatPage();

    // Ask a question to create a session
    const input = screen.getByPlaceholderText(/Hỏi tôi bất kỳ điều gì về tài liệu/i);
    const sendBtn = screen.getByRole('button', { name: /Gửi câu hỏi/i });

    fireEvent.change(input, { target: { value: 'Tìm hiểu thuật toán KNN' } });
    fireEvent.click(sendBtn);

    // Wait for workspace to load
    await waitFor(() => {
      expect(screen.getByText('Tất cả đoạn chat')).toBeInTheDocument();
    });

    // Click back to landing
    const backBtn = screen.getByRole('button', { name: /Tất cả đoạn chat/i });
    fireEvent.click(backBtn);

    // Now history should display 1 chat session
    await waitFor(() => {
      expect(screen.getByText('1 đoạn chat')).toBeInTheDocument();
      expect(screen.getByText('Tìm hiểu thuật toán KNN')).toBeInTheDocument();
    });

    // Clicking the chat session card re-opens it in workspace
    const sessionCard = screen.getByText('Tìm hiểu thuật toán KNN');
    fireEvent.click(sessionCard);

    await waitFor(() => {
      expect(screen.getByText('Tất cả đoạn chat')).toBeInTheDocument();
    });
  });

  it('renders left sidebar materials with creations and uploaded sources', async () => {
    renderRagChatPage();

    const input = screen.getByPlaceholderText(/Hỏi tôi bất kỳ điều gì về tài liệu/i);
    const sendBtn = screen.getByRole('button', { name: /Gửi câu hỏi/i });

    fireEvent.change(input, { target: { value: 'Quản trị dự án phần mềm' } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText('Tác vụ ôn tập')).toBeInTheDocument();
      expect(screen.getByText('Nguồn tài liệu đã tải lên')).toBeInTheDocument();
      expect(screen.queryByText('Gợi ý tài liệu cộng đồng')).not.toBeInTheDocument();
    });
  });

  it('allows typing a chat message in the workspace and renders AI response', async () => {
    renderRagChatPage();

    const input = screen.getByPlaceholderText(/Hỏi tôi bất kỳ điều gì về tài liệu/i);
    const sendBtn = screen.getByRole('button', { name: /Gửi câu hỏi/i });

    fireEvent.change(input, { target: { value: 'Tìm hiểu Scrum' } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Bạn muốn tìm hiểu thêm điều gì/i)).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/Bạn muốn tìm hiểu thêm điều gì/i);
    const chatSendBtn = screen.getByRole('button', { name: /Gửi câu hỏi/i });

    fireEvent.change(textarea, { target: { value: 'Giải thích quy trình Agile' } });
    fireEvent.click(chatSendBtn);

    await waitFor(() => {
      expect(screen.getByText('Giải thích quy trình Agile')).toBeInTheDocument();
      expect(screen.getByText(/câu trả lời cho "Giải thích quy trình Agile" đã được tổng hợp chính xác/i)).toBeInTheDocument();
    });
  });

  it('opens quiz creation modal with multi-file checkboxes and creates interactive quiz', async () => {
    renderRagChatPage();

    const input = screen.getByPlaceholderText(/Hỏi tôi bất kỳ điều gì về tài liệu/i);
    const sendBtn = screen.getByRole('button', { name: /Gửi câu hỏi/i });

    fireEvent.change(input, { target: { value: 'Học máy cơ bản' } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Tạo bài trắc nghiệm/i })[0]).toBeInTheDocument();
    });

    const createQuizBtn = screen.getAllByRole('button', { name: /Tạo bài trắc nghiệm/i })[0];
    fireEvent.click(createQuizBtn);

    // Modal opens
    expect(screen.getByText('Tạo bài kiểm tra trắc nghiệm AI')).toBeInTheDocument();
    expect(screen.getByText('Bước 1: Chọn tệp nguồn để tạo bài test')).toBeInTheDocument();

    const generateBtn = screen.getByRole('button', { name: /Tạo bài kiểm tra ngay/i });
    fireEvent.click(generateBtn);

    // Quiz practice view opens
    await waitFor(() => {
      expect(screen.getByText(/Luyện tập Trắc nghiệm/i)).toBeInTheDocument();
      expect(screen.getByText(/Câu 1:/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Nộp bài kiểm tra/i })).toBeInTheDocument();
    });
  });

  it('switches between AI Chat and Summary note view', async () => {
    renderRagChatPage();

    const input = screen.getByPlaceholderText(/Hỏi tôi bất kỳ điều gì về tài liệu/i);
    const sendBtn = screen.getByRole('button', { name: /Gửi câu hỏi/i });

    fireEvent.change(input, { target: { value: 'Tóm tắt bài học' } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getAllByText('Tóm tắt nguồn Note').length).toBeGreaterThan(0);
    });

    // Switch to Summary Note
    const summaryBtn = screen.getAllByText('Tóm tắt nguồn Note')[0];
    fireEvent.click(summaryBtn);

    expect(screen.getByText('Tóm tắt nguồn')).toBeInTheDocument();
    expect(screen.getByText('Giới hạn thông tin')).toBeInTheDocument();

    // Switch back to AI Chat
    const chatTabBtn = screen.getByRole('button', { name: 'AI Chat' });
    fireEvent.click(chatTabBtn);

    expect(screen.getByPlaceholderText(/Bạn muốn tìm hiểu thêm điều gì/i)).toBeInTheDocument();
  });
});
