from collections import Counter
from datetime import datetime, timezone
import re

from fastapi import APIRouter, HTTPException

from models.schema import (
    StartInterviewRequest,
    AnswerRequest,
    InterviewSessionResponse,
    FeedbackResponse,
    QuestionInfo,
    SessionResult,
    QuestionResult,
    HistorySession,
    AnalyticsData,
)
from database.db import SessionLocal
from database.models import InterviewSession, InterviewQuestion
from services.evaluator import evaluate_answer, generate_questions

router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# Helper
# ─────────────────────────────────────────────────────────────────────────────

def _fmt(dt: datetime | None) -> str | None:
    return dt.isoformat() if dt else None


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/interview/start
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/interview/start", response_model=InterviewSessionResponse)
def start_interview(data: StartInterviewRequest):
    job_role = data.job_role.strip()
    if not job_role:
        raise HTTPException(status_code=422, detail="Job role cannot be blank")

    # Generate questions via AI (or fallback)
    questions_texts = generate_questions(
        job_role=job_role,
        interview_type=data.interview_type,
        difficulty=data.difficulty,
        num_questions=data.num_questions,
        experience_level=data.experience_level,
        job_description=data.job_description,
    )

    db = SessionLocal()
    try:
        # Create session
        session = InterviewSession(
            job_role=job_role,
            experience_level=data.experience_level,
            interview_type=data.interview_type,
            difficulty=data.difficulty,
            num_questions=data.num_questions,
            job_description=data.job_description,
            status="in_progress",
        )
        db.add(session)
        db.flush()  # get session.id

        # Create question records
        for idx, q_text in enumerate(questions_texts, start=1):
            q = InterviewQuestion(
                session_id=session.id,
                question_text=q_text,
                question_number=idx,
            )
            db.add(q)

        db.commit()
        db.refresh(session)

        # Fetch the first question
        first_q = (
            db.query(InterviewQuestion)
            .filter(
                InterviewQuestion.session_id == session.id,
                InterviewQuestion.question_number == 1,
            )
            .first()
        )

        return InterviewSessionResponse(
            session_id=session.id,
            job_role=session.job_role,
            interview_type=session.interview_type,
            difficulty=session.difficulty,
            num_questions=session.num_questions,
            first_question=QuestionInfo(
                id=first_q.id,
                question_text=first_q.question_text,
                question_number=first_q.question_number,
            ),
        )
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/interview/history   (must come BEFORE /{session_id})
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/interview/history")
def get_history():
    db = SessionLocal()
    try:
        sessions = (
            db.query(InterviewSession)
            .filter(InterviewSession.status != "abandoned")
            .order_by(InterviewSession.created_at.desc())
            .all()
        )
        return [
            HistorySession(
                id=s.id,
                job_role=s.job_role,
                interview_type=s.interview_type,
                difficulty=s.difficulty,
                num_questions=s.num_questions,
                total_score=s.total_score,
                created_at=_fmt(s.created_at),
                completed_at=_fmt(s.completed_at),
                status=s.status,
            )
            for s in sessions
        ]
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/interview/analytics  (must come BEFORE /{session_id})
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/interview/analytics", response_model=AnalyticsData)
def get_analytics():
    db = SessionLocal()
    try:
        completed = (
            db.query(InterviewSession)
            .filter(InterviewSession.status == "completed")
            .order_by(InterviewSession.created_at)
            .all()
        )

        total = len(completed)
        avg_score = None
        if total:
            scores = [s.total_score for s in completed if s.total_score is not None]
            avg_score = sum(scores) / len(scores) if scores else None

        by_type: dict[str, int] = {}
        for s in completed:
            by_type[s.interview_type] = by_type.get(s.interview_type, 0) + 1

        score_trend = [
            {
                "date": _fmt(s.completed_at) or _fmt(s.created_at),
                "score": round(s.total_score, 1) if s.total_score else 0,
            }
            for s in completed[-10:]
            if s.total_score is not None
        ]

        # Extract common improvement keywords from feedback text
        all_feedback = []
        for s in completed:
            for q in s.questions:
                if q.improvements:
                    all_feedback.append(q.improvements.lower())

        stop_words = {
            "a", "an", "the", "and", "or", "but", "in", "on", "at", "to",
            "for", "of", "with", "your", "you", "this", "that", "is", "are",
            "was", "be", "by", "it", "as", "more", "can", "could", "would",
            "should", "have", "had", "has", "from", "not", "than", "answer",
            "try", "need", "also", "will", "consider", "add", "include",
        }

        words = []
        for text in all_feedback:
            words.extend(re.findall(r"\b[a-z]{4,}\b", text))
        filtered = [w for w in words if w not in stop_words]
        common = [word for word, _ in Counter(filtered).most_common(8)]

        return AnalyticsData(
            total_interviews=total,
            average_score=round(avg_score, 1) if avg_score is not None else None,
            interviews_by_type=by_type,
            score_trend=score_trend,
            common_improvement_areas=common,
        )
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/interview/answer
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/interview/answer", response_model=FeedbackResponse)
def submit_answer(data: AnswerRequest):
    db = SessionLocal()
    try:
        session = db.query(InterviewSession).filter(InterviewSession.id == data.session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        if session.status != "in_progress":
            raise HTTPException(status_code=409, detail="This interview is no longer in progress")

        answer = data.answer.strip()
        if not answer:
            raise HTTPException(status_code=422, detail="Answer cannot be blank")

        question = db.query(InterviewQuestion).filter(
            InterviewQuestion.id == data.question_id,
            InterviewQuestion.session_id == session.id,
        ).first()
        if not question:
            raise HTTPException(status_code=404, detail="Question not found in this session")

        if question.answer is not None:
            raise HTTPException(status_code=400, detail="Question already answered")

        next_question = db.query(InterviewQuestion).filter(
            InterviewQuestion.session_id == session.id,
            InterviewQuestion.answer.is_(None),
        ).order_by(InterviewQuestion.question_number).first()
        if next_question is None or next_question.id != question.id:
            raise HTTPException(status_code=409, detail="Answer the current question before moving on")

        # AI evaluation
        eval_result = evaluate_answer(
            question=question.question_text,
            answer=answer,
            job_role=session.job_role,
            interview_type=session.interview_type,
            experience_level=session.experience_level,
            job_description=session.job_description,
        )

        # Save answer + feedback
        question.answer = answer
        question.score = eval_result["score"]
        question.feedback = eval_result["feedback"]
        question.strengths = eval_result["strengths"]
        question.improvements = eval_result["improvements"]
        question.suggested_answer = eval_result["suggested_answer"]
        question.submitted_at = datetime.now(timezone.utc).replace(tzinfo=None)

        # Check if all questions answered
        all_questions = db.query(InterviewQuestion).filter(
            InterviewQuestion.session_id == session.id
        ).all()

        answered_qs = [q for q in all_questions if q.answer is not None]
        session_complete = len(answered_qs) == len(all_questions)

        if session_complete:
            scores = [q.score for q in answered_qs if q.score is not None]
            session.total_score = round(sum(scores) / len(scores), 1) if scores else None
            session.status = "completed"
            session.completed_at = datetime.now(timezone.utc).replace(tzinfo=None)

        db.commit()

        # Get next question if not complete
        next_q = None
        if not session_complete:
            next_q_obj = db.query(InterviewQuestion).filter(
                InterviewQuestion.session_id == session.id,
                InterviewQuestion.question_number == question.question_number + 1,
            ).first()
            if next_q_obj:
                next_q = QuestionInfo(
                    id=next_q_obj.id,
                    question_text=next_q_obj.question_text,
                    question_number=next_q_obj.question_number,
                )

        return FeedbackResponse(
            question=question.question_text,
            answer=answer,
            score=eval_result["score"],
            feedback=eval_result["feedback"],
            strengths=eval_result["strengths"],
            improvements=eval_result["improvements"],
            suggested_answer=eval_result["suggested_answer"],
            next_question=next_q,
            session_complete=session_complete,
            current_question_number=question.question_number,
            total_questions=session.num_questions,
        )
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/interview/{session_id}/question/{question_number}
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/interview/{session_id}/question/{question_number}")
def get_question(session_id: int, question_number: int):
    db = SessionLocal()
    try:
        q = (
            db.query(InterviewQuestion)
            .filter(
                InterviewQuestion.session_id == session_id,
                InterviewQuestion.question_number == question_number,
            )
            .first()
        )
        if not q:
            raise HTTPException(status_code=404, detail="Question not found")
        return QuestionInfo(id=q.id, question_text=q.question_text, question_number=q.question_number)
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/interview/{session_id}/results
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/interview/{session_id}/results", response_model=SessionResult)
def get_results(session_id: int):
    db = SessionLocal()
    try:
        session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        return SessionResult(
            session_id=session.id,
            job_role=session.job_role,
            interview_type=session.interview_type,
            difficulty=session.difficulty,
            experience_level=session.experience_level,
            num_questions=session.num_questions,
            total_score=session.total_score,
            created_at=_fmt(session.created_at),
            completed_at=_fmt(session.completed_at),
            status=session.status,
            questions=[
                QuestionResult(
                    id=q.id,
                    question_number=q.question_number,
                    question_text=q.question_text,
                    answer=q.answer,
                    score=q.score,
                    feedback=q.feedback,
                    strengths=q.strengths,
                    improvements=q.improvements,
                    suggested_answer=q.suggested_answer,
                )
                for q in sorted(session.questions, key=lambda x: x.question_number)
            ],
        )
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/interview/{session_id}
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/interview/{session_id}")
def get_session(session_id: int):
    db = SessionLocal()
    try:
        session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        return {
            "id": session.id,
            "job_role": session.job_role,
            "interview_type": session.interview_type,
            "difficulty": session.difficulty,
            "experience_level": session.experience_level,
            "num_questions": session.num_questions,
            "status": session.status,
            "created_at": _fmt(session.created_at),
            "questions": [
                {
                    "id": q.id,
                    "question_number": q.question_number,
                    "question_text": q.question_text,
                    "answered": q.answer is not None,
                }
                for q in sorted(session.questions, key=lambda x: x.question_number)
            ],
        }
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# DELETE /api/interview/{session_id}
# ─────────────────────────────────────────────────────────────────────────────

@router.delete("/interview/{session_id}")
def delete_session(session_id: int):
    db = SessionLocal()
    try:
        session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        if session.status == "completed":
            raise HTTPException(status_code=409, detail="Completed interviews cannot be abandoned")
        session.status = "abandoned"
        db.commit()
        return {"message": "Session marked as abandoned"}
    finally:
        db.close()