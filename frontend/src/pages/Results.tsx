import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, Clock } from 'lucide-react';
import Navbar from '../components/Navbar';
import { Card, Badge, LoadingSpinner, ErrorState } from '../components/ui';
import Button from '../components/Button';
import { getApiErrorMessage, interviewApi } from '../services/api';
import type { SessionResult } from '../types';
import { formatDateTime } from '../utils/date';

const Results: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<SessionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResult = useCallback(() => {
    if (!sessionId) return Promise.reject(new Error('Interview ID is missing.'));
    return interviewApi.getSessionResults(Number(sessionId));
  }, [sessionId]);

  useEffect(() => {
    let active = true;
    fetchResult()
      .then((data) => {
        if (active) {
          setError(null);
          setResult(data);
        }
      })
      .catch((err: unknown) => {
        if (active) setError(getApiErrorMessage(err, 'Could not load interview results.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [fetchResult]);

  const retry = () => {
    setLoading(true);
    fetchResult()
      .then((data) => {
        setError(null);
        setResult(data);
      })
      .catch((err: unknown) => {
        setError(getApiErrorMessage(err, 'Could not load interview results.'));
      })
      .finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F3]">
        <Navbar />
        <main className="max-w-4xl mx-auto px-6 pt-24 pb-16">
          <LoadingSpinner message="Loading your results..." />
        </main>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-[#FAF8F3]">
        <Navbar />
        <main className="max-w-4xl mx-auto px-6 pt-24 pb-16">
          <ErrorState message={error || 'Results not found.'} onRetry={retry} />
        </main>
      </div>
    );
  }

  const answeredQuestions = result.questions.filter((q) => q.answer !== null);
  const avgScore = answeredQuestions.length > 0
    ? answeredQuestions.reduce((s, q) => s + (q.score ?? 0), 0) / answeredQuestions.length
    : null;

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 pt-24 pb-16">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-[#777B73] hover:text-[#282A27] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <div className="bg-[#174D3A] rounded-3xl p-8 mb-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge label={result.interview_type} variant="sage" />
                <Badge label={result.difficulty} variant="neutral" />
              </div>
              <h1 className="text-2xl font-bold mb-1">{result.job_role}</h1>
              <div className="flex items-center gap-4 text-[#a8c5b5] text-sm">
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4" />
                  {result.experience_level}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {formatDateTime(result.created_at)}
                </div>
              </div>
            </div>
            {avgScore !== null && (
              <div className="bg-white/20 rounded-2xl px-8 py-5 text-center flex-shrink-0">
                <p className="text-[#a8c5b5] text-xs mb-1">Overall Score</p>
                <p className="text-5xl font-bold">{avgScore.toFixed(1)}</p>
                <p className="text-[#a8c5b5] text-sm">/ 10</p>
              </div>
            )}
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="p-5 text-center">
            <p className="text-2xl font-bold text-[#282A27]">{result.num_questions}</p>
            <p className="text-xs text-[#777B73] font-medium mt-1">Questions Total</p>
          </Card>
          <Card className="p-5 text-center">
            <p className="text-2xl font-bold text-[#2E8B68]">{answeredQuestions.length}</p>
            <p className="text-xs text-[#777B73] font-medium mt-1">Answered</p>
          </Card>
          <Card className="p-5 text-center">
            <p className="text-2xl font-bold text-[#5b4b8a]">
              {avgScore !== null ? avgScore.toFixed(1) : '—'}
            </p>
            <p className="text-xs text-[#777B73] font-medium mt-1">Avg Score / 10</p>
          </Card>
        </div>

        {/* Per-question breakdown */}
        <div className="space-y-5">
          <h2 className="font-bold text-[#282A27] text-lg">Question Breakdown</h2>
          {result.questions.map((q) => (
            <Card key={q.id} className="p-6">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-[#174D3A] rounded-md flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{q.question_number}</span>
                    </div>
                    <span className="text-xs text-[#777B73] font-medium">Question {q.question_number}</span>
                  </div>
                  <p className="text-base font-semibold text-[#282A27] leading-relaxed">{q.question_text}</p>
                </div>
                {q.score !== null && (
                  <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center font-bold ${
                    q.score >= 8 ? 'bg-[#E4F0E8] text-[#174D3A]' :
                    q.score >= 5 ? 'bg-[#EAE5F7] text-[#5b4b8a]' :
                    'bg-[#fde8e4] text-[#c0624e]'
                  }`}>
                    <span className="text-lg">{q.score}</span>
                    <span className="text-xs opacity-70">/10</span>
                  </div>
                )}
              </div>

              {q.answer ? (
                <div className="space-y-4">
                  {/* Your answer */}
                  <div className="bg-[#FAF8F3] rounded-xl p-4 border border-[#E8E6DF]">
                    <p className="text-xs font-semibold text-[#777B73] mb-2">Your Answer</p>
                    <p className="text-sm text-[#282A27] leading-relaxed">{q.answer}</p>
                  </div>

                  {/* Feedback */}
                  {q.feedback && (
                    <p className="text-sm text-[#282A27] leading-relaxed px-1">{q.feedback}</p>
                  )}

                  {/* Strengths / Improvements */}
                  {(q.strengths || q.improvements) && (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {q.strengths && (
                        <div className="bg-[#E4F0E8] rounded-xl p-4 border border-[#c8e0ce]">
                          <p className="text-xs font-bold text-[#174D3A] mb-2">✓ Strengths</p>
                          <p className="text-xs text-[#282A27] leading-relaxed">{q.strengths}</p>
                        </div>
                      )}
                      {q.improvements && (
                        <div className="bg-[#fde8e4] rounded-xl p-4 border border-[#f5c4bb]">
                          <p className="text-xs font-bold text-[#c0624e] mb-2">⚡ Improvements</p>
                          <p className="text-xs text-[#282A27] leading-relaxed">{q.improvements}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Suggested answer */}
                  {q.suggested_answer && (
                    <div className="bg-[#EAE5F7]/60 rounded-xl p-4 border border-[#EAE5F7]">
                      <p className="text-xs font-bold text-[#5b4b8a] mb-2">✨ Suggested Answer</p>
                      <p className="text-xs text-[#282A27] leading-relaxed">{q.suggested_answer}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-[#FAF8F3] rounded-xl p-4 text-center">
                  <p className="text-sm text-[#777B73]">Not answered</p>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 justify-center mt-10">
          <Button onClick={() => navigate('/interview/setup')} size="lg">
            Start Another Interview
          </Button>
          <Button onClick={() => navigate('/history')} variant="outline" size="lg">
            View History
          </Button>
          <Button onClick={() => navigate('/dashboard')} variant="ghost" size="lg">
            Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Results;
