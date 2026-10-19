import { useState, useMemo } from 'react';
import { MainLayout } from '../../components/layout';
import {
    Sparkles,
    FileQuestion,
    Download,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Award,
    HelpCircle,
    BookOpen,
    Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { documents, type DocumentItem } from '../../data/documents';
import { generateQuizForDocument, exportQuizToText, type QuizQuestion } from '../../lib/quiz';
import { Button } from '../../components/ui';

export function QuizPage() {
    const [selectedDocId, setSelectedDocId] = useState<string>(documents[0].id);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<'practice' | 'preview'>('practice');

    const selectedDoc = useMemo(() => {
        return documents.find((d) => d.id === selectedDocId) || documents[0];
    }, [selectedDocId]);

    const handleGenerateQuiz = (doc: DocumentItem) => {
        const generated = generateQuizForDocument(doc);
        setQuestions(generated);
        setUserAnswers({});
        setIsSubmitted(false);
        toast.success(`Đã tạo bộ ${generated.length} câu hỏi quiz từ tài liệu!`, {
            description: doc.title,
        });
    };

    const handleSelectOption = (questionId: string, optionIndex: number) => {
        if (isSubmitted) return; // Prevent changing after submission
        setUserAnswers((prev) => ({
            ...prev,
            [questionId]: optionIndex,
        }));
    };

    const handleSubmitQuiz = () => {
        const answeredCount = Object.keys(userAnswers).length;
        if (answeredCount < questions.length) {
            toast.warning(`Bạn chưa trả lời hết các câu hỏi!`, {
                description: `Đã làm ${answeredCount}/${questions.length} câu. Bạn vẫn có thể nộp bài để xem điểm.`,
            });
        }
        setIsSubmitted(true);
        toast.success('Đã nộp bài quiz thành công!');
    };

    const handleResetQuiz = () => {
        setUserAnswers({});
        setIsSubmitted(false);
        toast.info('Đã làm lại bài quiz!');
    };

    const score = useMemo(() => {
        if (!questions.length) return { correct: 0, total: 0, percent: 0 };
        let correct = 0;
        questions.forEach((q) => {
            if (userAnswers[q.id] === q.correctAnswerIndex) {
                correct += 1;
            }
        });
        const percent = Math.round((correct / questions.length) * 100);
        return { correct, total: questions.length, percent };
    }, [questions, userAnswers]);

    const downloadTxtUrl = useMemo(() => {
        if (!questions.length) return '';
        const textContent = exportQuizToText(selectedDoc, questions);
        if (typeof URL.createObjectURL === 'function') {
            return URL.createObjectURL(new Blob([textContent], { type: 'text/plain;charset=utf-8' }));
        }
        return '#';
    }, [selectedDoc, questions]);

    return (
        <MainLayout>
            <div className="max-w-[1100px] mx-auto space-y-6 pb-12 w-full min-w-0">
                {/* Header Banner - Solid elegant styling matching app theme */}
                <div className="bg-[#f8fafc] rounded-2xl border border-[#e2e8f0] p-4 sm:p-8 shadow-xs w-full min-w-0 overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2 max-w-2xl min-w-0">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e0f2fe] text-[#0284c7] text-xs font-semibold">
                                <Sparkles className="w-3.5 h-3.5 text-[#0284c7]" />
                                <span>BỘ CÔNG CỤ ÔN TẬP THÔNG MINH</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#0f172a] tracking-tight">
                                Tạo Quiz & Luyện Tập Trắc Nghiệm
                            </h1>
                            <p className="text-xs sm:text-sm text-[#64748b] leading-relaxed">
                                Tự động trích xuất các ý chính, công thức và tạo câu hỏi trắc nghiệm giúp bạn củng cố kiến
                                thức nhanh chóng trước kỳ thi.
                            </p>
                        </div>

                        {/* Quick Stats Pill */}
                        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#e2e8f0] shadow-xs text-center flex items-center justify-around gap-4 sm:gap-6 shrink-0 w-full sm:w-auto">
                            <div>
                                <div className="text-xl font-black text-[#0f172a]">{documents.length}</div>
                                <div className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold">Tài liệu mẫu</div>
                            </div>
                            <div className="w-px h-8 bg-[#e2e8f0]" />
                            <div>
                                <div className="text-xl font-black text-[#0284c7]">100%</div>
                                <div className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold">Miễn phí</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Document Selector & Quiz Creator Panel */}
                <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#e2e8f0] shadow-xs space-y-4 w-full min-w-0 overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e2e8f0] pb-4">
                        <div>
                            <h2 className="text-base font-bold text-[#0f172a] flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-[#0284c7]" />
                                <span>Bước 1: Chọn tài liệu nguồn để tạo quiz</span>
                            </h2>
                            <p className="text-xs text-[#64748b] mt-0.5">
                                Chọn tài liệu trong thư viện bài học để hệ thống tự động sinh bộ câu hỏi ôn tập
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center w-full min-w-0">
                        <div className="md:col-span-8 space-y-1 w-full min-w-0">
                            <label htmlFor="quiz-doc-select" className="block text-xs font-semibold text-[#0f172a]">
                                Danh sách tài liệu có sẵn
                            </label>
                            <select
                                id="quiz-doc-select"
                                value={selectedDocId}
                                onChange={(e) => {
                                    setSelectedDocId(e.target.value);
                                    setQuestions([]);
                                    setUserAnswers({});
                                    setIsSubmitted(false);
                                }}
                                className="w-full max-w-full h-11 px-3.5 bg-[#f8fafc] border-2 border-[#cbd5e1] focus:border-[#0284c7] focus:bg-white rounded-xl text-xs font-semibold text-[#0f172a] outline-none transition-all cursor-pointer truncate"
                            >
                                {documents.map((doc) => {
                                    const pageCount = Array.isArray(doc.pages) ? doc.pages.length : (doc.pages ?? 1);
                                    return (
                                        <option key={doc.id} value={doc.id}>
                                            [{doc.category}] {doc.title} ({pageCount} trang)
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <div className="md:col-span-4 flex items-end w-full min-w-0">
                            <Button
                                type="button"
                                variant="primary"
                                onClick={() => handleGenerateQuiz(selectedDoc)}
                                className="w-full h-11 text-xs !bg-[#0284c7] hover:!bg-[#0369a1] text-white font-semibold rounded-xl"
                                icon={<Sparkles className="w-4 h-4" />}
                            >
                                {questions.length > 0 ? 'Tạo lại câu hỏi' : 'Tạo Quiz Ngay'}
                            </Button>
                        </div>
                    </div>

                    {/* Selected Document Summary Card */}
                    {selectedDoc && (
                        <div className="p-3.5 sm:p-4 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs w-full min-w-0">
                            <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                                <div className="w-10 h-10 rounded-lg bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center shrink-0 font-bold">
                                    <FileQuestion className="w-5 h-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <strong className="text-sm font-bold text-[#0f172a] block truncate">
                                        {selectedDoc.title}
                                    </strong>
                                    <span className="text-[#64748b] block truncate text-[11px] sm:text-xs">
                                        Tác giả: {selectedDoc.author.name} • {Array.isArray(selectedDoc.pages) ? selectedDoc.pages.length : (selectedDoc.pages ?? 1)} trang • Chuyên mục: {selectedDoc.category}
                                    </span>
                                </div>
                            </div>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-semibold rounded-full border border-emerald-200 text-[11px] shrink-0 self-start sm:self-auto">
                                Sẵn sàng tạo quiz
                            </span>
                        </div>
                    )}
                </div>

                {/* QUIZ SECTION (Only displayed when questions exist) */}
                {questions.length > 0 && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Tab Switcher & Result Header */}
                        <div className="bg-white p-4 rounded-2xl border border-[#e2e8f0] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('practice')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        activeTab === 'practice'
                                            ? 'bg-[#0284c7] text-white shadow-xs'
                                            : 'bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0] hover:text-[#0f172a]'
                                    }`}
                                >
                                    Luyện Tập Trực Tiếp
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('preview')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        activeTab === 'preview'
                                            ? 'bg-[#0284c7] text-white shadow-xs'
                                            : 'bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0] hover:text-[#0f172a]'
                                    }`}
                                >
                                    Xem Đáp Án & Tải Về
                                </button>
                            </div>

                            <a
                                href={downloadTxtUrl}
                                download={`quiz-${selectedDoc.id}.txt`}
                                className="w-full sm:w-auto justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
                            >
                                <Download className="w-4 h-4" />
                                <span>Tải bộ câu hỏi (.txt)</span>
                            </a>
                        </div>

                        {/* PRACTICE MODE */}
                        {activeTab === 'practice' && (
                            <div className="space-y-6">
                                {/* Score Result Summary Banner when submitted */}
                                {isSubmitted && (
                                    <div
                                        className={`p-6 rounded-2xl border-2 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md transition-all ${
                                            score.percent >= 80
                                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                                : score.percent >= 50
                                                ? 'bg-amber-50 border-amber-300 text-amber-900'
                                                : 'bg-rose-50 border-rose-300 text-rose-900'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4 text-center sm:text-left">
                                            <div
                                                className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-xl border-4 shrink-0 ${
                                                    score.percent >= 80
                                                        ? 'bg-emerald-500 text-white border-emerald-200'
                                                        : score.percent >= 50
                                                        ? 'bg-amber-500 text-white border-amber-200'
                                                        : 'bg-rose-500 text-white border-rose-200'
                                                }`}
                                            >
                                                {score.percent}%
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-extrabold">
                                                    {score.percent >= 80
                                                        ? 'Xuất Sắc! Bạn Đã Nắm Rất Vững Kiến Thức!'
                                                        : score.percent >= 50
                                                        ? 'Khá Tốt! Cần Ôn Lại Một Số Ý Nhỏ.'
                                                        : 'Cần Cố Gắng Thêm! Hãy Đọc Lại Tài Liệu Nguồn.'}
                                                </h3>
                                                <p className="text-xs opacity-90 mt-1">
                                                    Kết quả: Trả lời đúng <strong>{score.correct}/{score.total}</strong> câu hỏi.
                                                </p>
                                            </div>
                                        </div>

                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={handleResetQuiz}
                                            icon={<RotateCcw className="w-4 h-4" />}
                                            className="!bg-white text-xs shadow-xs"
                                        >
                                            Làm lại quiz
                                        </Button>
                                    </div>
                                )}

                                {/* Question Cards List */}
                                <div className="space-y-4">
                                    {questions.map((q, qIndex) => {
                                        const selectedOption = userAnswers[q.id];
                                        const isCorrect = isSubmitted && selectedOption === q.correctAnswerIndex;
                                        const isWrong = isSubmitted && selectedOption !== undefined && selectedOption !== q.correctAnswerIndex;

                                        return (
                                            <div
                                                key={q.id}
                                                className={`bg-white p-5 sm:p-6 rounded-2xl border transition-all space-y-4 shadow-xs ${
                                                    isSubmitted
                                                        ? isCorrect
                                                            ? 'border-emerald-300 bg-emerald-50/30 ring-2 ring-emerald-400/20'
                                                            : isWrong
                                                            ? 'border-rose-300 bg-rose-50/30 ring-2 ring-rose-400/20'
                                                            : 'border-[#e2e8f0]'
                                                        : 'border-[#e2e8f0] hover:border-[#0284c7]/50'
                                                }`}
                                            >
                                                {/* Question Header */}
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="space-y-1">
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#e0f2fe] text-[#0284c7] text-[11px] font-extrabold">
                                                             Câu {qIndex + 1}
                                                        </span>
                                                        <h3 className="text-sm font-bold text-[#0f172a] leading-snug">
                                                            {q.question}
                                                        </h3>
                                                    </div>

                                                    {isSubmitted && (
                                                        <div className="shrink-0">
                                                            {isCorrect && (
                                                                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-100 px-2.5 py-1 rounded-lg">
                                                                    <CheckCircle2 className="w-4 h-4" /> Chính xác
                                                                </span>
                                                            )}
                                                            {isWrong && (
                                                                <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-xs bg-rose-100 px-2.5 py-1 rounded-lg">
                                                                    <XCircle className="w-4 h-4" /> Chưa đúng
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Options List */}
                                                <div className="grid grid-cols-1 gap-2.5 pt-1">
                                                    {q.options.map((optionText, optIndex) => {
                                                        const letter = String.fromCharCode(65 + optIndex);
                                                        const isSelected = selectedOption === optIndex;
                                                        const isCorrectOption = isSubmitted && optIndex === q.correctAnswerIndex;
                                                        const isWrongSelected = isSubmitted && isSelected && !isCorrectOption;

                                                        let optionStyle = 'bg-white border-[#cbd5e1] text-[#0f172a] hover:border-[#0284c7] hover:bg-[#f0f9ff]';
                                                        if (isSelected && !isSubmitted) {
                                                            optionStyle = 'bg-[#0284c7] border-[#0284c7] text-white font-semibold shadow-xs';
                                                        }
                                                        if (isSubmitted) {
                                                            if (isCorrectOption) {
                                                                optionStyle = 'bg-emerald-600 border-emerald-600 text-white font-semibold shadow-xs';
                                                            } else if (isWrongSelected) {
                                                                optionStyle = 'bg-rose-600 border-rose-600 text-white font-semibold shadow-xs';
                                                            } else {
                                                                optionStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                                                            }
                                                        }

                                                        return (
                                                            <button
                                                                key={optIndex}
                                                                type="button"
                                                                disabled={isSubmitted}
                                                                onClick={() => handleSelectOption(q.id, optIndex)}
                                                                className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-start justify-between gap-3 text-xs cursor-pointer ${optionStyle}`}
                                                            >
                                                                <div className="flex items-start gap-3">
                                                                    <span
                                                                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5 ${
                                                                            isSelected || (isSubmitted && isCorrectOption)
                                                                                ? 'bg-white/20 text-current'
                                                                                : 'bg-slate-100 text-slate-600'
                                                                        }`}
                                                                    >
                                                                        {letter}
                                                                    </span>
                                                                    <span className="leading-relaxed">{optionText}</span>
                                                                </div>

                                                                {isSubmitted && isCorrectOption && (
                                                                    <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {/* Explanation Box (Visible after submission) */}
                                                {isSubmitted && (
                                                    <div className="p-3.5 sm:p-4 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] text-xs space-y-1 text-[#334155]">
                                                        <div className="flex items-center gap-1.5 font-bold text-[#0284c7]">
                                                            <HelpCircle className="w-3.5 h-3.5" />
                                                            <span>Giải thích đáp án:</span>
                                                        </div>
                                                        <p className="leading-relaxed">{q.explanation}</p>
                                                        <span className="text-[11px] text-[#64748b] block pt-1">
                                                            Nguồn: {q.sourceSection}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Bottom Action Bar */}
                                {!isSubmitted && (
                                    <div className="flex justify-end pt-2">
                                        <Button
                                            type="button"
                                            variant="primary"
                                            onClick={handleSubmitQuiz}
                                            icon={<CheckCircle2 className="w-4 h-4" />}
                                            className="w-full sm:w-auto px-8 h-11 text-xs font-bold shadow-xs !bg-[#0284c7] hover:!bg-[#0369a1] text-white rounded-xl"
                                        >
                                            Nộp bài & Xem điểm
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* PREVIEW & STUDY SHEET MODE */}
                        {activeTab === 'preview' && (
                            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#e2e8f0] shadow-xs space-y-6">
                                <div className="border-b border-[#e2e8f0] pb-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-base font-bold text-[#0f172a]">
                                            Bộ câu hỏi ôn tập: {selectedDoc.title}
                                        </h3>
                                        <p className="text-xs text-[#64748b] mt-0.5">
                                            Đáp án đã được đánh dấu sẵn để bạn in hoặc lưu thành file ôn tập offline.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {questions.map((q, idx) => (
                                        <div key={q.id} className="p-4 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] space-y-3">
                                            <div className="flex items-start gap-2">
                                                <span className="font-bold text-[#0284c7] text-xs">Câu {idx + 1}:</span>
                                                <h4 className="text-xs font-bold text-[#0f172a]">{q.question}</h4>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6">
                                                {q.options.map((opt, optIdx) => {
                                                    const isAnswer = optIdx === q.correctAnswerIndex;
                                                    return (
                                                        <div
                                                            key={optIdx}
                                                            className={`p-2.5 rounded-lg text-xs border ${
                                                                isAnswer
                                                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                                                    : 'bg-white border-slate-200 text-slate-600'
                                                            }`}
                                                        >
                                                            {String.fromCharCode(65 + optIdx)}. {opt} {isAnswer && <Check className="w-3.5 h-3.5 inline ml-1.5 text-emerald-600" />}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="pl-6 text-[11px] text-[#64748b] italic">
                                                * {q.explanation} ({q.sourceSection})
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Honest Note */}
                <div className="p-4 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] text-xs text-[#475569] flex items-start gap-3 w-full min-w-0">
                    <Award className="w-5 h-5 text-[#0284c7] shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                        <strong className="font-bold text-[#0f172a]">Ghi chú tính năng Quiz AI:</strong>
                        <p className="text-[11px] mt-0.5 leading-relaxed text-[#64748b] break-words">
                            Quiz được sinh tự động từ nội dung gạch đầu dòng, thuật toán và công thức của các tài liệu học
                            thuật chuẩn. Bạn có thể nộp bài trực tiếp trên trình duyệt hoặc xuất bộ câu hỏi dạng file `.txt` để
                            ôn tập offline.
                        </p>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
