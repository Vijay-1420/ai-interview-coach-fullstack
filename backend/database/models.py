from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from database.db import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    job_role = Column(String, nullable=False)
    experience_level = Column(String, nullable=False, default="Mid")
    interview_type = Column(String, nullable=False, default="Mixed")
    difficulty = Column(String, nullable=False, default="Medium")
    num_questions = Column(Integer, nullable=False, default=5)
    job_description = Column(String, nullable=True)
    status = Column(String, nullable=False, default="in_progress")  # in_progress / completed / abandoned
    created_at = Column(DateTime, default=_utcnow)
    completed_at = Column(DateTime, nullable=True)
    total_score = Column(Float, nullable=True)

    questions = relationship("InterviewQuestion", back_populates="session", cascade="all, delete-orphan")


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    question_text = Column(String, nullable=False)
    question_number = Column(Integer, nullable=False)
    answer = Column(String, nullable=True)
    score = Column(Integer, nullable=True)
    feedback = Column(String, nullable=True)
    strengths = Column(String, nullable=True)
    improvements = Column(String, nullable=True)
    suggested_answer = Column(String, nullable=True)
    submitted_at = Column(DateTime, nullable=True)

    session = relationship("InterviewSession", back_populates="questions")


# Keep original model for backward compatibility
class InterviewResponse(Base):
    __tablename__ = "responses"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(String)
    answer = Column(String)
    score = Column(Integer)
    feedback = Column(String)


class ChatInterviewSession(Base):
    __tablename__ = "chat_interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    job_role = Column(String(120), nullable=False)
    experience_level = Column(String(20), nullable=False, default="Mid")
    interview_type = Column(String(30), nullable=False, default="Mixed")
    difficulty = Column(String(20), nullable=False, default="Medium")
    job_description = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="in_progress")
    created_at = Column(DateTime, default=_utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    overall_score = Column(Float, nullable=True)
    review = Column(Text, nullable=True)

    messages = relationship(
        "ChatInterviewMessage",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="ChatInterviewMessage.id",
    )


class ChatInterviewMessage(Base):
    __tablename__ = "chat_interview_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(
        Integer,
        ForeignKey("chat_interview_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=_utcnow, nullable=False)

    session = relationship("ChatInterviewSession", back_populates="messages")