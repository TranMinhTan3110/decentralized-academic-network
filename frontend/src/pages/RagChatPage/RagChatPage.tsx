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
import { documents, type DocumentItem } from '../../data/documents';
import { generateQuizForDocument, exportQuizToText, type QuizQuestion } from '../../lib/quiz';
import {
  askRagQuestion,
  type ChatMessage,
  type SuggestedDocItem,
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

export interface GeneratedQuizItem {
  id: string;
  title: string;
  sourceNames: string[];
  questions: QuizQuestion[];
  createdAt: string;
}

export interface ChatSessionItem {
  id: string;
  title: string;
  course?: string;
  sources: StudySource[];
  messages: ChatMessage[];
  quizzes: GeneratedQuizItem[];
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

  // Workspace sub-tab: 'chat' | 'quiz' | 'summary'
  const [workspaceTab, setWorkspaceTab] = useState<'chat' | 'quiz' | 'summary'>(() => {
    return defaultMode === 'quiz' ? 'quiz' : 'chat';
  });

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
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const workspaceFileInputRef = useRef<HTMLInputElement>(null);

  // Auto scroll chat
  useEffect(() => {
    if (workspaceTab === 'chat' && typeof chatEndRef.current?.scrollIntoView === 'function') {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentSession?.messages, isLoading, workspaceTab]);

  // ============================================================================
  // QUIZ GENERATION & PRACTICE STATE
  // ============================================================================
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [selectedSourceIdsForQuiz, setSelectedSourceIdsForQuiz] = useState<string[]>([]);
  const [quizQuestionCount, setQuizQuestionCount] = useState<number>(5);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);

  // Current active quiz
  const currentQuiz = useMemo(() => {
    if (!currentSession) return null;
    if (activeQuizId) {
      return currentSession.quizzes.find((q) => q.id === activeQuizId) || null;
    }
    return currentSession.quizzes[0] || null;
  }, [currentSession, activeQuizId]);

  // Quiz score
  const quizScore = useMemo(() => {
    if (!currentQuiz?.questions?.length) return { correct: 0, total: 0, percent: 0 };
    let correct = 0;
    currentQuiz.questions.forEach((q) => {
      if (userAnswers[q.id] === q.correctAnswerIndex) {
        correct += 1;
      }
    });
    const total = currentQuiz.questions.length;
    const percent = Math.round((correct / total) * 100);
    return { correct, total, percent };
  }, [currentQuiz, userAnswers]);

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

    const newSessionId = `session-${Date.now()}`;
    const newSession: ChatSessionItem = {
      id: newSessionId,
      title: newTitle,
      course: 'Tài liệu học tập',
      sources: newSources,
      messages: questionText
        ? [
            {
              id: `user-${Date.now()}`,
              session_id: newSessionId,
              role: 'user',
              content: questionText,
              created_at: new Date().toISOString(),
            },
          ]
        : [],
      quizzes: [],
      summaryNote: {
        title: 'Tóm tắt nguồn Note',
        content: `Đã khởi tạo phiên nghiên cứu cho "${newTitle}". Bạn có thể tiếp tục hỏi đáp hoặc tạo bài trắc nghiệm bất cứ lúc nào.`,
        limitations: 'Nguồn tài liệu được tự động phân tích và đối chiếu qua hệ thống RAG pipeline.',
        createdAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCurrentSession(newSession);
    setChatSessions((prev) => [newSession, ...prev]);
    setViewMode('workspace');
    setWorkspaceTab('chat');
    setLandingQuestion('');
    setLandingFiles([]);

    // If user asked a question, trigger AI answer
    if (questionText) {
      setIsLoading(true);
      try {
        const response = await askRagQuestion(newSessionId, questionText, newTitle);
        setCurrentSession((curr) => {
          if (!curr || curr.id !== newSessionId) return curr;
          return {
            ...curr,
            messages: [...curr.messages, response],
            updatedAt: new Date().toISOString(),
          };
        });

        setChatSessions((prev) =>
          prev.map((s) => {
            if (s.id === newSessionId) {
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
    setWorkspaceTab('chat');
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
      const response = await askRagQuestion(currentSession.id, question, primaryDoc);

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

  const handleWorkspaceFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
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

    toast.success(`Đã tải lên tệp ${file.name}!`);
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
  // HANDLERS: QUIZ CREATION & PRACTICE
  // ============================================================================
  const openQuizModal = () => {
    if (!currentSession) return;
    setSelectedSourceIdsForQuiz(currentSession.sources.map((s) => s.id));
    setIsQuizModalOpen(true);
  };

  const handleToggleSelectAllQuizSources = () => {
    if (!currentSession) return;
    if (selectedSourceIdsForQuiz.length === currentSession.sources.length) {
      setSelectedSourceIdsForQuiz([]);
    } else {
      setSelectedSourceIdsForQuiz(currentSession.sources.map((s) => s.id));
    }
  };

  const handleToggleSourceForQuiz = (id: string) => {
    setSelectedSourceIdsForQuiz((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreateQuizSubmit = () => {
    if (!currentSession) return;
    if (selectedSourceIdsForQuiz.length === 0 && currentSession.sources.length > 0) {
      toast.error('Vui lòng chọn ít nhất 1 tệp nguồn để tạo bài kiểm tra!');
      return;
    }

    const selectedSources = currentSession.sources.filter((s) => selectedSourceIdsForQuiz.includes(s.id));
    const sourceNames = selectedSources.length > 0 ? selectedSources.map((s) => s.name) : [currentSession.title];

    const firstSource = selectedSources[0];
    const matchingDoc = documents.find((d) => d.id === firstSource?.sourceDocId) || documents[0];
    const generatedQuestions = generateQuizForDocument(matchingDoc).slice(0, quizQuestionCount);

    const newQuiz: GeneratedQuizItem = {
      id: `quiz-${Date.now()}`,
      title: `Bài Trắc Nghiệm: ${sourceNames.map((n) => n.replace(/\.[^/.]+$/, '')).join(', ')}`,
      sourceNames,
      questions: generatedQuestions,
      createdAt: new Date().toISOString(),
    };

    setCurrentSession((prev) => (prev ? { ...prev, quizzes: [newQuiz, ...prev.quizzes] } : null));
    setChatSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSession.id) {
          return {
            ...s,
            quizzes: [newQuiz, ...s.quizzes],
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      })
    );

    setActiveQuizId(newQuiz.id);
    setUserAnswers({});
    setIsQuizSubmitted(false);
    setIsQuizModalOpen(false);
    setWorkspaceTab('quiz');

    toast.success(`Đã tạo bài trắc nghiệm với ${generatedQuestions.length} câu hỏi ôn tập!`);
  };

  const handleSelectQuizAnswer = (qId: string, optIdx: number) => {
    if (isQuizSubmitted) return;
    setUserAnswers((prev) => ({ ...prev, [qId]: optIdx }));
  };

  const handleSubmitQuiz = () => {
    if (!currentQuiz) return;
    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount < currentQuiz.questions.length) {
      toast.warning('Bạn chưa hoàn thành tất cả các câu hỏi!', {
        description: `Đã làm ${answeredCount}/${currentQuiz.questions.length} câu. Bạn vẫn có thể nộp bài để xem điểm.`,
      });
    }
    setIsQuizSubmitted(true);
    toast.success('Đã nộp bài kiểm tra trắc nghiệm thành công!');
  };

  const handleResetCurrentQuiz = () => {
    setUserAnswers({});
    setIsQuizSubmitted(false);
    toast.info('Đã xóa câu trả lời để làm lại bài test.');
  };

  const downloadQuizTextUrl = useMemo(() => {
    if (!currentQuiz?.questions?.length) return '#';
    const mockDoc: DocumentItem = {
      ...documents[0],
      title: currentQuiz.title,
    };
    const content = exportQuizToText(mockDoc, currentQuiz.questions);
    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      return URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    }
    return '#';
  }, [currentQuiz]);

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
              className={`p-6 rounded-2xl text-center flex flex-col items-center justify-center gap-3 transition-colors ${
                isLandingDragging ? 'bg-[#F0F9FF] border-2 border-[#0284C7]' : 'bg-[#F8FAFC]'
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
              <div className="flex items-center gap-2 text-xs font-semibold text-[#475569] px-2 pt-1">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#0284C7]" />
                  <span>Thêm môn học</span>
                </button>
              </div>

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

            {/* Take Quiz / Test Button */}
            <button
              type="button"
              onClick={openQuizModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tạo bài trắc nghiệm</span>
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

            {/* Creations Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#64748B] uppercase tracking-wider">
                <span>Tác vụ ôn tập</span>
                <button
                  type="button"
                  onClick={openQuizModal}
                  className="inline-flex items-center gap-1 text-[#0284C7] hover:underline font-bold normal-case text-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo test</span>
                </button>
              </div>

              <div className="space-y-1.5">
                {/* Note item */}
                <button
                  type="button"
                  onClick={() => setWorkspaceTab('summary')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                    workspaceTab === 'summary'
                      ? 'bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]'
                      : 'bg-[#F8FAFC] text-[#334155] hover:bg-[#F1F5F9]'
                  }`}
                >
                  <FileText className="w-4 h-4 shrink-0 text-[#0284C7]" />
                  <span className="truncate">Tóm tắt nguồn Note</span>
                </button>

                {/* Quizzes list */}
                {currentSession.quizzes.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      setActiveQuizId(q.id);
                      setWorkspaceTab('quiz');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                      workspaceTab === 'quiz' && activeQuizId === q.id
                        ? 'bg-[#EDE9FE] text-[#7C3AED] border border-[#DDD6FE]'
                        : 'bg-[#F8FAFC] text-[#334155] hover:bg-[#F1F5F9]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#7C3AED]" />
                      <span className="truncate">{q.title}</span>
                    </div>
                    <span className="text-[10px] text-[#94A3B8] shrink-0 font-medium">{q.questions.length} câu</span>
                  </button>
                ))}
              </div>
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
            {/* View Tab Selector */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWorkspaceTab('chat')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    workspaceTab === 'chat'
                      ? 'bg-white text-[#0284C7] shadow-xs border border-[#E2E8F0]'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  AI Chat
                </button>

                {currentQuiz && (
                  <button
                    type="button"
                    onClick={() => setWorkspaceTab('quiz')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      workspaceTab === 'quiz'
                        ? 'bg-white text-[#7C3AED] shadow-xs border border-[#E2E8F0]'
                        : 'text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    Luyện tập Trắc nghiệm ({currentQuiz.questions.length} câu)
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setWorkspaceTab('summary')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    workspaceTab === 'summary'
                      ? 'bg-white text-[#0284C7] shadow-xs border border-[#E2E8F0]'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  Tóm tắt nguồn Note
                </button>
              </div>

              <div className="text-xs text-[#94A3B8] font-semibold hidden sm:block">
                {currentSession.sources.length} tệp nguồn kết nối
              </div>
            </div>

            {/* TAB CONTENT: 1. AI CHAT */}
            {workspaceTab === 'chat' && (
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
                          className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed ${
                            msg.role === 'user'
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
                <div className="p-4 border-t border-[#E2E8F0] bg-white">
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
            )}

            {/* TAB CONTENT: 2. QUIZ PRACTICE VIEW */}
            {workspaceTab === 'quiz' && currentQuiz && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
                  <div>
                    <h3 className="text-lg font-black text-[#0F172A]">{currentQuiz.title}</h3>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Tổng hợp từ các tệp nguồn: {currentQuiz.sourceNames.join(', ')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={downloadQuizTextUrl}
                      download={`bai-trac-nghiem-${currentQuiz.id}.txt`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-xs font-bold text-[#0F172A] transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải đề (.txt)</span>
                    </a>

                    {isQuizSubmitted && (
                      <button
                        type="button"
                        onClick={handleResetCurrentQuiz}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-xs font-bold text-[#0F172A] transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Làm lại bài</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Score Alert if Submitted */}
                {isQuizSubmitted && (
                  <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Award className="w-6 h-6 text-[#16A34A]" />
                      <div>
                        <h4 className="text-sm font-bold text-[#166534]">
                          Kết quả bài thi: {quizScore.correct}/{quizScore.total} câu đúng ({quizScore.percent}%)
                        </h4>
                        <p className="text-xs text-[#15803D]">
                          {quizScore.percent >= 80
                            ? 'Xuất sắc! Bạn đã nắm rất vững kiến thức trong tài liệu.'
                            : 'Hãy đối chiếu các giải thích chi tiết bên dưới để ôn luyện kỹ hơn.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Questions List */}
                <div className="space-y-6">
                  {currentQuiz.questions.map((q, qIndex) => {
                    const isAnswered = userAnswers[q.id] !== undefined;
                    const isCorrect = userAnswers[q.id] === q.correctAnswerIndex;

                    return (
                      <div
                        key={q.id}
                        className={`p-5 rounded-2xl border transition-all ${
                          isQuizSubmitted
                            ? isCorrect
                              ? 'border-[#86EFAC] bg-[#F0FDF4]'
                              : 'border-[#FCA5A5] bg-[#FEF2F2]'
                            : 'border-[#E2E8F0] bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <h4 className="text-sm font-bold text-[#0F172A] leading-snug">
                            <span className="text-[#0284C7] mr-1.5">Câu {qIndex + 1}:</span>
                            {q.question}
                          </h4>

                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#64748B] shrink-0">
                            {q.sourceSection}
                          </span>
                        </div>

                        {/* Options A, B, C, D */}
                        <div className="space-y-2">
                          {q.options.map((opt, optIndex) => {
                            const isChosen = userAnswers[q.id] === optIndex;
                            const isRightOption = optIndex === q.correctAnswerIndex;

                            let optStyle = 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#334155]';
                            if (isQuizSubmitted) {
                              if (isRightOption) {
                                optStyle = 'border-[#22C55E] bg-[#DCFCE7] text-[#15803D] font-bold';
                              } else if (isChosen && !isRightOption) {
                                optStyle = 'border-[#EF4444] bg-[#FEE2E2] text-[#B91C1C]';
                              }
                            } else if (isChosen) {
                              optStyle = 'border-[#0284C7] bg-[#F0F9FF] text-[#0284C7] font-bold';
                            }

                            return (
                              <button
                                key={optIndex}
                                type="button"
                                disabled={isQuizSubmitted}
                                onClick={() => handleSelectQuizAnswer(q.id, optIndex)}
                                className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs text-left transition-all cursor-pointer ${optStyle}`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold shrink-0">
                                    {String.fromCharCode(65 + optIndex)}
                                  </span>
                                  <span>{opt}</span>
                                </div>

                                {isQuizSubmitted && isRightOption && (
                                  <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                                )}
                                {isQuizSubmitted && isChosen && !isRightOption && (
                                  <XCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Explanation Box */}
                        {isQuizSubmitted && (
                          <div className="mt-3 p-3 rounded-xl bg-white/80 border border-[#E2E8F0] text-xs text-[#475569] space-y-1">
                            <span className="font-bold text-[#0F172A]">Giải thích: </span>
                            <span>{q.explanation}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Submit Button */}
                {!isQuizSubmitted && (
                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSubmitQuiz}
                      className="px-6 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
                    >
                      Nộp bài kiểm tra
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: 3. SUMMARY NOTE */}
            {workspaceTab === 'summary' && (
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
                  <div>
                    <h3 className="text-xl font-black text-[#0F172A]">
                      {currentSession.summaryNote?.title || 'Tóm tắt nguồn Note'}
                    </h3>
                    <p className="text-xs text-[#64748B] mt-1">
                      Tổng quan được trích xuất tự động từ hệ thống RAG pipeline
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toast.info('Đang kích hoạt tính năng phát âm thanh bài giảng...')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F172A] text-white text-xs font-bold hover:bg-[#334155] transition-colors cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Read to me</span>
                    </button>

                    <button
                      type="button"
                      onClick={openQuizModal}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0284C7] text-white text-xs font-bold hover:bg-[#0369A1] transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Tạo bài test từ tóm tắt này</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-6 text-sm text-[#334155] leading-relaxed">
                  <div>
                    <h4 className="text-base font-extrabold text-[#0F172A] mb-2">Tóm tắt nguồn</h4>
                    <p className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
                      {currentSession.summaryNote?.content ||
                        'Nguồn tài liệu được quét tự động và cấu trúc hóa thành các mục ghi nhớ cốt lõi.'}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-base font-extrabold text-[#0F172A] mb-2">Giới hạn thông tin</h4>
                    <p className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
                      {currentSession.summaryNote?.limitations ||
                        'Để đạt hiệu quả tối ưu, sinh viên nên đối chiếu tài liệu với đề thi các năm trước.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* MODAL: TẠO BÀI KIỂM TRA TRẮC NGHIỆM AI */}
        {isQuizModalOpen && (
          <div className="fixed inset-0 z-50 bg-[#0F172A]/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xl w-full max-w-lg p-6 space-y-5">
              <div className="flex items-start justify-between border-b border-[#E2E8F0] pb-3">
                <div className="space-y-1">
                  <h3 className="text-base font-black text-[#0F172A] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                    <span>Tạo bài kiểm tra trắc nghiệm AI</span>
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Hệ thống sẽ quét nội dung các tệp bạn chọn và trích xuất câu hỏi trắc nghiệm
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQuizModalOpen(false)}
                  className="text-[#94A3B8] hover:text-[#0F172A] p-1 cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Step 1: Multi-file source selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#0F172A]">
                    Bước 1: Chọn tệp nguồn để tạo bài test
                  </label>
                  {currentSession.sources.length > 0 && (
                    <button
                      type="button"
                      onClick={handleToggleSelectAllQuizSources}
                      className="text-xs font-semibold text-[#0284C7] hover:underline cursor-pointer"
                    >
                      {selectedSourceIdsForQuiz.length === currentSession.sources.length
                        ? 'Bỏ chọn tất cả'
                        : 'Chọn tất cả'}
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto p-1">
                  {currentSession.sources.length === 0 ? (
                    <p className="text-xs text-[#64748B] italic p-3 bg-[#F8FAFC] rounded-xl text-center">
                      Hệ thống sẽ sử dụng nội dung chủ đề &quot;{currentSession.title}&quot; để tạo câu hỏi.
                    </p>
                  ) : (
                    currentSession.sources.map((src) => {
                      const isChecked = selectedSourceIdsForQuiz.includes(src.id);
                      return (
                        <label
                          key={src.id}
                          className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                            isChecked ? 'border-[#0284C7] bg-[#F0F9FF]' : 'border-[#E2E8F0] bg-[#F8FAFC]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleSourceForQuiz(src.id)}
                              className="rounded border-[#CBD5E1] text-[#0284C7] focus:ring-[#0284C7]"
                            />
                            <FileText className="w-4 h-4 text-[#0284C7]" />
                            <span className="truncate">{src.name}</span>
                          </div>
                          <span className="text-[10px] text-[#94A3B8]">{src.size}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Step 2: Question Count */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#0F172A]">
                  Bước 2: Chọn số lượng câu hỏi
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 10, 15].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setQuizQuestionCount(cnt)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        quizQuestionCount === cnt
                          ? 'border-[#0284C7] bg-[#F0F9FF] text-[#0284C7]'
                          : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#475569]'
                      }`}
                    >
                      {cnt} câu hỏi
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsQuizModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#CBD5E1] bg-white text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC] cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleCreateQuizSubmit}
                  className="px-5 py-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
                >
                  Tạo bài kiểm tra ngay
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
