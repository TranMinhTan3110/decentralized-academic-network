import { useState, useEffect, useMemo, useRef, type ChangeEvent, type DragEvent, type KeyboardEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  FileCode,
  Sparkles,
  Send,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  BookOpen,
  Award,
  Download,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Volume2,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  Search,
  MessageSquare,
  Bot,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { MainLayout } from '../../components/layout';
import { documents } from '../../data/documents';
import {
  askRagQuestion,
  uploadStudyDocument,
  type ChatMessage,
  type SuggestedDocItem,
  type ChatMode,
} from '../../services/ragChatService';

// ==============================================================================
// TYPES & DATA STRUCTURES
// ==============================================================================

export interface StudySource {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'doc' | 'txt';
  uploadedAt: string;
  sourceDocId?: string;
}

export interface ChatSessionItem {
  id: string;
  title: string;
  course?: string;
  sources: StudySource[];
  messages: ChatMessage[];
  quizzes?: any[];
  summaryNote?: {
    title: string;
    content: string;
    limitations: string;
    createdAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface RagChatPageProps {
  defaultMode?: 'landing' | 'workspace' | 'quiz';
  initialDocId?: string;
}

const STORAGE_KEY = 'dedocu_ai_chat_sessions_v4';

// DeDocu AI Custom Project Emblem
export function DeDocuAiEmblem({ className = 'w-12 h-12' }: { className?: string }) {
  return (
    <div
      className={`${className} rounded-2xl bg-gradient-to-tr from-[#1E293B] via-[#0F172A] to-[#0284C7] p-2.5 shadow-md flex items-center justify-center text-white ring-2 ring-[#38BDF8]/25`}
    >
      <Sparkles className="w-full h-full text-[#38BDF8]" />
    </div>
  );
}


export function RagChatPage({ defaultMode = 'landing', initialDocId }: RagChatPageProps) {
  const [searchParams] = useSearchParams();
  const queryDocId = searchParams.get('documentId') || searchParams.get('doc') || initialDocId;

  // Real Chat Sessions list from localStorage (strictly user-created sessions)
  const [chatSessions, setChatSessions] = useState<ChatSessionItem[]>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (err) {
        console.warn('Lỗi đọc chat sessions từ localStorage:', err);
      }
    }
    return [];
  });

  // View mode: 'landing' or 'workspace'
  const [viewMode, setViewMode] = useState<'landing' | 'workspace'>(() => {
    return defaultMode === 'workspace' || queryDocId ? 'workspace' : 'landing';
  });

  // Current active session (direct object state avoids asynchronous mismatch)
  const [currentSession, setCurrentSession] = useState<ChatSessionItem | null>(null);


  // Save chatSessions to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(chatSessions));
      } catch (err) {
        console.warn('Lỗi lưu chat sessions vào localStorage:', err);
      }
    }
  }, [chatSessions]);

  // Handle URL query parameter pre-selection
  useEffect(() => {
    if (!queryDocId) return;
    const matchingDoc = documents.find((d) => d.id === queryDocId);
    if (!matchingDoc) return;

    const existing = chatSessions.find((s) =>
      s.sources.some((src) => src.sourceDocId === queryDocId || src.name.includes(matchingDoc.title.slice(0, 15)))
    );

    if (existing) {
      setCurrentSession(existing);
      setViewMode('workspace');
    } else {
      const newSessionId = `session-${Date.now()}`;
      const newSession: ChatSessionItem = {
        id: newSessionId,
        title: matchingDoc.title,
        course: matchingDoc.category || 'Môn học đại cương',
        sources: [
          {
            id: `src-${Date.now()}`,
            name: `${matchingDoc.title.replace(/\s+/g, '_').slice(0, 30)}.pdf`,
            size: matchingDoc.fileSize || '1.5 MB',
            type: 'pdf',
            uploadedAt: 'Vừa xong',
            sourceDocId: matchingDoc.id,
          },
        ],
        messages: [],
        quizzes: [],
        summaryNote: {
          title: 'Tóm tắt nguồn Note',
          content: `Tài liệu "${matchingDoc.title}" thuộc lĩnh vực ${matchingDoc.category}. Tóm tắt tự động các luận điểm chính và công thức quan trọng giúp chuẩn bị bài thi hiệu quả.`,
          limitations: 'Vui lòng tham khảo thêm đề cương chi tiết trong thư viện để nắm trọn vẹn yêu cầu môn học.',
          createdAt: new Date().toISOString(),
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setCurrentSession(newSession);
      setChatSessions((prev) => [newSession, ...prev]);
      setViewMode('workspace');
    }
  }, [queryDocId]);

  // ============================================================================
  // LANDING VIEW STATE
  // ============================================================================
  const [landingQuestion, setLandingQuestion] = useState('');
  const [landingFiles, setLandingFiles] = useState<File[]>([]);
  const [isLandingDragging, setIsLandingDragging] = useState(false);
  const landingFileInputRef = useRef<HTMLInputElement>(null);

  // ============================================================================
  // WORKSPACE VIEW STATE
  // ============================================================================
  const [chatInput, setChatInput] = useState('');
  const [chatMode, setChatMode] = useState<ChatMode>('normal');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const workspaceFileInputRef = useRef<HTMLInputElement>(null);

  // Auto scroll chat
  useEffect(() => {
    if (typeof chatEndRef.current?.scrollIntoView === 'function') {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentSession?.messages, isLoading]);

  // ============================================================================
  // HANDLERS: LANDING VIEW
  // ============================================================================
  const handleLandingFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setLandingFiles((prev) => [...prev, ...filesArray]);
      toast.success(`Đã chọn ${filesArray.length} tệp tài liệu!`);
    }
  };

  const handleLandingDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsLandingDragging(true);
  };

  const handleLandingDragLeave = () => {
    setIsLandingDragging(false);
  };

  const handleLandingDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsLandingDragging(false);
    if (e.dataTransfer.files) {
      const filesArray = Array.from(e.dataTransfer.files);
      setLandingFiles((prev) => [...prev, ...filesArray]);
      toast.success(`Đã đính kèm ${filesArray.length} tệp tài liệu!`);
    }
  };

  const handleRemoveLandingFile = (index: number) => {
    setLandingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit question or files from Landing View -> Create 1 new chat session
  const handleLandingSubmit = async () => {
    const questionText = landingQuestion.trim();
    if (!questionText && landingFiles.length === 0) {
      toast.error('Vui lòng nhập câu hỏi hoặc chọn tệp tải lên để bắt đầu đoạn chat!');
      return;
    }

    const firstFileName = landingFiles[0]?.name.replace(/\.[^/.]+$/, '') || '';
    const newTitle = questionText ? questionText.slice(0, 45) : firstFileName || 'Đoạn chat mới';

    const newSources: StudySource[] = landingFiles.map((f, idx) => ({
      id: `src-${Date.now()}-${idx}`,
      name: f.name,
      size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
      type: f.name.endsWith('.pdf') ? 'pdf' : f.name.endsWith('.txt') ? 'txt' : 'doc',
      uploadedAt: 'Vừa xong',
    }));

    let targetSessionId = `session-${Date.now()}`;

    // Upload first file if present to start real backend session with chunks
    if (landingFiles.length > 0) {
      const toastId = toast.loading(`Đang xử lý và bóc tách tài liệu "${landingFiles[0].name}"...`);
      try {
        const uploadRes = await uploadStudyDocument(landingFiles[0], undefined, newTitle);
        if (uploadRes?.sessionId) {
          targetSessionId = uploadRes.sessionId;
          toast.success(`Đã nạp ${uploadRes.pagesCount} trang (${uploadRes.totalChunks} đoạn) vào AI!`, { id: toastId });
        } else {
          toast.dismiss(toastId);
        }
      } catch {
        toast.dismiss(toastId);
      }
    }

    const newSession: ChatSessionItem = {
      id: targetSessionId,
      title: newTitle,
      course: 'Tài liệu học tập',
      sources: newSources,
      messages: questionText
        ? [
          {
            id: `user-${Date.now()}`,
            session_id: targetSessionId,
            role: 'user',
            content: questionText,
            created_at: new Date().toISOString(),
          },
        ]
        : [],
      quizzes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCurrentSession(newSession);
    setChatSessions((prev) => [newSession, ...prev]);
    setViewMode('workspace');
    setLandingQuestion('');
    setLandingFiles([]);

    // If user asked a question, trigger AI answer
    if (questionText) {
      setIsLoading(true);
      try {
        const response = await askRagQuestion(targetSessionId, questionText, newTitle, chatMode, landingFiles[0]?.name);
        setCurrentSession((curr) => {
          if (!curr || curr.id !== targetSessionId) return curr;
          return {
            ...curr,
            messages: [...curr.messages, response],
            updatedAt: new Date().toISOString(),
          };
        });

        setChatSessions((prev) =>
          prev.map((s) => {
            if (s.id === targetSessionId) {
              return {
                ...s,
                messages: [...s.messages, response],
                updatedAt: new Date().toISOString(),
              };
            }
            return s;
          })
        );
      } catch {
        toast.error('Có lỗi xảy ra khi tổng hợp câu trả lời AI.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Open existing chat session from history
  const handleOpenSession = (sessionItem: ChatSessionItem) => {
    setCurrentSession(sessionItem);
    setViewMode('workspace');
  };

  // Delete chat session from history
  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setChatSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (currentSession?.id === sessionId) {
      setCurrentSession(null);
    }
    toast.info('Đã xóa đoạn chat khỏi lịch sử.');
  };

  // Start new chat (takes user back to landing box)
  const handleStartNewChat = () => {
    setViewMode('landing');
    setLandingQuestion('');
    setLandingFiles([]);
  };

  // ============================================================================
  // HANDLERS: WORKSPACE CHAT
  // ============================================================================
  const handleSendChatMessage = async (textToSend?: string) => {
    if (!currentSession) return;
    const question = (textToSend || chatInput).trim();
    if (!question || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      session_id: currentSession.id,
      role: 'user',
      content: question,
      created_at: new Date().toISOString(),
    };

    setCurrentSession((prev) => (prev ? { ...prev, messages: [...prev.messages, userMsg] } : null));
    setChatSessions((prev) =>
      prev.map((s) => (s.id === currentSession.id ? { ...s, messages: [...s.messages, userMsg] } : s))
    );
    setChatInput('');
    setIsLoading(true);

    try {
      const primaryDoc = currentSession.sources[0]?.name || currentSession.title;
      const response = await askRagQuestion(
        currentSession.id,
        question,
        primaryDoc,
        chatMode,
        currentSession.sources[0]?.name
      );

      setCurrentSession((prev) => (prev ? { ...prev, messages: [...prev.messages, response] } : null));
      setChatSessions((prev) =>
        prev.map((s) => {
          if (s.id === currentSession.id) {
            return {
              ...s,
              messages: [...s.messages, response],
              updatedAt: new Date().toISOString(),
            };
          }
          return s;
        })
      );
    } catch {
      toast.error('Không thể hoàn tất câu trả lời AI. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChatMessage();
    }
  };

  const handleResetCurrentChat = () => {
    if (!currentSession) return;
    setCurrentSession((prev) => (prev ? { ...prev, messages: [] } : null));
    setChatSessions((prev) =>
      prev.map((s) => (s.id === currentSession.id ? { ...s, messages: [] } : s))
    );
    toast.info('Đã xóa toàn bộ tin nhắn trong đoạn chat này.');
  };

  const toggleSourceExpand = (msgId: string) => {
    setExpandedSources((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const copyToClipboard = (text: string, msgId: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedMsgId(msgId);
      toast.success('Đã sao chép câu trả lời vào bộ nhớ tạm!');
      setTimeout(() => setCopiedMsgId(null), 2000);
    }
  };

  // Add suggested source to active session
  const handleAddSuggestedSource = (item: SuggestedDocItem) => {
    if (!currentSession) return;
    const alreadyExists = currentSession.sources.some((s) => s.name.includes(item.title.slice(0, 15)));
    if (alreadyExists) {
      toast.info('Tài liệu này đã có trong danh sách nguồn của đoạn chat.');
      return;
    }

    const newSource: StudySource = {
      id: `src-comm-${Date.now()}`,
      name: `${item.title.slice(0, 32)}.pdf`,
      size: '1.8 MB',
      type: 'pdf',
      uploadedAt: 'Vừa thêm',
    };

    setCurrentSession((prev) => (prev ? { ...prev, sources: [...prev.sources, newSource] } : null));
    setChatSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSession.id) {
          return {
            ...s,
            sources: [...s.sources, newSource],
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      })
    );

    toast.success(`Đã thêm "${item.title.slice(0, 30)}..." vào tài liệu nguồn!`);
  };

  const handleWorkspaceFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!currentSession || !e.target.files?.length) return;
    const file = e.target.files[0];
    const newSource: StudySource = {
      id: `src-up-${Date.now()}`,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      type: file.name.endsWith('.pdf') ? 'pdf' : file.name.endsWith('.txt') ? 'txt' : 'doc',
      uploadedAt: 'Vừa xong',
    };

    setCurrentSession((prev) => (prev ? { ...prev, sources: [...prev.sources, newSource] } : null));
    setChatSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSession.id) {
          return {
            ...s,
            sources: [...s.sources, newSource],
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      })
    );

    // Call backend API to parse and chunk PDF file
    const toastId = toast.loading(`Đang tải lên và bóc tách văn bản "${file.name}"...`);
    try {
      const uploadRes = await uploadStudyDocument(file, currentSession.id, file.name);
      if (uploadRes) {
        toast.success(
          `Đã nạp thành công ${uploadRes.pagesCount} trang (${uploadRes.totalChunks} đoạn ngữ nghĩa) vào AI!`,
          { id: toastId }
        );
        if (uploadRes.sessionId && uploadRes.sessionId !== currentSession.id) {
          const updatedSessionId = uploadRes.sessionId;
          setCurrentSession((prev) => (prev ? { ...prev, id: updatedSessionId } : null));
          setChatSessions((prev) =>
            prev.map((s) => (s.id === currentSession.id ? { ...s, id: updatedSessionId } : s))
          );
        }
      } else {
        toast.info(`Đã đính kèm tệp "${file.name}" vào phiên học tập.`, { id: toastId });
      }
    } catch {
      toast.info(`Đã đính kèm tệp "${file.name}".`, { id: toastId });
    }
  };

  const handleDeleteSource = (sourceId: string) => {
    if (!currentSession) return;
    setCurrentSession((prev) =>
      prev ? { ...prev, sources: prev.sources.filter((src) => src.id !== sourceId) } : null
    );
    setChatSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSession.id) {
          return {
            ...s,
            sources: s.sources.filter((src) => src.id !== sourceId),
          };
        }
        return s;
      })
    );
    toast.info('Đã xóa tệp nguồn khỏi đoạn chat.');
  };



  // ============================================================================
  // RENDER: VIEW 1 - LANDING VIEW
  // ============================================================================
  if (viewMode === 'landing') {
    return (
      <MainLayout>
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
          {/* Custom Project Header Branding */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <DeDocuAiEmblem className="w-12 h-12" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#0F172A] tracking-tight">
              Trợ Lý Học Thuật AI - DeDocu
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-xl mx-auto leading-relaxed">
              Phân tích tài liệu, giải đáp câu hỏi và tự động tạo đề thi trắc nghiệm ôn tập từ kho tri thức học thuật thực tế.
            </p>
          </div>

          {/* Central Drag & Drop + Question Box */}
          <div className="bg-white rounded-3xl border-2 border-dashed border-[#CBD5E1] p-6 sm:p-8 shadow-xs transition-all hover:border-[#0284C7] space-y-5">
            {/* Drag & Drop File Upload Zone */}
            <div
              onDragOver={handleLandingDragOver}
              onDragLeave={handleLandingDragLeave}
              onDrop={handleLandingDrop}
              className={`p-6 rounded-2xl text-center flex flex-col items-center justify-center gap-3 transition-colors ${isLandingDragging ? 'bg-[#F0F9FF] border-2 border-[#0284C7]' : 'bg-[#F8FAFC]'
                }`}
            >
              <div className="w-12 h-12 rounded-full bg-[#E2E8F0] flex items-center justify-center text-[#475569] shadow-xs">
                <UploadCloud className="w-6 h-6 text-[#0284C7]" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#0F172A]">Kéo & Thả tài liệu học tập vào đây</h3>
                <p className="text-xs text-[#64748B] mt-1">
                  Hoặc{' '}
                  <button
                    type="button"
                    onClick={() => landingFileInputRef.current?.click()}
                    className="text-[#0284C7] font-bold hover:underline cursor-pointer"
                  >
                    chọn tệp từ máy tính
                  </button>
                  . Hỗ trợ tài liệu PDF, DOCX, TXT. Kích thước tối đa: 100 MB.
                </p>
              </div>

              <input
                ref={landingFileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleLandingFileSelect}
                className="hidden"
              />

              {/* Selected Files Chips */}
              {landingFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 justify-center max-w-xl">
                  {landingFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#CBD5E1] rounded-full text-xs font-semibold text-[#0F172A] shadow-xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#0284C7]" />
                      <span className="max-w-[140px] truncate">{file.name}</span>
                      <span className="text-[#94A3B8] text-[10px]">({(file.size / 1024).toFixed(0)} KB)</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLandingFile(idx)}
                        className="text-[#94A3B8] hover:text-[#EF4444] ml-0.5 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Input Form with Course Tag & Send Button */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-3 shadow-xs space-y-2.5">
              {/* <div className="flex items-center gap-2 text-xs font-semibold text-[#475569] px-2 pt-1">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#0284C7]" />
                  <span>Thêm môn học</span>
                </button>
              </div> */}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={landingQuestion}
                  onChange={(e) => setLandingQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleLandingSubmit();
                    }
                  }}
                  placeholder="Hỏi tôi bất kỳ điều gì về tài liệu hoặc môn học của bạn..."
                  className="flex-1 bg-transparent px-3 py-2 text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none"
                />

                <button
                  type="button"
                  onClick={handleLandingSubmit}
                  className="w-10 h-10 rounded-full bg-[#0284C7] hover:bg-[#0369A1] text-white flex items-center justify-center shrink-0 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                  aria-label="Gửi câu hỏi"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Real Chat History Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#0284C7]" />
                  <span>Lịch sử đoạn chat</span>
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Các cuộc trò chuyện học tập và phiên ôn tập bạn đã tạo
                </p>
              </div>
              <span className="text-xs font-bold text-[#0284C7] px-2.5 py-1 rounded-full bg-[#E0F2FE]">
                {chatSessions.length} đoạn chat
              </span>
            </div>

            {/* Empty State when no chat sessions exist */}
            {chatSessions.length === 0 ? (
              <div className="bg-[#F8FAFC] border-2 border-dashed border-[#E2E8F0] rounded-2xl p-8 text-center space-y-2">
                <MessageSquare className="w-8 h-8 text-[#94A3B8] mx-auto" />
                <h3 className="text-sm font-bold text-[#0F172A]">Chưa có đoạn chat nào</h3>
                <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                  Nhập câu hỏi hoặc tải lên tài liệu học tập ở trên để bắt đầu đoạn chat đầu tiên của bạn.
                </p>
              </div>
            ) : (
              /* Chat Sessions Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {chatSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleOpenSession(session)}
                    className="bg-white p-4 rounded-2xl border border-[#E2E8F0] hover:border-[#0284C7] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-3 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] shrink-0 font-bold text-xs">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs font-bold text-[#0F172A] group-hover:text-[#0284C7] transition-colors truncate">
                            {session.title}
                          </h3>
                          <p className="text-[11px] text-[#64748B] truncate">{session.course || 'Tài liệu học tập'}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteSession(e, session.id)}
                        className="text-[#CBD5E1] hover:text-[#EF4444] p-1 rounded-md transition-colors cursor-pointer"
                        title="Xóa đoạn chat này"
                        aria-label="Xóa đoạn chat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-2 border-t border-[#F1F5F9]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-[#0F172A]">{session.messages.length} tin nhắn</span>
                        {session.sources.length > 0 && (
                          <>
                            <span>•</span>
                            <span>{session.sources.length} tệp</span>
                          </>
                        )}
                        {session.quizzes.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-[#0284C7] font-semibold">{session.quizzes.length} quiz</span>
                          </>
                        )}
                      </div>
                      <span className="text-[#0284C7] font-bold">Mở chat</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    );
  }

  // ============================================================================
  // RENDER: VIEW 2 - WORKSPACE VIEW
  // ============================================================================
  if (!currentSession) {
    return (
      <MainLayout>
        <div className="max-w-[800px] mx-auto text-center py-16 space-y-4">
          <DeDocuAiEmblem className="w-12 h-12 mx-auto" />
          <h2 className="text-lg font-bold text-[#0F172A]">Chưa chọn đoạn chat nào</h2>
          <button
            type="button"
            onClick={handleStartNewChat}
            className="px-4 py-2 rounded-xl bg-[#0284C7] text-white text-xs font-bold hover:bg-[#0369A1] transition-colors cursor-pointer"
          >
            Quay lại trang chính
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="w-full max-w-[1400px] mx-auto pb-10 space-y-4 min-w-0">
        {/* Top Header / Breadcrumb Bar */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] px-4 py-3 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setViewMode('landing')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#E2E8F0] text-xs font-bold text-[#0F172A] transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Tất cả đoạn chat</span>
            </button>

            <div className="w-px h-6 bg-[#E2E8F0] shrink-0" />

            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-black text-[#0F172A] truncate">
                {currentSession.title}
              </h1>
              <p className="text-xs text-[#64748B] truncate">{currentSession.course || 'Tài liệu học tập'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Start New Chat Button */}
            <button
              type="button"
              onClick={handleStartNewChat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-xs font-bold text-[#0F172A] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#0284C7]" />
              <span>Đoạn chat mới</span>
            </button>


            {/* Clear Chat Messages */}
            <button
              type="button"
              onClick={handleResetCurrentChat}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#64748B] transition-colors cursor-pointer"
              title="Xóa tin nhắn trong phiên này"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Xóa chat</span>
            </button>
          </div>
        </div>

        {/* Main Workspace Layout (Left Sidebar + Center Workspace) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT SIDEBAR: MATERIALS */}
          <aside className="lg:col-span-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs p-4 sm:p-5 space-y-6">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h2 className="text-sm font-black text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#0284C7]" />
                <span>Tài liệu học tập</span>
              </h2>
              <span className="text-xs text-[#64748B] font-semibold">{currentSession.sources.length} tệp</span>
            </div>

            {/* Sources Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#64748B] uppercase tracking-wider">
                <span>Nguồn tài liệu đã tải lên</span>
                <button
                  type="button"
                  onClick={() => workspaceFileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 text-[#0284C7] hover:underline font-bold normal-case text-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm</span>
                </button>
              </div>

              <input
                ref={workspaceFileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleWorkspaceFileUpload}
                className="hidden"
              />

              {/* Uploaded Sources List */}
              <div className="space-y-1.5">
                {currentSession.sources.length === 0 ? (
                  <p className="text-xs text-[#94A3B8] italic p-2 bg-[#F8FAFC] rounded-xl text-center">
                    Chưa có tệp tài liệu nào đính kèm
                  </p>
                ) : (
                  currentSession.sources.map((src) => (
                    <div
                      key={src.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-semibold text-[#0F172A]"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {src.type === 'pdf' ? (
                          <FileText className="w-4 h-4 text-[#EF4444] shrink-0" />
                        ) : (
                          <FileCode className="w-4 h-4 text-[#0284C7] shrink-0" />
                        )}
                        <span className="truncate">{src.name}</span>
                        <span className="text-[10px] text-[#94A3B8] shrink-0">({src.size})</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteSource(src.id)}
                        className="text-[#CBD5E1] hover:text-[#EF4444] p-1 transition-colors cursor-pointer"
                        title="Xóa tệp nguồn này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>


          </aside>

          {/* CENTER / MAIN CONTENT */}
          <main className="lg:col-span-8 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col min-h-[640px] max-h-[85vh] overflow-hidden">
            {/* Workspace Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] shrink-0" />
                <h3 className="text-sm font-bold text-[#0F172A] truncate">
                  {currentSession.title}
                </h3>
              </div>

              <div className="text-xs text-[#64748B] font-semibold shrink-0 flex items-center gap-2">
                <span className="hidden sm:inline">Nguồn tài liệu:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#CBD5E1] text-[#0F172A] text-[11px] font-bold">
                  {currentSession.sources.length} tệp
                </span>
              </div>
            </div>

            {/* TAB CONTENT: AI CHAT */}
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              {/* Chat Messages Stream */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                {currentSession.messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <DeDocuAiEmblem className="w-12 h-12" />
                    <h3 className="text-base font-bold text-[#0F172A]">Bắt đầu hội thoại nghiên cứu</h3>
                    <p className="text-xs text-[#64748B] max-w-md">
                      Bạn có thể đặt câu hỏi về các tệp tài liệu đã tải lên, yêu cầu trích xuất công thức hoặc tìm kiếm bài thi liên quan.
                    </p>
                  </div>
                ) : (
                  currentSession.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-2`}
                    >
                      {/* Message Bubble */}
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                          ? 'bg-[#0F172A] text-white rounded-tr-xs shadow-xs'
                          : 'bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0] rounded-tl-xs shadow-xs'
                          }`}
                      >
                        <div className="whitespace-pre-line font-medium">{msg.content}</div>

                        {/* Matching Academic Sources Found Card */}
                        {msg.role === 'assistant' && msg.suggested_docs && msg.suggested_docs.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-[#E2E8F0] space-y-2.5">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F172A]">
                              <Sparkles className="w-4 h-4 text-[#0284C7]" />
                              <span>Tài liệu học thuật tìm thấy trong hệ thống</span>
                            </div>

                            <div className="space-y-2">
                              {msg.suggested_docs.map((sDoc) => (
                                <div
                                  key={sDoc.id}
                                  className="bg-white p-3 rounded-xl border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3"
                                >
                                  <div className="min-w-0">
                                    <h5 className="text-xs font-bold text-[#0F172A] truncate">
                                      {sDoc.title}
                                    </h5>
                                    <div className="flex items-center gap-2 text-[10px] text-[#64748B] mt-0.5">
                                      <span className="font-medium text-[#475569]">{sDoc.subject}</span>
                                      <span>•</span>
                                      <span className="font-semibold text-[#0284C7]">{sDoc.kind}</span>
                                      <span>•</span>
                                      <span className="text-[#059669] font-medium">{sDoc.ratingText}</span>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleAddSuggestedSource(sDoc)}
                                    className="w-7 h-7 rounded-lg border border-[#CBD5E1] hover:border-[#0284C7] hover:bg-[#F0F9FF] text-[#0284C7] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                                    title="Thêm tài liệu này vào nguồn đoạn chat"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Source Citations Accordion */}
                        {msg.role === 'assistant' && msg.sources_found && msg.sources_found.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-[#E2E8F0]">
                            <button
                              type="button"
                              onClick={() => toggleSourceExpand(msg.id)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-[#0284C7] hover:underline cursor-pointer"
                            >
                              <span>Trích dẫn từ nguồn ({msg.sources_found.length})</span>
                              {expandedSources[msg.id] ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {expandedSources[msg.id] && (
                              <div className="mt-2 space-y-2">
                                {msg.sources_found.map((c, cIdx) => (
                                  <div
                                    key={cIdx}
                                    className="p-2.5 bg-white rounded-lg border border-[#E2E8F0] text-xs text-[#475569] space-y-1"
                                  >
                                    <div className="flex items-center justify-between font-bold text-[#0F172A]">
                                      <span>{c.heading || 'Đoạn trích học thuật'}</span>
                                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#E0F2FE] text-[#0284C7]">
                                        Trang {c.page_number}
                                      </span>
                                    </div>
                                    <p className="italic text-[#64748B]">&ldquo;{c.snippet}&rdquo;</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Assistant Feedback / Copy Actions */}
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-2 text-xs text-[#94A3B8] px-2">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(msg.content, msg.id)}
                            className="hover:text-[#0F172A] transition-colors p-1"
                            title="Sao chép câu trả lời"
                          >
                            {copiedMsgId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-[#10B981]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button type="button" className="hover:text-[#0F172A] transition-colors p-1" title="Hữu ích">
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" className="hover:text-[#0F172A] transition-colors p-1" title="Chưa chính xác">
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}

                {isLoading && (
                  <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl w-fit">
                    <Sparkles className="w-5 h-5 text-[#0284C7] animate-spin" />
                    <span className="text-xs font-semibold text-[#64748B]">Trợ lý AI đang quét tài liệu và tổng hợp câu trả lời...</span>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Bottom Input Box */}
              <div className="p-4 border-t border-[#E2E8F0] bg-white space-y-2.5">
                {/* Mode Toggle Controls: 1. Tìm kiếm tài liệu, 2. Tập trung vào tài liệu */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                  <div className="flex items-center gap-2">
                    {/* Button 1: Tìm kiếm tài liệu */}
                    <button
                      type="button"
                      onClick={() => setChatMode((prev) => (prev === 'search_docs' ? 'normal' : 'search_docs'))}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${chatMode === 'search_docs'
                        ? 'bg-[#E0F2FE] text-[#0284C7] border-[#38BDF8] shadow-xs ring-2 ring-[#0284C7]/20'
                        : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                        }`}
                      title="Bật/Tắt chế độ tìm kiếm tài liệu học thuật trong hệ thống"
                    >
                      <Search className={`w-3.5 h-3.5 ${chatMode === 'search_docs' ? 'text-[#0284C7]' : 'text-[#64748B]'}`} />
                      <span>Tìm kiếm tài liệu</span>
                      {chatMode === 'search_docs' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7] animate-ping ml-0.5" />
                      )}
                    </button>

                    {/* Button 2: Tập trung vào tài liệu đã tải lên */}
                    <button
                      type="button"
                      onClick={() => setChatMode((prev) => (prev === 'focus_upload' ? 'normal' : 'focus_upload'))}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${chatMode === 'focus_upload'
                        ? 'bg-[#F0FDF4] text-[#16A34A] border-[#4ADE80] shadow-xs ring-2 ring-[#16A34A]/20'
                        : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                        }`}
                      title="Bật/Tắt chế độ tập trung vào tệp tài liệu đã tải lên"
                    >
                      <FileText className={`w-3.5 h-3.5 ${chatMode === 'focus_upload' ? 'text-[#16A34A]' : 'text-[#64748B]'}`} />
                      <span>Tập trung vào tài liệu</span>
                      {chatMode === 'focus_upload' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-ping ml-0.5" />
                      )}
                    </button>
                  </div>

                  {/* Mode Status Hint Badge */}
                  <span className="text-[11px] text-[#94A3B8] font-medium hidden sm:inline-flex items-center gap-1">
                    {chatMode === 'normal' && 'Chế độ trò chuyện & giải thích ngắn gọn (mặc định)'}
                    {chatMode === 'search_docs' && 'Đang bật: Tìm & gợi ý tài liệu học thuật'}
                    {chatMode === 'focus_upload' && 'Đang bật: Tập trung phân tích tệp tài liệu tải lên'}
                  </span>
                </div>

                <div className="bg-white border-2 border-[#CBD5E1] focus-within:border-[#0284C7] rounded-2xl p-2.5 shadow-xs flex items-end gap-2 transition-all">
                  {/* Add file button */}
                  <button
                    type="button"
                    onClick={() => workspaceFileInputRef.current?.click()}
                    className="w-9 h-9 rounded-xl text-[#64748B] hover:text-[#0284C7] hover:bg-[#F0F9FF] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                    title="Đính kèm tệp mới vào cuộc trò chuyện"
                  >
                    <Plus className="w-5 h-5" />
                  </button>

                  {/* Textarea */}
                  <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleChatKeyDown}
                    placeholder="Bạn muốn tìm hiểu thêm điều gì?"
                    rows={1}
                    className="flex-1 bg-transparent py-1.5 px-2 text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none resize-none max-h-32"
                  />

                  {/* Send Button */}
                  <button
                    type="button"
                    onClick={() => handleSendChatMessage()}
                    disabled={isLoading || !chatInput.trim()}
                    className="w-9 h-9 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition-colors shadow-xs cursor-pointer"
                    title="Gửi câu hỏi"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </MainLayout>
  );
}
