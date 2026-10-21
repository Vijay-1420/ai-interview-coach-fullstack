import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  X,
  Send,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import Button from '../components/Button';
import { ErrorState, LoadingSpinner, ProgressBar } from '../components/ui';
import { getApiErrorMessage, interviewApi } from '../services/api';
import type { InterviewSessionResponse, FeedbackResponse, QuestionInfo } from '../types';

type Phase = 'answering' | 'feedback' | 'complete';

const ActiveInterview: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [sessionData, setSessionData] = useState<InterviewSessionResponse | null>(
    (location.state?.session as InterviewSessionResponse | undefined) ?? null
  );

  const [currentQuestion, setCurrentQuestion] = useState<QuestionInfo | null>(
    sessionData?.first_question ?? null
  );
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('answering');
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [restoreError, setRestoreError] = useState<{ sessionId: number; message: string } | null>(null);
  const [exitError, setExitError] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  const totalQuestions = sessionData?.num_questions ?? 5;
  const jobRole = sessionData?.job_role ?? '';
  const interviewType = sessionData?.interview_type ?? '';

  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;

  useEffect(() => {
    if (!sessionId) {
      navigate('/interview/setup');
      return;
    }
    if (sessionData?.session_id === Number(sessionId)) return;

    let active = true;
    interviewApi.getSession(Number(sessionId))
      .then((session) => {
        if (!active) return;
        if (session.status === 'completed' || session.status === 'abandoned') {
          navigate(`/results/${session.id}`, { replace: true });
          return;
        }

        const answered = session.questions.filter((question) => question.answered).length;
        setAnsweredCount(answered);
        setSessionData({
          session_id: session.id,
          job_role: session.job_role,
          interview_type: session.interview_type,
          difficulty: session.difficulty,
          num_questions: session.num_questions,
          first_question: session.questions.find((question) => !question.answered) ?? session.questions[0],
        });
        setCurrentQuestion(session.questions.find((question) => !question.answered) ?? null);
      })
      .catch((err: Error) => {
        if (active) setRestoreError({ sessionId: Number(sessionId), message: err.message });
      });

    return () => {
      active = false;
    };
  }, [sessionData, sessionId, navigate]);

  const handleSubmit = useCallback(async () => {
    if (!answer.trim() || !currentQuestion || !sessionId) return;
    if (submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const result = await interviewApi.submitAnswer({
        session_id: Number(sessionId),
        question_id: currentQuestion.id,
        answer: answer.trim(),
      });

      setFeedback(result);
      setAnsweredCount((c) => c + 1);

      if (result.session_complete) {
        setPhase('complete');
      } else {
        setPhase('feedback');
      }
    } catch (err: unknown) {
      setSubmitError(getApiErrorMessage(err, 'Could not submit your answer.'));
    } finally {
      setSubmitting(false);
    }
  }, [answer, currentQuestion, sessionId, submitting]);

  const handleNext = () => {
    if (!feedback?.next_question) return;
    setCurrentQuestion(feedback.next_question);
    setAnswer('');
    setFeedback(null);
    setSubmitError(null);
    setPhase('answering');
  };

  const handleViewResults = () => {
    navigate(`/results/${sessionId}`);
  };

  const handleCopyAnswer = async () => {
    if (!feedback) return;
    try {
      await navigator.clipboard.writeText(feedback.suggested_answer);
      toast.success('Suggested answer copied.');
    } catch {
      toast.error('Could not access the clipboard. Please copy the answer manually.');
    }
  };

  const handleEndInterview = async () => {
    if (!sessionId || ending) return;
    setEnding(true);
    setExitError(null);
    try {
      await interviewApi.abandonSession(Number(sessionId));
      navigate('/dashboard');
    } catch (err: unknown) {
      setExitError(err instanceof Error ? err.message : 'Could not end this interview.');
    } finally {
      setEnding(false);
    }
  };

  const progress = ((answeredCount) / totalQuestions) * 100;
  const questionNumber = currentQuestion?.question_number ?? 1;

  const getScoreStyle = (score: number) => {
    if (score >= 8) return 'bg-[#E4F0E8] text-[#174D3A]';
    if (score >= 5) return 'bg-[#EAE5F7] text-[#5b4b8a]';
    return 'bg-[#fde8e4] text-[#c0624e]';
  };

  if (sessionData?.session_id !== Number(sessionId)) {
    const error = restoreError?.sessionId === Number(sessionId) ? restoreError.message : null;
    return (
      <main className="min-h-screen bg-[#FAF8F3] px-6 pt-24">
        {error ? (
          <div className="mx-auto max-w-2xl">
            <ErrorState message={error} onRetry={() => navigate(0)} />
            <button onClick={() => navigate('/dashboard')} className="mx-auto block text-sm font-semibold text-[#174D3A]">
              Return to dashboard
            </button>
          </div>
        ) : (
          <LoadingSpinner message="Restoring your interview..." />
        )}
      </main>
    );
  }

  if (!sessionData) {
    return (
      <main className="min-h-screen bg-[#FAF8F3] px-6 pt-24">
        <div className="mx-auto max-w-2xl">
          <ErrorState message="Interview session could not be restored." onRetry={() => navigate(0)} />
          <button onClick={() => navigate('/dashboard')} className="mx-auto block text-sm font-semibold text-[#174D3A]">
            Return to dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-[#E8E6DF]">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-[#777B73] uppercase tracking-wider">
              {interviewType} Interview
            </span>
            <span className="text-xs text-[#777B73]">· {jobRole}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-[#777B73] font-medium">
              {phase === 'complete' ? totalQuestions : questionNumber} / {totalQuestions}
            </span>
            <div className="w-28">
              <ProgressBar value={progress} />
            </div>
            <button
              onClick={() => setShowExitModal(true)}
              className="w-7 h-7 rounded-lg bg-[#FAF8F3] flex items-center justify-center hover:bg-[#fde8e4] text-[#777B73] hover:text-[#c0624e] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 pt-20 pb-16">

        {/* ── ANSWERING PHASE ── */}
        {phase === 'answering' && currentQuestion && (
          <div className="mt-8 space-y-5">
            {/* Question card */}
            <div className="bg-white rounded-2xl border border-[#E8E6DF] p-7 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 bg-[#174D3A] rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{questionNumber}</span>
                </div>
                <span className="text-xs font-semibold text-[#777B73] uppercase tracking-wider">
                  Question {questionNumber} of {totalQuestions}
                </span>
              </div>
              <p className="text-lg font-semibold text-[#282A27] leading-relaxed">
                {currentQuestion.question_text}
              </p>
            </div>

            {/* Answer textarea */}
            <div className="bg-white rounded-2xl border border-[#E8E6DF] p-6 shadow-sm">
              <label className="block text-sm font-semibold text-[#282A27] mb-3">Your Answer</label>
              <textarea
              maxLength={12000}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Take your time and answer thoughtfully. Structure your answer clearly..."
                rows={8}
                className="w-full px-4 py-3 border border-[#E8E6DF] rounded-xl text-sm text-[#282A27] bg-[#FAF8F3] focus:outline-none focus:ring-2 focus:ring-[#174D3A]/30 focus:border-[#174D3A] resize-none placeholder:text-[#aaa] transition"
              />
              <div className="flex items-center justify-between mt-3">
                <span className={`text-xs font-medium ${wordCount < 5 ? 'text-[#c0624e]' : 'text-[#777B73]'}`}>
                  {wordCount} word{wordCount !== 1 ? 's' : ''}
                  {wordCount < 5 && ' — aim for at least 5 words'}
                </span>
                {submitError && (
                  <p className="text-xs text-[#c0624e] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />{submitError}
                  </p>
                )}
                <Button
                  onClick={handleSubmit}
                  loading={submitting}
                  disabled={!answer.trim()}
                  icon={<Send className="w-4 h-4" />}
                  iconPosition="right"
                >
                  {submitting ? 'Evaluating...' : 'Submit Answer'}
                </Button>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-[#EAE5F7]/50 rounded-xl border border-[#EAE5F7] px-5 py-4">
              <p className="text-xs font-semibold text-[#5b4b8a] mb-1">💡 Quick Tips</p>
              <p className="text-xs text-[#777B73]">
                For behavioral questions, use the <strong>STAR method</strong> (Situation, Task, Action, Result).
                Be specific and give concrete examples. Aim for 2–3 minutes of speech equivalent.
              </p>
            </div>
          </div>
        )}

        {/* ── FEEDBACK PHASE ── */}
        {phase === 'feedback' && feedback && (
          <div className="mt-8 space-y-5">
            {/* Score header */}
            <div className="bg-white rounded-2xl border border-[#E8E6DF] p-7 shadow-sm">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="font-bold text-[#282A27] text-lg mb-1">Answer Feedback</h2>
                  <p className="text-xs text-[#777B73]">Question {feedback.current_question_number} of {feedback.total_questions}</p>
                </div>
                <div className={`px-5 py-3 rounded-xl font-bold text-2xl ${getScoreStyle(feedback.score)}`}>
                  {feedback.score}<span className="text-sm font-normal">/10</span>
                </div>
              </div>

              {/* Overall feedback */}
              <div className="bg-[#FAF8F3] rounded-xl p-4">
                <p className="text-sm text-[#282A27] leading-relaxed">{feedback.feedback}</p>
              </div>
            </div>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#E4F0E8] rounded-2xl border border-[#c8e0ce] p-5">
                <p className="text-xs font-bold text-[#174D3A] uppercase tracking-wider mb-3">✓ What You Did Well</p>
                <p className="text-sm text-[#282A27] leading-relaxed">{feedback.strengths}</p>
              </div>
              <div className="bg-[#fde8e4] rounded-2xl border border-[#f5c4bb] p-5">
                <p className="text-xs font-bold text-[#c0624e] uppercase tracking-wider mb-3">⚡ Areas to Improve</p>
                <p className="text-sm text-[#282A27] leading-relaxed">{feedback.improvements}</p>
              </div>
            </div>

            {/* Suggested Answer */}
            <div className="bg-[#EAE5F7]/60 rounded-2xl border border-[#EAE5F7] p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-[#5b4b8a] rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs">✨</span>
                </div>
                <p className="text-xs font-bold text-[#5b4b8a] uppercase tracking-wider">AI Suggested Answer</p>
              </div>
              <p className="text-sm text-[#282A27] leading-relaxed">{feedback.suggested_answer}</p>
              <button
                onClick={handleCopyAnswer}
                className="mt-3 text-xs text-[#5b4b8a] font-semibold hover:text-[#3d3060] transition-colors"
              >
                Copy to clipboard
              </button>
            </div>

            {/* Your original question */}
            <div className="bg-white rounded-xl border border-[#E8E6DF] px-5 py-4">
              <p className="text-xs font-semibold text-[#777B73] mb-1">Question asked</p>
              <p className="text-sm text-[#282A27] italic">"{feedback.question}"</p>
            </div>

            {/* Continue button */}
            <div className="flex justify-end">
              <Button
                onClick={handleNext}
                size="lg"
                icon={<ChevronRight className="w-5 h-5" />}
                iconPosition="right"
              >
                Next Question
              </Button>
            </div>
          </div>
        )}

        {/* ── COMPLETE PHASE ── */}
        {phase === 'complete' && feedback && (
          <div className="mt-8 space-y-5">
            {/* Success banner */}
            <div className="bg-[#174D3A] rounded-3xl p-8 text-white text-center">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎉</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">Interview Complete!</h2>
              <p className="text-[#a8c5b5] text-sm mb-6">
                You answered all {totalQuestions} questions. Great work!
              </p>
              <div className="inline-block bg-white/20 rounded-2xl px-8 py-4">
                <p className="text-xs text-[#a8c5b5] mb-1">Last answer score</p>
                <p className="text-4xl font-bold">{feedback.score}<span className="text-xl font-normal text-[#a8c5b5]">/10</span></p>
              </div>
            </div>

            {/* Last question feedback */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#E4F0E8] rounded-2xl border border-[#c8e0ce] p-5">
                <p className="text-xs font-bold text-[#174D3A] uppercase tracking-wider mb-3">✓ What You Did Well</p>
                <p className="text-sm text-[#282A27]">{feedback.strengths}</p>
              </div>
              <div className="bg-[#fde8e4] rounded-2xl border border-[#f5c4bb] p-5">
                <p className="text-xs font-bold text-[#c0624e] uppercase tracking-wider mb-3">⚡ Areas to Improve</p>
                <p className="text-sm text-[#282A27]">{feedback.improvements}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              <Button onClick={handleViewResults} size="lg" icon={<ChevronRight className="w-4 h-4" />} iconPosition="right">
                View Full Results
              </Button>
              <Button
                onClick={() => navigate('/interview/setup')}
                variant="outline"
                size="lg"
              >
                Start Another Interview
              </Button>
              <Button
                onClick={() => navigate('/dashboard')}
                variant="ghost"
                size="lg"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Exit confirmation modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
          <div role="dialog" aria-modal="true" aria-labelledby="exit-dialog-title" className="bg-white rounded-2xl border border-[#E8E6DF] shadow-xl max-w-sm w-full p-7">
            <h3 id="exit-dialog-title" className="font-bold text-[#282A27] text-lg mb-2">End this interview?</h3>
            <p className="text-sm text-[#777B73] mb-6">
              Progress will be lost for questions you haven't answered yet. Your submitted answers are saved.
            </p>
            <div className="flex gap-3">
              <Button onClick={handleEndInterview} loading={ending} variant="danger" className="flex-1">
                {ending ? 'Ending...' : 'End Interview'}
              </Button>
              <Button onClick={() => setShowExitModal(false)} variant="outline" className="flex-1">
                Keep Going
              </Button>
            </div>
            {exitError && <p role="alert" className="mt-3 text-xs text-[#c0624e]">{exitError}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveInterview;
