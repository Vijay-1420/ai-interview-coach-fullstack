import axios from 'axios';
import type {
  StartInterviewRequest,
  InterviewSessionResponse,
  AnswerRequest,
  FeedbackResponse,
  HistorySession,
  SessionResult,
  AnalyticsData,
  InterviewProgress,
  ChatInterview,
  ChatInterviewSummary,
  StartChatInterviewRequest,
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

interface ApiErrorBody {
  detail?: string | { msg?: string }[];
  error?: string;
}

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      const messages = detail.map((item) => item.msg).filter((message): message is string => Boolean(message));
      if (messages.length > 0) return messages.join('; ');
    }
    const message = error.response?.data?.error || error.message;
    return message || fallback;
  }

  return error instanceof Error && error.message ? error.message : fallback;
};

api.interceptors.response.use(
  (res) => res,
  (err) => {
    return Promise.reject(new Error(getApiErrorMessage(err, 'An unexpected error occurred')));
  }
);

export const interviewApi = {
  startInterview: async (data: StartInterviewRequest): Promise<InterviewSessionResponse> => {
    const res = await api.post('/interview/start', data);
    return res.data;
  },

  getQuestion: async (sessionId: number, questionNumber: number): Promise<{ id: number; question_text: string; question_number: number }> => {
    const res = await api.get(`/interview/${sessionId}/question/${questionNumber}`);
    return res.data;
  },

  getSession: async (sessionId: number): Promise<InterviewProgress> => {
    const res = await api.get(`/interview/${sessionId}`);
    return res.data;
  },

  abandonSession: async (sessionId: number): Promise<void> => {
    await api.delete(`/interview/${sessionId}`);
  },

  submitAnswer: async (data: AnswerRequest): Promise<FeedbackResponse> => {
    const res = await api.post('/interview/answer', data);
    return res.data;
  },

  getHistory: async (): Promise<HistorySession[]> => {
    const res = await api.get('/interview/history');
    return res.data;
  },

  getSessionResults: async (sessionId: number): Promise<SessionResult> => {
    const res = await api.get(`/interview/${sessionId}/results`);
    return res.data;
  },

  getAnalytics: async (): Promise<AnalyticsData> => {
    const res = await api.get('/interview/analytics');
    return res.data;
  },

  startChatInterview: async (data: StartChatInterviewRequest): Promise<ChatInterview> => {
    const res = await api.post('/chat/interviews', data);
    return res.data;
  },

  getChatInterviews: async (): Promise<ChatInterviewSummary[]> => {
    const res = await api.get('/chat/interviews');
    return res.data;
  },

  getChatInterview: async (sessionId: number): Promise<ChatInterview> => {
    const res = await api.get(`/chat/interviews/${sessionId}`);
    return res.data;
  },

  sendChatMessage: async (sessionId: number, content: string): Promise<ChatInterview> => {
    const res = await api.post(`/chat/interviews/${sessionId}/messages`, { content });
    return res.data;
  },

  completeChatInterview: async (sessionId: number): Promise<ChatInterview> => {
    const res = await api.post(`/chat/interviews/${sessionId}/complete`);
    return res.data;
  },

  abandonChatInterview: async (sessionId: number): Promise<void> => {
    await api.delete(`/chat/interviews/${sessionId}`);
  },
};
