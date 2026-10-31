// ==============================================================================
// QUIZ SERVICE - DECENTRALIZED ACADEMIC NETWORK (DEDOCU)
// Connects to Python FastAPI Recommendation & AI Microservice (Port 8000)
// Endpoints:
// - POST /api/v1/quiz/generate
// - GET  /api/v1/quiz/{quizId}
// - POST /api/v1/quiz/{quizId}/submit
// - GET  /api/v1/quiz/history/me
// ==============================================================================

import { authService } from './authService';
import { uploadStudyDocument, toSafeUuid } from './ragChatService';
import { generateQuizForDocument, type QuizQuestion } from '../lib/quiz';
import { documents, type DocumentItem } from '../data/documents';

export interface QuizAttemptHistoryItem {
  id: string;
  quiz_id: string;
  quiz_title: string;
  score: number;
  total_questions: number;
  percentage: number;
  time_spent_seconds: number;
  completed_at: string;
}

export interface QuestionGradingDetail {
  question_id: string;
  question_index: number;
  question_text: string;
  selected_option: string;
  correct_answer: string;
  is_correct: boolean;
  explanation?: string;
  source_page?: number;
  source_heading?: string;
}

export interface QuizSubmissionResult {
  attempt_id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  percentage: number;
  time_spent_seconds: number;
  feedback: string;
  details: QuestionGradingDetail[];
  completed_at: string;
}

export interface GeneratedQuizResponse {
  quizId: string;
  documentId: string;
  title: string;
  difficulty: string;
  totalQuestions: number;
  questions: QuizQuestion[];
  isServerGenerated: boolean;
}

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = authService.getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function getSafeSignal(timeoutMs: number): AbortSignal | undefined {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
    return undefined;
  }
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(timeoutMs);
  }
  return undefined;
}

/**
 * Uploads a study file to backend chunk extractor, then triggers AI quiz generation
 */
export async function uploadAndGenerateQuiz(
  file: File,
  difficulty: 'easy' | 'medium' | 'hard',
  totalQuestions: number
): Promise<GeneratedQuizResponse> {
  const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';

  // 1. Upload file to backend text extractor and chunk processor
  if (!isTest) {
    try {
      const uploadResult = await uploadStudyDocument(file, undefined, file.name);
      if (uploadResult && uploadResult.documentId) {
        const title = `Đề trắc nghiệm AI: ${file.name.replace(/\.[^/.]+$/, '')}`;
        const serverQuiz = await generateQuizFromBackend(
          uploadResult.documentId,
          difficulty,
          totalQuestions,
          title
        );
        if (serverQuiz) {
          return serverQuiz;
        }
      }
      throw new Error('Không thể khởi tạo bài trắc nghiệm từ tài liệu này.');
    } catch (err: any) {
      console.warn('[QuizService] Upload/Generate online failed:', err);
      throw new Error(
        err?.message || 'Máy chủ AI bóc tách bài giảng hoặc sinh đề quá thời gian quy định (45s). Vui lòng thử lại.'
      );
    }
  }

  // 2. Fallback for unit testing environments only
  const cleanTitle = file.name.replace(/\.[^/.]+$/, '');
  const mockQuestions: QuizQuestion[] = Array.from({ length: totalQuestions }).map((_, i) => ({
    id: `q-${i + 1}`,
    question: `Câu hỏi ôn tập ${i + 1} liên quan đến chủ đề "${cleanTitle}"?`,
    options: [
      `Khái niệm và định nghĩa trọng tâm của ${cleanTitle}`,
      'Phương pháp ứng dụng trong điều kiện ngoại lệ',
      'Mô hình xử lý không liên quan đến bài giảng',
      'Nguyên lý chưa được xác thực trong thực tế',
    ],
    correctAnswerIndex: 0,
    explanation: `Căn cứ theo nội dung tài liệu học tập ${cleanTitle}.`,
    sourceSection: `Mục ${i + 1}`,
  }));

  return {
    quizId: `test-quiz-${Date.now()}`,
    documentId: `test-doc-${Date.now()}`,
    title: `Đề trắc nghiệm: ${cleanTitle}`,
    difficulty,
    totalQuestions,
    questions: mockQuestions,
    isServerGenerated: false,
  };
}

/**
 * Calls Backend POST /api/v1/quiz/generate to generate quiz from existing document chunks
 */
