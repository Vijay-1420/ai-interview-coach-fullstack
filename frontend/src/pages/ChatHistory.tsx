import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MessageSquareText,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import { getApiErrorMessage, interviewApi } from '../services/api';
import type { ChatInterviewSummary } from '../types';
import { formatDateTime } from '../utils/date';

type HistoryFilter = 'all' | 'in_progress' | 'completed';

const ChatHistory = () => {
  const [sessions, setSessions] = useState<ChatInterviewSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<HistoryFilter>('all');

  useEffect(() => {
    let active = true;
    interviewApi.getChatInterviews()
      .then((result) => {
        if (active) setSessions(result);
      })
      .catch((requestError: unknown) => {
        if (active) setError(getApiErrorMessage(requestError, 'Could not load your chat history.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const refreshSessions = () => {
    setError(null);
    setLoading(true);
    interviewApi.getChatInterviews()
      .then(setSessions)
      .catch((requestError: unknown) => setError(getApiErrorMessage(requestError, 'Could not load your chat history.')))
      .finally(() => setLoading(false));
  };

  const visibleSessions = sessions.filter((session) => filter === 'all' || session.status === filter);
  const counts: Record<HistoryFilter, number> = {
    all: sessions.length,
    in_progress: sessions.filter((session) => session.status === 'in_progress').length,
    completed: sessions.filter((session) => session.status === 'completed').length,
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 pb-16 pt-28 sm:px-8">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#E4F0E8] px-3 py-1.5 text-xs font-semibold text-[#174D3A]">
              <MessageSquareText className="h-3.5 w-3.5" /> AI conversations
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#282A27] sm:text-4xl">Your chat history</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#777B73]">
              Pick up an active interview where you left off, or revisit a completed conversation and its review.
            </p>
          </div>
          <Link
            to="/interview/setup"
            className="inline-flex items-center gap-2 rounded-xl bg-[#174D3A] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(23,77,58,0.15)] transition hover:-translate-y-0.5 hover:bg-[#22664c]"
          >
            <Plus className="h-4 w-4" /> New interview
          </Link>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2 rounded-2xl border border-[#e8e6df] bg-white p-1.5">
            {([
              ['all', 'All sessions'],
              ['in_progress', 'In progress'],
              ['completed', 'Completed'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                  filter === value ? 'bg-[#174D3A] text-white shadow-sm' : 'text-[#777B73] hover:bg-[#f5f6f2]'
                }`}
              >
                {label}<span className="ml-1.5 opacity-70">{counts[value]}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={refreshSessions}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[#657166] transition hover:bg-white hover:text-[#174D3A] disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {error && (
          <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#f0d5ce] bg-[#fff5f2] px-5 py-4 text-sm text-[#a54837]">
            <p>{error}</p>
            <Button size="sm" variant="outline" onClick={refreshSessions}>Try again</Button>
          </div>
        )}

        {loading && sessions.length === 0 ? (
          <div className="flex justify-center rounded-3xl border border-[#e8e6df] bg-white py-20">
            <LoaderCircle className="h-8 w-8 animate-spin text-[#174D3A]" />
          </div>
        ) : !error && visibleSessions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#dcded6] bg-white/70 px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf3eb] text-[#174D3A]">
              {filter === 'completed' ? <CheckCircle2 className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
            </div>
            <h2 className="mt-4 text-lg font-bold text-[#282A27]">
              {filter === 'all' ? 'Your next conversation starts here' : `No ${filter === 'in_progress' ? 'active' : 'completed'} chats yet`}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#777B73]">
              {filter === 'all'
                ? 'Start a one-on-one conversation with your AI interviewer. Your transcript is saved automatically.'
                : 'Try another filter, or start a new conversation whenever you are ready.'}
            </p>
            <Link to="/interview/setup" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#174D3A] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#22664c]">
              <Plus className="h-4 w-4" /> Start an AI conversation
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {visibleSessions.map((session, index) => {
              const active = session.status === 'in_progress';
              const completed = session.status === 'completed';
              return (
                <Link
                  key={session.id}
                  to={`/chat-interview/${session.id}`}
                  className="feature-card group rounded-3xl border border-[#e7e9e2] bg-white p-5 shadow-[0_8px_30px_rgba(28,45,35,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[#a7c7ad] hover:shadow-[0_18px_45px_rgba(28,45,35,0.09)] sm:p-6"
                  style={{ animationDelay: `${Math.min(index * 55, 330)}ms` }}
                >
                  <div className="relative z-10 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eaf3eb] text-[#174D3A] transition group-hover:scale-105">
                        {completed ? <CheckCircle2 className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                      </span>
                      <div className="min-w-0">
                        <h2 className="truncate font-bold text-[#282A27]">{session.job_role}</h2>
                        <p className="mt-0.5 text-xs text-[#81877e]">{session.interview_type} interview · {session.difficulty}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                      active ? 'bg-[#eaf3eb] text-[#327151]' : completed ? 'bg-[#f2effa] text-[#675593]' : 'bg-[#f3f3f0] text-[#777B73]'
                    }`}>
                      {active ? 'In progress' : completed ? 'Completed' : 'Archived'}
                    </span>
                  </div>
                  <div className="relative z-10 mt-5 flex items-center justify-between border-t border-[#f0f1ec] pt-4">
                    <div className="flex items-center gap-1.5 text-xs text-[#858a81]">
                      <Clock3 className="h-3.5 w-3.5" /> {formatDateTime(session.created_at)}
                    </div>
                    <div className="flex items-center gap-3">
                      {session.overall_score !== null && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#174D3A]">
                          <Sparkles className="h-3.5 w-3.5" /> {session.overall_score.toFixed(1)}/10
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2E8B68] transition group-hover:gap-2">
                        {active ? 'Continue' : 'Review'} <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default ChatHistory;
