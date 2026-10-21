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
    loading: vi.fn().mockReturnValue('loading-toast-id'),
    dismiss: vi.fn(),
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
    uploadStudyDocument: vi.fn().mockResolvedValue({
      sessionId: 'session-test-upload',
      documentId: 'doc-test-upload',
      fileName: 'test.pdf',
      totalChunks: 5,
      pagesCount: 2,
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
      expect(screen.getAllByText('Tài liệu học tập').length).toBeGreaterThanOrEqual(1);
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
      expect(screen.getAllByText('Tài liệu học tập').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Nguồn tài liệu đã tải lên')).toBeInTheDocument();
      expect(screen.queryByText('Tác vụ ôn tập')).not.toBeInTheDocument();
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

  it('manages study materials in sidebar without quiz clutter', async () => {
    renderRagChatPage();

    const input = screen.getByPlaceholderText(/Hỏi tôi bất kỳ điều gì về tài liệu/i);
    const sendBtn = screen.getByRole('button', { name: /Gửi câu hỏi/i });

    fireEvent.change(input, { target: { value: 'Học máy cơ bản' } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText(/Nguồn tài liệu đã tải lên/i)).toBeInTheDocument();
      expect(screen.queryByText('Tạo bài kiểm tra trắc nghiệm AI')).not.toBeInTheDocument();
    });
  });

  it('toggles between document search and upload focus modes mutually exclusively without summary note', async () => {
    renderRagChatPage();

    const input = screen.getByPlaceholderText(/Hỏi tôi bất kỳ điều gì về tài liệu/i);
    const sendBtn = screen.getByRole('button', { name: /Gửi câu hỏi/i });

    fireEvent.change(input, { target: { value: 'Giải tích có khó không?' } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Tìm kiếm tài liệu/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Tập trung vào tài liệu/i })).toBeInTheDocument();
    });

    // Ensure summary note tab is completely removed
    expect(screen.queryByText('Tóm tắt nguồn Note')).not.toBeInTheDocument();

    // Default: Normal conversation mode hint
    expect(screen.getByText(/Chế độ trò chuyện & giải thích ngắn gọn/i)).toBeInTheDocument();

    const searchDocsBtn = screen.getByRole('button', { name: /Tìm kiếm tài liệu/i });
    const focusUploadBtn = screen.getByRole('button', { name: /Tập trung vào tài liệu/i });

    // 1. Click Search Docs -> Search docs active
    fireEvent.click(searchDocsBtn);
    expect(screen.getByText(/Đang bật: Tìm & gợi ý tài liệu học thuật/i)).toBeInTheDocument();

    // 2. Click Focus Upload -> Mutually exclusive: Focus upload active, search docs turns off
    fireEvent.click(focusUploadBtn);
    expect(screen.getByText(/Đang bật: Tập trung phân tích tệp tài liệu tải lên/i)).toBeInTheDocument();

    // 3. Click Focus Upload again -> Toggles off, back to default normal
    fireEvent.click(focusUploadBtn);
    expect(screen.getByText(/Chế độ trò chuyện & giải thích ngắn gọn/i)).toBeInTheDocument();
  });

  it('prompts confirmation modal before clearing chat messages in workspace', async () => {
    renderRagChatPage();

    const input = screen.getByPlaceholderText(/Hỏi tôi bất kỳ điều gì về tài liệu/i);
    const sendBtn = screen.getByRole('button', { name: /Gửi câu hỏi/i });

    fireEvent.change(input, { target: { value: 'Hỏi về thiết kế hệ thống' } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Xóa chat/i })).toBeInTheDocument();
    });

    // Click "Xóa chat" button
    const clearChatBtn = screen.getByRole('button', { name: /Xóa chat/i });
    fireEvent.click(clearChatBtn);

    // Confirmation modal should appear
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Xác nhận xóa đoạn chat?')).toBeInTheDocument();
    expect(screen.getByText(/Toàn bộ tin nhắn trao đổi trong phiên hỏi đáp này sẽ bị xóa sạch/i)).toBeInTheDocument();

    // Clicking "Hủy bỏ" dismisses modal
    const cancelBtn = screen.getByRole('button', { name: /Hủy bỏ/i });
    fireEvent.click(cancelBtn);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Clicking "Xác nhận xóa" confirms deletion
    fireEvent.click(clearChatBtn);
    const confirmBtn = screen.getByRole('button', { name: /Xác nhận xóa/i });
    fireEvent.click(confirmBtn);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

