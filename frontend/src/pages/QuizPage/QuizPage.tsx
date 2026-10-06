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
    FileText,
    Share2,
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
            <div className="max-w-[1100px] mx-auto space-y-6 pb-12">
                {/* Header Banner */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#14213d] via-[#1f3a5f] to-[#3d5a80] p-6 sm:p-8 text-white shadow-lg">
                    <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#315dff]/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute left-1/3 -top-10 w-48 h-48 bg-[#ee964b]/20 rounded-full blur-2xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2 max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#ee964b] text-xs font-semibold backdrop-blur-md border border-white/10">
                                <Sparkles className="w-3.5 h-3.5 text-[#ee964b]" />
                                <span>BỘ CÔNG CỤ ÔN TẬP THÔNG MINH</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                Tạo Quiz & Luyện Tập Trắc Nghiệm
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                Tự động trích xuất các ý chính, công thức và tạo câu hỏi trắc nghiệm giúp bạn củng cố kiến
                                thức nhanh chóng trước kỳ thi.
                            </p>
                        </div>

                        {/* Quick Stats Pill */}
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-center flex items-center justify-around gap-6 shrink-0">
                            <div>
                                <div className="text-xl font-black text-white">{documents.length}</div>
                                <div className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">Tài liệu mẫu</div>
                            </div>
                            <div className="w-px h-8 bg-white/20" />
                            <div>
                                <div className="text-xl font-black text-[#ee964b]">100%</div>
                                <div className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">Miễn phí</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Document Selector & Quiz Creator Panel */}
                <div className="bg-white p-6 rounded-2xl border border-[#d8deea] shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#d8deea] pb-4">
                        <div>
                            <h2 className="text-base font-bold text-[#121827] flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-[#315dff]" />
                                <span>Bước 1: Chọn tài liệu nguồn để tạo quiz</span>
                            </h2>
                            <p className="text-xs text-[#5f6878] mt-0.5">
                                Chọn tài liệu trong thư viện bài học để hệ thống tự động sinh bộ câu hỏi ôn tập
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        <div className="md:col-span-8 space-y-1">
                            <label htmlFor="quiz-doc-select" className="block text-xs font-semibold text-[#121827]">
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
                                className="w-full h-11 px-3.5 bg-[#f8faff] border-2 border-[#d8deea] focus:border-[#315dff] focus:bg-white rounded-xl text-xs font-semibold text-[#121827] outline-none transition-all cursor-pointer"
                            >
                                {documents.map((doc) => (
                                    <option key={doc.id} value={doc.id}>
                                        [{doc.category}] {doc.title} ({doc.pages} trang)
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-4 flex items-end">
                            <Button
                                type="button"
                                variant="primary"
                                onClick={() => handleGenerateQuiz(selectedDoc)}
                                className="w-full h-11 shadow-md hover:shadow-lg text-xs"
                                icon={<Sparkles className="w-4 h-4" />}
                            >
                                {questions.length > 0 ? 'Tạo lại câu hỏi' : 'Tạo Quiz Ngay'}
                            </Button>
                        </div>
                    </div>

                    {/* Selected Document Summary Card */}
                    {selectedDoc && (
                        <div className="p-4 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[#315dff]/10 text-[#315dff] flex items-center justify-center shrink-0 font-bold">
                                    <FileQuestion className="w-5 h-5" />
                                </div>
                                <div>
                                    <strong className="text-sm font-bold text-[#121827] block truncate max-w-md">
                                        {selectedDoc.title}
                                    </strong>
                                    <span className="text-[#5f6878]">
                                        Tác giả: {selectedDoc.author.name} • {selectedDoc.pages} trang • Chuyên mục: {selectedDoc.category}
                                    </span>
                                </div>
                            </div>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-semibold rounded-full border border-emerald-200 text-[11px] shrink-0">
                                Sẵn sàng tạo quiz
                            </span>
                        </div>
                    )}
                </div>

                {/* QUIZ SECTION (Only displayed when questions exist) */}
                {questions.length > 0 && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Tab Switcher & Result Header */}
                        <div className="bg-white p-4 rounded-2xl border border-[#d8deea] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('practice')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        activeTab === 'practice'
                                            ? 'bg-[#315dff] text-white shadow-sm'
                                            : 'bg-[#f0f4ff] text-[#5f6878] hover:text-[#121827]'
                                    }`}
                                >
                                    Luyện Tập Trực Tiếp
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('preview')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        activeTab === 'preview'
                                            ? 'bg-[#315dff] text-white shadow-sm'
                                            : 'bg-[#f0f4ff] text-[#5f6878] hover:text-[#121827]'
                                    }`}
                                >
                                    Xem Đáp Án & Tải Về
                                </button>
                            </div>

                            <a
                                href={downloadTxtUrl}
                                download={`quiz-${selectedDoc.id}.txt`}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
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
                                                className={`bg-white p-6 rounded-2xl border transition-all space-y-4 shadow-xs ${
                                                    isSubmitted
                                                        ? isCorrect
                                                            ? 'border-emerald-300 bg-emerald-50/30 ring-2 ring-emerald-400/20'
                                                            : isWrong
                                                            ? 'border-rose-300 bg-rose-50/30 ring-2 ring-rose-400/20'
                                                            : 'border-[#d8deea]'
                                                        : 'border-[#d8deea] hover:border-[#315dff]/50'
                                                }`}
                                            >
                                                {/* Question Header */}
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="space-y-1">
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#f0f4ff] text-[#315dff] text-[11px] font-extrabold">
                                                            Câu {qIndex + 1}
                                                        </span>
                                                        <h3 className="text-sm font-bold text-[#121827] leading-snug">
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

                                                        let optionStyle = 'bg-white border-[#d8deea] text-[#121827] hover:border-[#315dff] hover:bg-[#f0f6ff]';
                                                        if (isSelected && !isSubmitted) {
                                                            optionStyle = 'bg-[#315dff] border-[#315dff] text-white font-semibold shadow-xs';
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
                                                                className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-center justify-between text-xs cursor-pointer ${optionStyle}`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <span
                                                                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0 ${
                                                                            isSelected || (isSubmitted && isCorrectOption)
                                                                                ? 'bg-white/20 text-current'
                                                                                : 'bg-slate-100 text-slate-600'
                                                                        }`}
                                                                    >
                                                                        {letter}
                                                                    </span>
                                                                    <span>{optionText}</span>
                                                                </div>

                                                                {isSubmitted && isCorrectOption && (
                                                                    <Check className="w-4 h-4 text-white shrink-0" />
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {/* Explanation Box (Visible after submission) */}
                                                {isSubmitted && (
                                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 text-slate-700">
                                                        <div className="flex items-center gap-1.5 font-bold text-[#315dff]">
                                                            <HelpCircle className="w-3.5 h-3.5" />
                                                            <span>Giải thích đáp án:</span>
                                                        </div>
                                                        <p className="leading-relaxed">{q.explanation}</p>
                                                        <span className="text-[11px] text-slate-400 block pt-1">
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
                                            className="px-8 h-11 text-xs font-bold shadow-md"
                                        >
                                            Nộp bài & Xem điểm
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* PREVIEW & STUDY SHEET MODE */}
                        {activeTab === 'preview' && (
                            <div className="bg-white p-6 rounded-2xl border border-[#d8deea] shadow-xs space-y-6">
                                <div className="border-b border-[#d8deea] pb-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-base font-bold text-[#121827]">
                                            Bộ câu hỏi ôn tập: {selectedDoc.title}
                                        </h3>
                                        <p className="text-xs text-[#5f6878] mt-0.5">
                                            Đáp án đã được đánh dấu sẵn để bạn in hoặc lưu thành file ôn tập offline.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {questions.map((q, idx) => (
                                        <div key={q.id} className="p-4 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] space-y-3">
                                            <div className="flex items-start gap-2">
                                                <span className="font-bold text-[#315dff] text-xs">Câu {idx + 1}:</span>
                                                <h4 className="text-xs font-bold text-[#121827]">{q.question}</h4>
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
                                                            {String.fromCharCode(65 + optIdx)}. {opt} {isAnswer && '✓'}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="pl-6 text-[11px] text-[#5f6878] italic">
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
                <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
                    <Award className="w-5 h-5 text-[#315dff] shrink-0 mt-0.5" />
                    <div>
                        <strong className="font-bold text-[#121827]">Ghi chú tính năng Quiz AI:</strong>
                        <p className="text-[11px] mt-0.5 leading-relaxed">
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
