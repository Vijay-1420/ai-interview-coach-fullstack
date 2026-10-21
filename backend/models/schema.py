from pydantic import BaseModel, Field
from typing import Optional, List, Dict


class StartInterviewRequest(BaseModel):
    job_role: str = Field(min_length=1, max_length=120)
    experience_level: str = "Mid"
    interview_type: str = "Mixed"
    difficulty: str = "Medium"
    num_questions: int = Field(default=5, ge=1, le=10)
    job_description: Optional[str] = Field(default=None, max_length=12000)


class AnswerRequest(BaseModel):
    session_id: int = Field(gt=0)
    question_id: int = Field(gt=0)
    answer: str = Field(min_length=1, max_length=12000)


class StartChatInterviewRequest(BaseModel):
    job_role: str = Field(min_length=1, max_length=120)
    experience_level: str = "Mid"
    interview_type: str = "Mixed"
    difficulty: str = "Medium"
    job_description: Optional[str] = Field(default=None, max_length=12000)


class ChatMessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=6000)


class ChatMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: str


class ChatInterviewResponse(BaseModel):
    id: int
    job_role: str
    experience_level: str
    interview_type: str
    difficulty: str
    status: str
    created_at: str
    completed_at: Optional[str]
    overall_score: Optional[float]
    review: Optional[str]
    messages: List[ChatMessageResponse]
    answer_accepted: Optional[bool] = None
    answer_feedback: Optional[str] = None


class ChatInterviewSummary(BaseModel):
    id: int
    job_role: str
    interview_type: str
    difficulty: str
    status: str
    created_at: str
    completed_at: Optional[str]
    overall_score: Optional[float]

class QuestionInfo(BaseModel):
    id: int
    question_text: str
    question_number: int


class InterviewSessionResponse(BaseModel):
    session_id: int
    job_role: str
    interview_type: str
    difficulty: str
    num_questions: int
    first_question: QuestionInfo


class FeedbackResponse(BaseModel):
    question: str
    answer: str
    score: int
    feedback: str
    strengths: str
    improvements: str
    suggested_answer: str
    next_question: Optional[QuestionInfo]
    session_complete: bool
    current_question_number: int
    total_questions: int


class QuestionResult(BaseModel):
    id: int
    question_number: int
    question_text: str
    answer: Optional[str]
    score: Optional[int]
    feedback: Optional[str]
    strengths: Optional[str]
    improvements: Optional[str]
    suggested_answer: Optional[str]


class SessionResult(BaseModel):
    session_id: int
    job_role: str
    interview_type: str
    difficulty: str
    experience_level: str
    num_questions: int
    total_score: Optional[float]
    created_at: str
    completed_at: Optional[str]
    status: str
    questions: List[QuestionResult]


class HistorySession(BaseModel):
    id: int
    job_role: str
    interview_type: str
    difficulty: str
    num_questions: int
    total_score: Optional[float]
    created_at: str
    completed_at: Optional[str]
    status: str


class AnalyticsData(BaseModel):
    total_interviews: int
    average_score: Optional[float]
    interviews_by_type: Dict[str, int]
    score_trend: List[Dict]
    common_improvement_areas: List[str]