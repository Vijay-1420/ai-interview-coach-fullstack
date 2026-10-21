from datetime import datetime, timezone
import re

from fastapi import APIRouter, HTTPException

from database.db import SessionLocal
from database.models import ChatInterviewMessage, ChatInterviewSession
from models.schema import (
    ChatInterviewResponse,
    ChatInterviewSummary,
    ChatMessageRequest,
    ChatMessageResponse,
    StartChatInterviewRequest,
)
from services.chat_interviewer import (
    ChatTurn,
    create_interview_review,
    respond_to_candidate,
    validate_candidate_answer,
)

router = APIRouter(prefix="/chat/interviews", tags=["AI chat interviews"])
MAX_CANDIDATE_TURNS = 30


def _format_date(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


def _to_message(message: ChatInterviewMessage) -> ChatMessageResponse:
    return ChatMessageResponse(
        id=message.id,
        role=message.role,
        content=message.content,
        created_at=message.created_at.isoformat(),
    )


def _to_response(
    session: ChatInterviewSession,
    *,
    answer_accepted: bool | None = None,
    answer_feedback: str | None = None,
) -> ChatInterviewResponse:
    return ChatInterviewResponse(
        id=session.id,
        job_role=session.job_role,
        experience_level=session.experience_level,
        interview_type=session.interview_type,
        difficulty=session.difficulty,
        status=session.status,
        created_at=session.created_at.isoformat(),
        completed_at=_format_date(session.completed_at),
        overall_score=session.overall_score,
        review=session.review,
        messages=[_to_message(message) for message in session.messages],
        answer_accepted=answer_accepted,
        answer_feedback=answer_feedback,
    )


def _get_session(db, session_id: int) -> ChatInterviewSession:
    session = (
        db.query(ChatInterviewSession)
        .filter(ChatInterviewSession.id == session_id)
        .first()
    )
    if session is None:
        raise HTTPException(status_code=404, detail="Chat interview not found")
    return session


def _history_for(session: ChatInterviewSession) -> list[ChatTurn]:
    return [{message.role: message.content} for message in session.messages]


@router.post("", response_model=ChatInterviewResponse, status_code=201)
def start_chat_interview(data: StartChatInterviewRequest) -> ChatInterviewResponse:
    job_role = data.job_role.strip()
    if not job_role:
        raise HTTPException(status_code=422, detail="Job role cannot be blank")

    db = SessionLocal()
    try:
        session = ChatInterviewSession(
            job_role=job_role,
            experience_level=data.experience_level,
            interview_type=data.interview_type,
            difficulty=data.difficulty,
            job_description=data.job_description.strip() if data.job_description else None,
            status="in_progress",
        )
        db.add(session)
        db.flush()

        opening = respond_to_candidate(
            job_role=session.job_role,
            experience_level=session.experience_level,
            interview_type=session.interview_type,
            difficulty=session.difficulty,
            job_description=session.job_description,
            history=[],
        )
        db.add(
            ChatInterviewMessage(
                session_id=session.id,
                role="assistant",
                content=opening,
            )
        )
        db.commit()
        db.refresh(session)
        return _to_response(session)
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@router.get("", response_model=list[ChatInterviewSummary])
def list_chat_interviews() -> list[ChatInterviewSummary]:
    db = SessionLocal()
    try:
        sessions = (
            db.query(ChatInterviewSession)
            .order_by(ChatInterviewSession.created_at.desc())
            .limit(100)
            .all()
        )
        return [
            ChatInterviewSummary(
                id=session.id,
                job_role=session.job_role,
                interview_type=session.interview_type,
                difficulty=session.difficulty,
                status=session.status,
                created_at=session.created_at.isoformat(),
                completed_at=_format_date(session.completed_at),
                overall_score=session.overall_score,
            )
            for session in sessions
        ]
    finally:
        db.close()


@router.get("/{session_id}", response_model=ChatInterviewResponse)
def get_chat_interview(session_id: int) -> ChatInterviewResponse:
    db = SessionLocal()
    try:
        return _to_response(_get_session(db, session_id))
    finally:
        db.close()


@router.post("/{session_id}/messages", response_model=ChatInterviewResponse)
def send_chat_message(
    session_id: int,
    data: ChatMessageRequest,
) -> ChatInterviewResponse:
    content = data.content.strip()
    if not content:
        raise HTTPException(status_code=422, detail="Message cannot be blank")

    db = SessionLocal()
    try:
        session = _get_session(db, session_id)
        if session.status != "in_progress":
            raise HTTPException(status_code=409, detail="This chat interview is no longer active")

        candidate_turns = sum(message.role == "user" for message in session.messages)
        if candidate_turns >= MAX_CANDIDATE_TURNS:
            raise HTTPException(
                status_code=409,
                detail="This interview has reached its conversation limit. Finish it to see your review.",
            )

        history = _history_for(session)
        previous_assistant = next(
            (turn["assistant"] for turn in reversed(history) if "assistant" in turn),
            None,
        )
        previous_questions = (
            re.findall(r"[^?]*\?", previous_assistant, re.DOTALL)
            if previous_assistant
            else []
        )
        if not previous_questions:
            raise HTTPException(status_code=409, detail="No interview question is available to evaluate.")

        validation = validate_candidate_answer(
            job_role=session.job_role,
            experience_level=session.experience_level,
            question=previous_questions[-1].strip(),
            answer=content,
        )
        if not validation["accepted"]:
            return _to_response(
                session,
                answer_accepted=False,
                answer_feedback=str(validation["feedback"]),
            )

        history.append({"user": content})
        reply = respond_to_candidate(
            job_role=session.job_role,
            experience_level=session.experience_level,
            interview_type=session.interview_type,
            difficulty=session.difficulty,
            job_description=session.job_description,
            history=history,
        )
        session.messages.extend(
            [
                ChatInterviewMessage(session_id=session.id, role="user", content=content),
                ChatInterviewMessage(session_id=session.id, role="assistant", content=reply),
            ]
        )
        db.commit()
        db.refresh(session)
        return _to_response(
            session,
            answer_accepted=True,
            answer_feedback=str(validation["feedback"]),
        )
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@router.post("/{session_id}/complete", response_model=ChatInterviewResponse)
def complete_chat_interview(session_id: int) -> ChatInterviewResponse:
    db = SessionLocal()
    try:
        session = _get_session(db, session_id)
        if session.status == "completed":
            return _to_response(session)
        if session.status != "in_progress":
            raise HTTPException(status_code=409, detail="This chat interview is no longer active")

        try:
            review = create_interview_review(
                job_role=session.job_role,
                experience_level=session.experience_level,
                interview_type=session.interview_type,
                transcript=_history_for(session),
            )
        except ValueError as error:
            raise HTTPException(status_code=422, detail=str(error)) from error

        session.status = "completed"
        session.completed_at = datetime.now(timezone.utc).replace(tzinfo=None)
        session.overall_score = float(review["score"])
        session.review = (
            f"**Summary**\n{review['summary']}\n\n"
            f"**Strengths**\n{review['strengths']}\n\n"
            f"**Growth areas**\n{review['improvements']}"
        )
        db.commit()
        db.refresh(session)
        return _to_response(session)
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@router.delete("/{session_id}")
def abandon_chat_interview(session_id: int) -> dict[str, str]:
    db = SessionLocal()
    try:
        session = _get_session(db, session_id)
        if session.status == "completed":
            raise HTTPException(status_code=409, detail="Completed interviews cannot be abandoned")
        session.status = "abandoned"
        db.commit()
        return {"message": "Chat interview marked as abandoned"}
    finally:
        db.close()