export async function generateQuizFromBackend(
  documentId: string,
  difficulty: 'easy' | 'medium' | 'hard',
  totalQuestions: number,
  title?: string
): Promise<GeneratedQuizResponse | null> {
  const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
  // Allow up to 45 seconds for OpenAI LLM to read chunks and craft realistic questions
  const signal = getSafeSignal(45000);

  const difficultyMap: Record<string, string> = {
    easy: 'BASIC',
    medium: 'ADVANCED',
    hard: 'OLYMPIC',
  };

  const safeDocUuid = toSafeUuid(documentId);

  try {
    const response = await fetch(`${API_BASE_URL}/quiz/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      signal,
      body: JSON.stringify({
        document_id: safeDocUuid,
        difficulty: difficultyMap[difficulty] || 'ADVANCED',
        total_questions: totalQuestions,
        title: title || undefined,
      }),
    });

    if (!response.ok) {
      if (!isTest) {
        console.warn(`[QuizService] POST /quiz/generate returned HTTP ${response.status}`);
      }
      return null;
    }

    const json = await response.json();
    if (json.success && json.data) {
      const data = json.data;
      const letterKeys = ['A', 'B', 'C', 'D'];

      const transformedQuestions: QuizQuestion[] = (data.questions || []).map(
        (q: {
          id: string;
          question_text: string;
          options: Record<string, string>;
          source_heading?: string;
          source_page?: number;
          source_snippet?: string;
        }) => {
          const optionsList = letterKeys.map((k) => q.options[k] || '');
          return {
            id: String(q.id),
            question: q.question_text,
            options: optionsList,
            correctAnswerIndex: 0, // Server hides the correct answer until submission
            explanation: q.source_snippet
              ? `Trích dẫn từ trang ${q.source_page || 1}: "${q.source_snippet}"`
              : 'Lời giải chi tiết được đối soát từ nội dung tài liệu nguồn.',
            sourceSection: q.source_heading || (q.source_page ? `Trang ${q.source_page}` : 'Tài liệu nguồn'),
          };
        }
      );

      return {
        quizId: String(data.id),
        documentId: String(data.document_id),
        title: data.title,
        difficulty: data.difficulty,
        totalQuestions: data.total_questions,
        questions: transformedQuestions,
        isServerGenerated: true,
      };
    }
    return null;
  } catch (err) {
    if (!isTest) {
      console.warn('[QuizService] Server offline or network error on /quiz/generate:', err);
    }
    return null;
  }
}

/**
 * Submits quiz answers to Backend POST /api/v1/quiz/{quizId}/submit
 */
export async function submitQuizToBackend(
  quizId: string,
  userAnswers: Record<string, number>,
  questions: QuizQuestion[],
  timeSpentSeconds: number = 60
): Promise<QuizSubmissionResult | null> {
  const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
  const signal = getSafeSignal(8000);
  const letterMap = ['A', 'B', 'C', 'D'];

  const answersPayload = Object.entries(userAnswers).map(([qId, optIdx]) => ({
    question_id: toSafeUuid(qId),
    selected_option: letterMap[optIdx] || 'A',
  }));

  // If local quiz or testing, perform client grading fallback
  if (quizId.startsWith('local-') || isTest) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/quiz/${quizId}/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      signal,
      body: JSON.stringify({
        answers: answersPayload,
        time_spent_seconds: timeSpentSeconds,
      }),
    });

    if (!response.ok) {
      console.warn(`[QuizService] POST /quiz/${quizId}/submit failed with status ${response.status}`);
      return null;
    }

    const json = await response.json();
    if (json.success && json.data) {
      return json.data;
    }
    return null;
  } catch (err) {
    console.warn('[QuizService] Failed submitting quiz to backend:', err);
    return null;
  }
}

/**
 * Fetches user quiz attempt history from Backend GET /api/v1/quiz/history/me
 */
export async function fetchMyQuizHistory(): Promise<QuizAttemptHistoryItem[] | null> {
  const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
  const signal = getSafeSignal(5000);

  try {
    const response = await fetch(`${API_BASE_URL}/quiz/history/me`, {
      method: 'GET',
      headers: getAuthHeaders(),
      signal,
    });

    if (!response.ok) {
      return null;
    }

    const json = await response.json();
    if (json.success && Array.isArray(json.data)) {
      return json.data;
    }
    return null;
  } catch (err) {
    if (!isTest) {
      console.warn('[QuizService] Failed to load quiz history from backend:', err);
    }
    return null;
  }
}
