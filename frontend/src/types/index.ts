// API Types matching the FastAPI backend schemas

export interface StartInterviewRequest {
  job_role: string;
  experience_level: string;
  interview_type: string;
  difficulty: string;
  num_questions: number;
  job_description?: string;
}

export interface StartChatInterviewRequest {
  job_role: string;
  experience_level: string;
  interview_type: string;
  difficulty: string;
  job_description?: string;
}

export interface ChatInterviewMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ChatInterview {
  id: number;
  job_role: string;
  experience_level: string;
  interview_type: string;
  difficulty: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  overall_score: number | null;
  review: string | null;
  messages: ChatInterviewMessage[];
  answer_accepted?: boolean | null;
  answer_feedback?: string | null;
}

export interface ChatInterviewSummary {
  id: number;
  job_role: string;
  interview_type: string;
  difficulty: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  overall_score: number | null;
}

export interface QuestionInfo {
  id: number;
  question_text: string;
  question_number: number;
}

export interface InterviewSessionResponse {
  session_id: number;
  job_role: string;
  interview_type: string;
  difficulty: string;
  num_questions: number;
  first_question: QuestionInfo;
}

export interface InterviewProgress {
  id: number;
  job_role: string;
  experience_level: string;
  interview_type: string;
  difficulty: string;
  num_questions: number;
  status: string;
  questions: (QuestionInfo & { answered: boolean })[];
}

export interface AnswerRequest {
  session_id: number;
  question_id: number;
  answer: string;
}

export interface FeedbackResponse {
  question: string;
  answer: string;
  score: number;
  feedback: string;
  strengths: string;
  improvements: string;
  suggested_answer: string;
  next_question: QuestionInfo | null;
  session_complete: boolean;
  current_question_number: number;
  total_questions: number;
}

export interface HistorySession {
  id: number;
  job_role: string;
  interview_type: string;
  difficulty: string;
  num_questions: number;
  total_score: number | null;
  created_at: string;
  completed_at: string | null;
  status: string;
}

export interface SessionResult {
  session_id: number;
  job_role: string;
  interview_type: string;
  difficulty: string;
  experience_level: string;
  num_questions: number;
  total_score: number | null;
  created_at: string;
  completed_at: string | null;
  status: string;
  questions: QuestionResult[];
}

export interface QuestionResult {
  id: number;
  question_number: number;
  question_text: string;
  answer: string | null;
  score: number | null;
  feedback: string | null;
  strengths: string | null;
  improvements: string | null;
  suggested_answer: string | null;
}

export interface AnalyticsData {
  total_interviews: number;
  average_score: number | null;
  interviews_by_type: Record<string, number>;
  score_trend: { date: string; score: number }[];
  common_improvement_areas: string[];
}
