import { useState, useMemo, useEffect, useRef, type ChangeEvent, type DragEvent } from 'react';
import {
  Sparkles,
  FileText,
  UploadCloud,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Award,
  BookOpen,
  ArrowLeft,
  Download,
  Trash2,
  Clock,
  History,
  FileQuestion,
  ChevronRight,
  Filter,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { MainLayout } from '../../components/layout';
import { documents, type DocumentItem } from '../../data/documents';
import { generateQuizForDocument, exportQuizToText, type QuizQuestion } from '../../lib/quiz';
import {
  uploadAndGenerateQuiz,
  generateQuizFromBackend,
  submitQuizToBackend,
  fetchMyQuizHistory,
  type QuizSubmissionResult,
  type GeneratedQuizResponse,
} from '../../services/quizService';

// ==============================================================================
// TYPES & DATA STRUCTURES
// ==============================================================================

export interface QuizHistoryItem {
  id: string;
  title: string;
  sourceDocName: string;
  questionCount: number;
  correctCount: number;
  scorePercent: number;
  createdAt: string;
  questions: QuizQuestion[];
  userAnswers: Record<string, number>;
}

const STORAGE_QUIZ_HISTORY_KEY = 'dedocu_quiz_history_v2';

const INITIAL_QUIZ_HISTORY: QuizHistoryItem[] = [
  {
    id: 'hist-1',
    title: 'Kiểm thử Hộp Đen & Hộp Trắng',
    sourceDocName: '5_Kiểm thử hộp đen.pdf',
    questionCount: 10,
    correctCount: 9,
    scorePercent: 90,
    createdAt: 'Vừa xong',
    questions: generateQuizForDocument(documents[0]).slice(0, 10),
    userAnswers: { q1: 1, q2: 1, q3: 1, q4: 1, q5: 1 },
  },
  {
    id: 'hist-2',
    title: 'Cấu trúc Dữ liệu & Giải thuật Cơ bản',
    sourceDocName: 'CTDL_GT_BaiGiang_2024.pdf',
    questionCount: 10,
    correctCount: 8,
    scorePercent: 80,
    createdAt: '2 giờ trước',
    questions: generateQuizForDocument(documents[1] || documents[0]).slice(0, 10),
    userAnswers: { q1: 1, q2: 1 },
  },
  {
    id: 'hist-3',
    title: 'Toán Rời Rạc & Đại Số Tuyến Tính',
    sourceDocName: 'ToanRoiRac_OnTap_K46.pdf',
    questionCount: 5,
    correctCount: 4,
    scorePercent: 80,
    createdAt: 'Hôm qua',
    questions: generateQuizForDocument(documents[2] || documents[0]).slice(0, 5),
    userAnswers: { q1: 1 },
  },
];

// ==============================================================================
// COMPONENT
// ==============================================================================

export function QuizPage() {
  const [viewMode, setViewMode] = useState<'landing' | 'practice'>('landing');

  // Selected file/document state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Configuration options
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isGenerating, setIsGenerating] = useState(false);

  // Active quiz state (Practice View)
  const [activeQuizId, setActiveQuizId] = useState<string>('');
  const [activeQuizTitle, setActiveQuizTitle] = useState('');
  const [activeSourceDocName, setActiveSourceDocName] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<QuizSubmissionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // History state
  const [historyList, setHistoryList] = useState<QuizHistoryItem[]>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(STORAGE_QUIZ_HISTORY_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (err) {
        console.warn('Lỗi đọc lịch sử quiz từ localStorage:', err);
      }
    }
    return INITIAL_QUIZ_HISTORY;
  });

  // Save history to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_QUIZ_HISTORY_KEY, JSON.stringify(historyList));
      } catch (err) {
        console.warn('Lỗi lưu lịch sử quiz:', err);
      }
    }
  }, [historyList]);

  // Load official history from backend on mount
  useEffect(() => {
    let isMounted = true;
    fetchMyQuizHistory().then((serverHistory) => {
      if (!isMounted || !serverHistory || serverHistory.length === 0) return;
      const transformed: QuizHistoryItem[] = serverHistory.map((item) => {
        const dateObj = new Date(item.completed_at);
        const dateStr = !isNaN(dateObj.getTime())
          ? dateObj.toLocaleDateString('vi-VN')
          : 'Gần đây';

        return {
          id: item.id,
          title: item.quiz_title,
          sourceDocName: 'Tài liệu học thuật',
          questionCount: item.total_questions,
          correctCount: item.score,
          scorePercent: Math.round(item.percentage),
          createdAt: dateStr,
          questions: [],
          userAnswers: {},
        };
      });

      setHistoryList((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newItems = transformed.filter((t) => !existingIds.has(t.id));
        return newItems.length > 0 ? [...newItems, ...prev] : prev;
      });
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Derived selected document from library
  const selectedLibraryDoc = useMemo(() => {
    if (!selectedDocId) return null;
    return documents.find((d) => d.id === selectedDocId) || null;
  }, [selectedDocId]);

  // Mandatory check: Must have a file or library document
  const hasSelectedSource = Boolean(selectedFile || selectedLibraryDoc);

  // Active source display name
  const currentSourceDisplayName = useMemo(() => {
    if (selectedFile) return selectedFile.name;
    if (selectedLibraryDoc) return selectedLibraryDoc.title;
    return '';
  }, [selectedFile, selectedLibraryDoc]);

  // Current active source size/format text
  const currentSourceMetaText = useMemo(() => {
    if (selectedFile) {
      const sizeMb = (selectedFile.size / (1024 * 1024)).toFixed(1);
      return `${sizeMb} MB • Tệp người dùng tải lên`;
    }
    if (selectedLibraryDoc) {
      const pageInfo = Array.isArray(selectedLibraryDoc.pages)
        ? selectedLibraryDoc.pages.length
        : selectedLibraryDoc.pages || 10;
      return `${pageInfo} trang • Thư viện DeDocu`;
    }
    return '';
  }, [selectedFile, selectedLibraryDoc]);

  // Score calculation
  const scoreResult = useMemo(() => {
    if (submissionResult) {
      return {
        correct: submissionResult.score,
        total: submissionResult.total_questions,
        percent: Math.round(submissionResult.percentage),
      };
    }
    if (!questions.length) return { correct: 0, total: 0, percent: 0 };
    let correct = 0;
    questions.forEach((q) => {
      if (userAnswers[q.id] === q.correctAnswerIndex) {
        correct += 1;
      }
    });
    const total = questions.length;
    const percent = Math.round((correct / total) * 100);
    return { correct, total, percent };
  }, [questions, userAnswers, submissionResult]);

  // ============================================================================
  // HANDLERS: FILE UPLOAD & SELECTION
  // ============================================================================

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setSelectedDocId(''); // Clear library selection to prioritize uploaded file
      toast.success(`Đã nạp tệp "${file.name}" làm tài liệu nguồn ôn tập!`);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setSelectedDocId('');
      toast.success(`Đã chọn tệp "${file.name}".`);
    }
  };

  const handleSelectLibraryDoc = (docId: string) => {
    setSelectedDocId(docId);
    setSelectedFile(null); // Clear uploaded file to prioritize library selection
    const doc = documents.find((d) => d.id === docId);
    if (doc) {
      toast.info(`Đã chọn tài liệu: "${doc.title}"`);
    }
  };

  const handleClearSelectedSource = () => {
    setSelectedFile(null);
    setSelectedDocId('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.info('Đã gỡ tài liệu nguồn.');
  };

  // ============================================================================
  // HANDLERS: GENERATE & PRACTICE QUIZ
  // ============================================================================

  const handleGenerateQuiz = async () => {
    if (!hasSelectedSource) {
      toast.error('Vui lòng kéo thả tệp tải lên hoặc chọn 1 tài liệu học tập để mở khóa tạo đề!');
      return;
    }

    setIsGenerating(true);
    const diffLabel = difficulty === 'easy' ? 'Cơ bản' : difficulty === 'medium' ? 'Tổng hợp' : 'Nâng cao';
    const toastId = toast.loading(
      selectedFile
        ? `AI đang tải tệp lên, trích xuất bài giảng và biên soạn ${questionCount} câu hỏi (${diffLabel})...`
        : `AI đang đọc tài liệu và biên soạn ${questionCount} câu hỏi (${diffLabel})...`
    );

    try {
      let generatedData: GeneratedQuizResponse | null = null;

      if (selectedFile) {
        // Real file upload to backend chunking + quiz generation
        generatedData = await uploadAndGenerateQuiz(selectedFile, difficulty, questionCount);
      } else if (selectedLibraryDoc) {
        // Generate from selected library document
        const title = `Đề trắc nghiệm: ${selectedLibraryDoc.title}`;
        generatedData = await generateQuizFromBackend(
          selectedLibraryDoc.id,
          difficulty,
          questionCount,
          title
        );

        // Fallback to client mock if backend did not have chunks for this doc or offline
        if (!generatedData) {
          const clientQuestions = generateQuizForDocument(selectedLibraryDoc).slice(0, questionCount);
          generatedData = {
            quizId: `local-quiz-${Date.now()}`,
            documentId: selectedLibraryDoc.id,
            title,
            difficulty,
            totalQuestions: questionCount,
            questions: clientQuestions,
            isServerGenerated: false,
          };
        }
      }

      if (generatedData && generatedData.questions.length > 0) {
        setActiveQuizId(generatedData.quizId);
        setActiveQuizTitle(generatedData.title);
        setActiveSourceDocName(currentSourceDisplayName);
        setQuestions(generatedData.questions);
        setUserAnswers({});
        setIsSubmitted(false);
        setSubmissionResult(null);
        setViewMode('practice');

        toast.success(
          generatedData.isServerGenerated
            ? `Backend AI đã bóc tách tài liệu và sinh đề thi (${generatedData.questions.length} câu)!`
            : `Đã khởi tạo bộ câu hỏi luyện tập (${generatedData.questions.length} câu)!`,
          { id: toastId }
        );
      } else {
        toast.error('Không thể tạo bộ câu hỏi trắc nghiệm từ tài liệu này.', { id: toastId });
      }
    } catch (err: unknown) {
      console.error('[QuizPage] Lỗi tạo đề:', err);
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tạo đề thi trắc nghiệm.';
      toast.error(msg, { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!questions.length) return;
    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount < questions.length) {
      toast.warning('Bạn chưa hoàn thành tất cả các câu hỏi!', {
        description: `Đã trả lời ${answeredCount}/${questions.length} câu. Bạn vẫn có thể xem bảng điểm và lời giải.`,
      });
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Đang nộp bài và đối soát kết quả...');

    try {
      // 1. Try sending to backend for official grading
      const serverResult = await submitQuizToBackend(activeQuizId, userAnswers, questions);

      let finalCorrect = 0;
      let finalPercent = 0;

      if (serverResult) {
        setSubmissionResult(serverResult);
        finalCorrect = serverResult.score;
        finalPercent = Math.round(serverResult.percentage);

        // Update explanations with server details if available
        if (serverResult.details && serverResult.details.length > 0) {
          const detailMap = new Map(serverResult.details.map((d) => [d.question_id, d]));
          const letterToIndex: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };

          setQuestions((prevQuestions) =>
            prevQuestions.map((q) => {
              const d = detailMap.get(q.id);
              if (d) {
                return {
                  ...q,
                  correctAnswerIndex: letterToIndex[d.correct_answer] ?? q.correctAnswerIndex,
                  explanation: d.explanation || q.explanation,
                  sourceSection: d.source_heading || (d.source_page ? `Trang ${d.source_page}` : q.sourceSection),
                };
              }
              return q;
            })
          );
        }
      } else {
        // Client fallback calculation
        questions.forEach((q) => {
          if (userAnswers[q.id] === q.correctAnswerIndex) finalCorrect += 1;
        });
        finalPercent = Math.round((finalCorrect / questions.length) * 100);
      }

      setIsSubmitted(true);
      toast.success('Đã nộp bài kiểm tra thành công!', { id: toastId });

      // Automatically record into history
      const newHistoryItem: QuizHistoryItem = {
        id: `hist-${Date.now()}`,
        title: activeQuizTitle,
        sourceDocName: activeSourceDocName,
        questionCount: questions.length,
        correctCount: finalCorrect,
        scorePercent: finalPercent,
        createdAt: 'Vừa xong',
        questions,
        userAnswers,
      };

      setHistoryList((prev) => [newHistoryItem, ...prev]);
    } catch (err) {
      console.error('[QuizPage] Lỗi nộp bài:', err);
      toast.error('Có lỗi xảy ra khi nộp bài kiểm tra.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetQuiz = () => {
    setUserAnswers({});
    setIsSubmitted(false);
    setSubmissionResult(null);
    toast.info('Đã xóa câu trả lời để bạn làm lại bài thi từ đầu.');
  };

  const handleRetakeFromHistory = (item: QuizHistoryItem) => {
    setActiveQuizId(item.id);
    setActiveQuizTitle(item.title);
    setActiveSourceDocName(item.sourceDocName);
    setQuestions(item.questions);
    setUserAnswers({});
    setIsSubmitted(false);
    setSubmissionResult(null);
    setViewMode('practice');
    toast.info(`Bắt đầu làm lại bài thi: "${item.title}"`);
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistoryList((prev) => prev.filter((item) => item.id !== id));
    toast.info('Đã xóa mục khỏi lịch sử làm bài.');
  };

  const handleClearAllHistory = () => {
    setHistoryList([]);
    toast.info('Đã dọn sạch toàn bộ lịch sử ôn luyện.');
  };

  const downloadTextUrl = useMemo(() => {
    if (!questions.length) return '#';
    const mockDoc: DocumentItem = {
      ...documents[0],
      title: activeQuizTitle,
    };
    const content = exportQuizToText(mockDoc, questions);
    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      return URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    }
    return '#';
  }, [activeQuizTitle, questions]);

  // ============================================================================
  // RENDER: VIEW 2 - QUIZ PRACTICE / TEST TAKING
  // ============================================================================
  if (viewMode === 'practice') {
    const answeredCount = Object.keys(userAnswers).length;
    const progressPercent = Math.round((answeredCount / (questions.length || 1)) * 100);

    return (
      <MainLayout>
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
          {/* Top Bar Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setViewMode('landing')}
                className="w-9 h-9 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#0F172A] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                title="Quay lại phòng chọn đề"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-black text-[#0F172A] truncate">
                  {activeQuizTitle}
                </h1>
                <p className="text-xs text-[#64748B] truncate mt-0.5">
                  Tài liệu nguồn: <span className="font-semibold text-[#0284C7]">{activeSourceDocName}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <a
                href={downloadTextUrl}
                download={`de-thi-${Date.now()}.txt`}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-xs font-bold text-[#0F172A] transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tải đề</span> (.txt)
              </a>

              {isSubmitted && (
                <button
                  type="button"
                  onClick={handleResetQuiz}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-xs font-bold text-[#0F172A] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Làm lại</span>
                </button>
              )}
            </div>
          </div>

          {/* Progress Tracker Card */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#64748B]">
              <span>Tiến độ hoàn thành: {answeredCount}/{questions.length} câu</span>
              <span className="text-[#0284C7] font-black">{progressPercent}%</span>
            </div>
            <div className="w-full h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#0284C7] to-[#38BDF8] transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Score Summary Card (When Submitted) */}
          {isSubmitted && (
            <div className="p-6 rounded-3xl bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] border border-[#86EFAC] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#16A34A] text-white flex items-center justify-center shrink-0 shadow-md">
                  <Award className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#BBF7D0] text-[#15803D] text-[11px] font-black uppercase tracking-wider">
                    Bảng Điểm AI Chính Thức
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#14532D]">
                    {scoreResult.correct} / {scoreResult.total} câu chính xác ({scoreResult.percent}%)
                  </h3>
                  <p className="text-xs sm:text-sm text-[#166534]">
                    {scoreResult.percent >= 80
                      ? 'Thành tích xuất sắc! Bạn đã thấu suốt các trọng tâm kiến thức trong tài liệu.'
                      : scoreResult.percent >= 50
                      ? 'Kết quả đạt yêu cầu! Hãy xem kỹ lời giải chi tiết bên dưới để bổ sung lỗ hổng.'
                      : 'Hãy đọc lại các phần bài giảng được trích dẫn và làm lại bài thi để ghi nhớ tốt hơn.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('landing')}
                  className="px-4 py-2.5 rounded-xl bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-xs font-bold text-[#0F172A] transition-colors shadow-2xs cursor-pointer"
                >
                  Tạo đề thi mới
                </button>
              </div>
            </div>
          )}

          {/* Questions List */}
          <div className="space-y-6">
            {questions.map((q, qIndex) => {
              const isAnswered = userAnswers[q.id] !== undefined;
              const isCorrect = userAnswers[q.id] === q.correctAnswerIndex;

              return (
                <div
                  key={q.id}
                  className={`p-5 sm:p-6 rounded-3xl border transition-all ${
                    isSubmitted
                      ? isCorrect
                        ? 'border-[#86EFAC] bg-[#F0FDF4]/60'
                        : 'border-[#FCA5A5] bg-[#FEF2F2]/60'
                      : isAnswered
                      ? 'border-[#BAE6FD] bg-white shadow-xs'
                      : 'border-[#E2E8F0] bg-white shadow-2xs'
                  }`}
                >
                  {/* Question Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <h2 className="text-sm sm:text-base font-bold text-[#0F172A] leading-snug">
                      <span className="text-[#0284C7] mr-2 font-black">Câu {qIndex + 1}:</span>
                      {q.question}
                    </h2>

                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#F1F5F9] text-[#64748B] shrink-0 border border-[#E2E8F0]">
                      {q.sourceSection}
                    </span>
                  </div>

                  {/* 4 Options A, B, C, D */}
                  <div className="space-y-2.5">
                    {q.options.map((opt, optIndex) => {
                      const isChosen = userAnswers[q.id] === optIndex;
                      const isRightOption = optIndex === q.correctAnswerIndex;

                      let optClass = 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#334155]';
                      if (isSubmitted) {
                        if (isRightOption) {
                          optClass = 'border-[#22C55E] bg-[#DCFCE7] text-[#15803D] font-bold shadow-2xs';
                        } else if (isChosen && !isRightOption) {
                          optClass = 'border-[#EF4444] bg-[#FEE2E2] text-[#B91C1C]';
                        }
                      } else if (isChosen) {
                        optClass = 'border-[#0284C7] bg-[#F0F9FF] text-[#0284C7] font-bold shadow-2xs';
                      }

                      return (
                        <button
                          key={optIndex}
                          type="button"
                          disabled={isSubmitted}
                          onClick={() => handleSelectOption(q.id, optIndex)}
                          className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-xs sm:text-sm text-left transition-all cursor-pointer ${optClass}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-black shrink-0">
                              {String.fromCharCode(65 + optIndex)}
                            </span>
                            <span>{opt}</span>
                          </div>

                          {isSubmitted && isRightOption && (
                            <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" />
                          )}
                          {isSubmitted && isChosen && !isRightOption && (
                            <XCircle className="w-5 h-5 text-[#EF4444] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation Box (Revealed on Submit) */}
                  {isSubmitted && (
                    <div className="mt-4 p-4 rounded-2xl bg-white border border-[#CBD5E1] text-xs sm:text-sm text-[#475569] space-y-1.5 shadow-2xs">
                      <div className="flex items-center gap-2 font-bold text-[#0F172A]">
                        <BookOpen className="w-4 h-4 text-[#0284C7]" />
                        <span>Lời giải chi tiết từ tài liệu nguồn:</span>
                      </div>
                      <p className="leading-relaxed pl-6 border-l-2 border-[#0284C7] text-[#334155] italic">
                        &quot;{q.explanation}&quot;
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Footer */}
          {!isSubmitted && (
            <div className="flex items-center justify-between pt-4 pb-12 border-t border-[#E2E8F0]">
              <span className="text-xs text-[#64748B]">
                Đã chọn {answeredCount}/{questions.length} câu trả lời
              </span>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitQuiz}
                className="px-8 py-3 rounded-2xl bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-50 text-white font-black text-sm transition-all shadow-md hover:shadow-lg cursor-pointer"
              >
                {isSubmitting ? 'Đang chấm điểm...' : 'Nộp bài kiểm tra ngay'}
              </button>
            </div>
          )}
        </div>
      </MainLayout>
    );
  }

  // ============================================================================
  // RENDER: VIEW 1 - LANDING & FILE SELECTION VIEW
  // ============================================================================
  return (
    <MainLayout>
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] text-[#0284C7] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#0284C7]" />
            <span>DEDOCU AI QUIZ STUDIO</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#0F172A] tracking-tight">
            Tạo Đề Thi Trắc Nghiệm Tự Động Từ Tài Liệu
          </h1>

          <p className="text-xs sm:text-sm text-[#64748B] max-w-xl mx-auto leading-relaxed">
            Hệ thống AI tự động bóc tách giáo trình, trích xuất các khái niệm cốt lõi và sinh đề ôn tập 4 lựa chọn kèm đáp án trích dẫn chi tiết.
          </p>
        </div>

        {/* Central Drag & Drop Zone */}
        <div className="bg-white rounded-3xl border-2 border-dashed border-[#CBD5E1] p-6 sm:p-8 shadow-xs transition-all hover:border-[#0284C7] space-y-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`p-6 sm:p-8 rounded-2xl text-center border transition-all ${
              isDragging
                ? 'bg-[#F0F9FF] border-[#0284C7]'
                : hasSelectedSource
                ? 'bg-[#F8FAFC] border-[#E2E8F0]'
                : 'bg-[#F8FAFC] border-[#E2E8F0]'
            }`}
          >
            {hasSelectedSource ? (
              /* Selected Source Card */
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#CBD5E1] shadow-xs text-left">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold uppercase mb-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Đã gắn tài liệu nguồn</span>
                    </div>
                    <h2 className="text-sm font-bold text-[#0F172A] truncate">
                      {currentSourceDisplayName}
                    </h2>
                    <p className="text-xs text-[#64748B] mt-0.5">{currentSourceMetaText}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleClearSelectedSource}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#FEE2E2] hover:border-[#FCA5A5] hover:text-[#DC2626] text-xs font-semibold text-[#64748B] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Gỡ tệp</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Empty Drag & Drop Prompt */
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center mx-auto">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-[#0F172A]">
                    Kéo thả tài liệu bài giảng (.PDF, .TXT, .DOC, .DOCX) vào đây
                  </h2>
                  <p className="text-xs text-[#64748B] mt-1">
                    Hoặc bấm nút bên dưới để chọn tệp từ máy tính của bạn
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2.5 rounded-xl bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-xs font-bold text-[#0F172A] transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-2"
                  >
                    <FileQuestion className="w-4 h-4 text-[#0284C7]" />
                    <span>Duyệt tệp từ thiết bị</span>
                  </button>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {/* Library Picker Option */}
          {!selectedFile && (
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <label className="text-xs font-bold text-[#475569] uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-[#0284C7]" />
                <span>Hoặc chọn nhanh từ tài liệu có sẵn trong thư viện:</span>
              </label>

              <select
                value={selectedDocId}
                onChange={(e) => handleSelectLibraryDoc(e.target.value)}
                className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#0F172A] outline-none focus:border-[#0284C7] cursor-pointer"
              >
                <option value="">-- Bấm để chọn một tài liệu trong thư viện --</option>
                {documents.map((doc) => {
                  const pageCount = Array.isArray(doc.pages) ? doc.pages.length : doc.pages || 10;
                  return (
                    <option key={doc.id} value={doc.id}>
                      {doc.title} ({doc.subject} • {pageCount} trang)
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Quiz Configuration Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#F1F5F9]">
            {/* Number of Questions */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#0F172A]">
                1. Số lượng câu hỏi trắc nghiệm
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[5, 10, 15].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setQuestionCount(count)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      questionCount === count
                        ? 'border-[#0284C7] bg-[#F0F9FF] text-[#0284C7] shadow-2xs'
                        : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {count} câu
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Level */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#0F172A]">
                2. Độ khó đề thi
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'easy', label: 'Cơ bản' },
                  { key: 'medium', label: 'Tổng hợp' },
                  { key: 'hard', label: 'Nâng cao' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setDifficulty(item.key as 'easy' | 'medium' | 'hard')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      difficulty === item.key
                        ? 'border-[#0284C7] bg-[#F0F9FF] text-[#0284C7] shadow-2xs'
                        : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Trigger - ENFORCED VALIDATION */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              disabled={!hasSelectedSource || isGenerating}
              onClick={handleGenerateQuiz}
              className={`w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-md ${
                hasSelectedSource
                  ? 'bg-gradient-to-r from-[#0284C7] to-[#0369A1] hover:from-[#0369A1] hover:to-[#075985] text-white hover:shadow-lg cursor-pointer transform hover:-translate-y-0.5'
                  : 'bg-[#F1F5F9] border border-[#E2E8F0] text-[#94A3B8] opacity-60 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGenerating ? 'Đang tạo đề thi...' : 'Tạo Đề Thi Trắc Nghiệm Ngay'}</span>
            </button>

            {/* Mandatory Requirement Note */}
            {!hasSelectedSource && (
              <p className="text-center text-xs text-[#DC2626] font-semibold italic">
                * Bắt buộc phải đính kèm tệp tài liệu hoặc chọn 1 tài liệu từ thư viện để mở khóa tạo đề thi trắc nghiệm.
              </p>
            )}
          </div>
        </div>

        {/* Bottom Section: Quiz History */}
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <div className="flex items-center gap-2.5">
              <History className="w-5 h-5 text-[#0284C7]" />
              <h2 className="text-base sm:text-lg font-black text-[#0F172A]">
                Lịch Sử Ôn Luyện Trắc Nghiệm
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#E2E8F0] text-[#0F172A] text-xs font-bold">
                {historyList.length} lượt thi
              </span>
            </div>

            {historyList.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllHistory}
                className="text-xs font-semibold text-[#64748B] hover:text-[#DC2626] transition-colors cursor-pointer"
              >
                Xóa toàn bộ lịch sử
              </button>
            )}
          </div>

          {historyList.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-[#E2E8F0] text-[#94A3B8] space-y-2">
              <Clock className="w-8 h-8 mx-auto text-[#CBD5E1]" />
              <p className="text-sm font-semibold">Chưa có lượt thi trắc nghiệm nào được ghi lại.</p>
              <p className="text-xs text-[#94A3B8]">
                Khi bạn hoàn thành một đề thi, bảng điểm và bài làm sẽ được lưu tự động tại đây.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {historyList.map((item) => {
                const isHigh = item.scorePercent >= 80;
                const isMedium = item.scorePercent >= 50 && item.scorePercent < 80;

                return (
                  <div
                    key={item.id}
                    className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs hover:border-[#BAE6FD] hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                            isHigh
                              ? 'bg-[#DCFCE7] text-[#15803D]'
                              : isMedium
                              ? 'bg-[#FEF9C3] text-[#A16207]'
                              : 'bg-[#FEE2E2] text-[#B91C1C]'
                          }`}
                        >
                          {item.correctCount}/{item.questionCount} câu đúng ({item.scorePercent}%)
                        </span>

                        <span className="text-[11px] text-[#94A3B8] font-medium">
                          {item.createdAt}
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-[#0F172A] leading-snug line-clamp-1">
                        {item.title}
                      </h3>

                      <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                        <FileText className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
                        <span className="truncate">{item.sourceDocName}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9]">
                      <button
                        type="button"
                        onClick={() => handleRetakeFromHistory(item)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0284C7] hover:text-[#0369A1] transition-colors cursor-pointer"
                      >
                        <span>Làm lại đề này</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteHistoryItem(item.id)}
                        className="p-1 text-[#CBD5E1] hover:text-[#DC2626] transition-colors cursor-pointer"
                        title="Xóa mục này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Fullscreen Anti-Spam Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#E2E8F0] text-center space-y-6">
            <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-[#E0F2FE] animate-ping opacity-60" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0284C7] to-[#0369A1] text-white flex items-center justify-center shadow-lg">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-black text-[#0F172A]">
                AI Đang Phân Tích & Biên Soạn Đề Thi
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Hệ thống đang trích xuất bài giảng và sử dụng OpenAI GPT-4o-mini để soạn thảo {questionCount} câu hỏi mức độ{' '}
                <span className="font-bold text-[#0284C7]">
                  {difficulty === 'easy' ? 'Cơ bản' : difficulty === 'medium' ? 'Tổng hợp' : 'Nâng cao'}
                </span>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5 text-left">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0F172A]">
                <Clock className="w-4 h-4 text-[#0284C7] shrink-0" />
                <span>Ước tính thời gian: 15 - 30 giây</span>
              </div>
              <p className="text-[11px] text-[#64748B] leading-normal pl-6">
                Vui lòng giữ nguyên cửa sổ và không làm mới trang trong khi AI xử lý để tránh gián đoạn tiến trình.
              </p>
            </div>

            <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#0284C7] h-full w-2/3 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
