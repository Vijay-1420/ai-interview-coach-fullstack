import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, Briefcase } from 'lucide-react';
import Navbar from '../components/Navbar';
import { Card, Badge, LoadingSpinner, EmptyState, ErrorState } from '../components/ui';
import { getApiErrorMessage, interviewApi } from '../services/api';
import type { HistorySession } from '../types';
import { formatDate } from '../utils/date';

const History: React.FC = () => {
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');

  const fetchHistory = useCallback(() => interviewApi.getHistory(), []);

  useEffect(() => {
    let active = true;
    fetchHistory()
      .then((data) => {
        if (active) {
          setError(null);
          setSessions(data);
        }
      })
      .catch((err: unknown) => {
        if (active) setError(getApiErrorMessage(err, 'Could not load interview history.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [fetchHistory]);

  const retry = () => {
    setLoading(true);
    fetchHistory()
      .then((data) => {
        setError(null);
        setSessions(data);
      })
      .catch((err: unknown) => {
        setError(getApiErrorMessage(err, 'Could not load interview history.'));
      })
      .finally(() => setLoading(false));
  };

  const filtered = sessions.filter((s) => {
    const matchSearch =
      s.job_role.toLowerCase().includes(search.toLowerCase()) ||
      s.interview_type.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'All' || s.interview_type === filterType;
    return matchSearch && matchType;
  });

  const types = ['All', 'Technical', 'HR', 'Behavioral', 'Mixed'];

  const typeVariant = (type: string): 'sage' | 'lavender' | 'coral' | 'neutral' => {
    if (type === 'Technical') return 'lavender';
    if (type === 'HR') return 'sage';
    if (type === 'Behavioral') return 'coral';
    return 'neutral';
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-[#777B73]';
    if (score >= 7) return 'text-[#174D3A]';
    if (score >= 5) return 'text-[#d97706]';
    return 'text-[#c0624e]';
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 pt-24 pb-16">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-[#282A27] mb-2">Interview History</h1>
          <p className="text-[#777B73]">Review your past sessions, scores, and feedback.</p>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-7">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#777B73]" />
            <input
              type="text"
              placeholder="Search by role or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-[#E8E6DF] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#174D3A]/30 focus:border-[#174D3A] transition"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {types.map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  filterType === t
                    ? 'bg-[#174D3A] text-white border-[#174D3A]'
                    : 'bg-white text-[#777B73] border-[#E8E6DF] hover:border-[#174D3A] hover:text-[#174D3A]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <LoadingSpinner message="Loading your interview history..." />
        ) : error ? (
          <ErrorState message={error} onRetry={retry} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="w-7 h-7" />}
            title={sessions.length === 0 ? 'No interviews yet' : 'No results match your search'}
            description={
              sessions.length === 0
                ? 'Complete your first interview to see it here.'
                : 'Try a different search term or filter.'
            }
            action={
              sessions.length === 0 ? (
                <Link to="/interview/setup" className="text-sm font-semibold text-[#2E8B68] hover:text-[#174D3A] transition-colors">
                  Start practicing →
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-[#777B73] font-medium">{filtered.length} session{filtered.length !== 1 ? 's' : ''}</p>
            {filtered.map((session) => (
              <Link
                key={session.id}
                to={session.status === 'in_progress' ? `/interview/${session.id}` : `/results/${session.id}`}
              >
                <Card hover className="p-5 flex items-center justify-between gap-4 cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#FAF8F3] border border-[#E8E6DF] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-5 h-5 text-[#777B73]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#282A27] mb-1">{session.job_role}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge label={session.interview_type} variant={typeVariant(session.interview_type)} />
                        <Badge label={session.difficulty} variant="neutral" />
                        <span className="text-xs text-[#777B73]">{formatDate(session.created_at)}</span>
                        <span className="text-xs text-[#777B73]">· {session.num_questions} questions</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {session.total_score !== null ? (
                      <div className="text-right flex-shrink-0">
                        <p className={`text-2xl font-bold ${getScoreColor(session.total_score)}`}>
                          {session.total_score.toFixed(1)}
                        </p>
                        <p className="text-xs text-[#777B73]">/ 10</p>
                      </div>
                    ) : (
                      <span className="text-xs text-[#777B73] bg-[#FAF8F3] border border-[#E8E6DF] px-2.5 py-1 rounded-lg">
                        {session.status}
                      </span>
                    )}
                    <ArrowRight className="w-5 h-5 text-[#E8E6DF] group-hover:text-[#777B73] transition-colors flex-shrink-0" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default History;
