import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  TrendingUp,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Briefcase,
  Star,
  Code2,
  Users,
  Brain,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { Card, SkeletonCard, EmptyState, Badge } from '../components/ui';
import { getApiErrorMessage, interviewApi } from '../services/api';
import { formatDate } from '../utils/date';
import type { HistorySession, AnalyticsData } from '../types';

const Dashboard: React.FC = () => {
  const [history, setHistory] = useState<HistorySession[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [h, a] = await Promise.all([
          interviewApi.getHistory(),
          interviewApi.getAnalytics(),
        ]);
        setHistory(h);
        setAnalytics(a);
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, 'Could not load your dashboard.'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-[#777B73]';
    if (score >= 7) return 'text-[#174D3A]';
    if (score >= 5) return 'text-[#d97706]';
    return 'text-[#c0624e]';
  };

  const typeVariant = (type: string): 'sage' | 'lavender' | 'coral' | 'neutral' => {
    if (type === 'Technical') return 'lavender';
    if (type === 'HR') return 'sage';
    if (type === 'Behavioral') return 'coral';
    return 'neutral';
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 pt-24 pb-16">

        {/* Welcome */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-[#282A27] mb-1">
              Ready to become interview-ready?
            </h1>
            <p className="text-[#777B73]">
              {analytics && analytics.total_interviews > 0
                ? `You've completed ${analytics.total_interviews} interview${analytics.total_interviews !== 1 ? 's' : ''}. Keep going!`
                : 'Start your first practice session to build confidence and track your progress.'}
            </p>
          </div>
          <Link
            to="/interview/setup"
            className="inline-flex items-center gap-2 bg-[#174D3A] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#2E8B68] transition-colors shadow-sm text-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Start New Interview
          </Link>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <Card className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-[#E4F0E8] rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-[#174D3A]" />
                </div>
              </div>
              <p className="text-3xl font-bold text-[#282A27] mb-1">{analytics?.total_interviews ?? 0}</p>
              <p className="text-xs text-[#777B73] font-medium">Interviews Completed</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-[#EAE5F7] rounded-xl flex items-center justify-center">
                  <Star className="w-5 h-5 text-[#5b4b8a]" />
                </div>
              </div>
              <p className="text-3xl font-bold text-[#282A27] mb-1">
                {analytics?.average_score ? analytics.average_score.toFixed(1) : '—'}
              </p>
              <p className="text-xs text-[#777B73] font-medium">Average Score / 10</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-[#fde8e4] rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[#c0624e]" />
                </div>
              </div>
              <p className="text-3xl font-bold text-[#282A27] mb-1">
                {analytics && analytics.score_trend.length >= 2
                  ? (() => {
                      const trend = analytics.score_trend;
                      const diff = trend[trend.length - 1].score - trend[trend.length - 2].score;
                      return diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
                    })()
                  : '—'}
              </p>
              <p className="text-xs text-[#777B73] font-medium">Recent Score Trend</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-[#E4F0E8] rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-[#174D3A]" />
                </div>
              </div>
              <p className="text-3xl font-bold text-[#282A27] mb-1">
                {analytics ? Object.keys(analytics.interviews_by_type).length : 0}
              </p>
              <p className="text-xs text-[#777B73] font-medium">Interview Types Practiced</p>
            </Card>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">

          {/* Recent Sessions */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-[#282A27]">Recent Sessions</h2>
                <Link to="/history" className="text-xs text-[#2E8B68] font-semibold hover:text-[#174D3A] transition-colors flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-14 bg-[#FAF8F3] rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : history.length === 0 ? (
                <EmptyState
                  icon={<Briefcase className="w-7 h-7" />}
                  title="No interviews yet"
                  description="Complete your first interview to see it here."
                  action={
                    <Link to="/interview/setup" className="text-sm font-semibold text-[#2E8B68] hover:text-[#174D3A] transition-colors">
                      Start practicing →
                    </Link>
                  }
                />
              ) : (
                <div className="space-y-3">
                  {history.slice(0, 5).map((session) => (
                    <Link
                      key={session.id}
                      to={session.status === 'in_progress' ? `/interview/${session.id}` : `/results/${session.id}`}
                      className="flex items-center justify-between p-4 rounded-xl bg-[#FAF8F3] hover:bg-[#F0EDE6] transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-white rounded-lg border border-[#E8E6DF] flex items-center justify-center">
                          <Briefcase className="w-4 h-4 text-[#777B73]" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#282A27]">{session.job_role}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge label={session.interview_type} variant={typeVariant(session.interview_type)} />
                            <span className="text-xs text-[#777B73]">{formatDate(session.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {session.total_score !== null && (
                          <div className="text-right">
                            <p className={`text-lg font-bold ${getScoreColor(session.total_score)}`}>
                              {session.total_score.toFixed(1)}
                            </p>
                            <p className="text-xs text-[#777B73]">/ 10</p>
                          </div>
                        )}
                        <ArrowRight className="w-4 h-4 text-[#E8E6DF] group-hover:text-[#777B73] transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Quick Start */}
            <Card className="p-5">
              <h3 className="font-bold text-[#282A27] mb-4 text-sm">Quick Practice</h3>
              <div className="space-y-2">
                {[
                  { label: 'Technical Interview', icon: <Code2 className="w-4 h-4" />, type: 'Technical', color: 'text-[#5b4b8a] bg-[#EAE5F7]' },
                  { label: 'Behavioral Interview', icon: <Brain className="w-4 h-4" />, type: 'Behavioral', color: 'text-[#c0624e] bg-[#fde8e4]' },
                  { label: 'HR Interview', icon: <Users className="w-4 h-4" />, type: 'HR', color: 'text-[#174D3A] bg-[#E4F0E8]' },
                ].map((item) => (
                  <Link
                    key={item.type}
                    to={`/interview/setup?type=${item.type}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#FAF8F3] transition-colors group"
                  >
                    <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center flex-shrink-0`}>
                      {item.icon}
                    </div>
                    <span className="text-sm font-medium text-[#282A27]">{item.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#E8E6DF] group-hover:text-[#777B73] ml-auto transition-colors" />
                  </Link>
                ))}
              </div>
            </Card>

            {/* Improvement areas */}
            {analytics && analytics.common_improvement_areas.length > 0 && (
              <Card className="p-5">
                <h3 className="font-bold text-[#282A27] mb-4 text-sm">Areas to Improve</h3>
                <div className="flex flex-wrap gap-2">
                  {analytics.common_improvement_areas.slice(0, 6).map((area) => (
                    <span
                      key={area}
                      className="text-xs bg-[#fde8e4] text-[#c0624e] px-2.5 py-1 rounded-lg font-medium capitalize"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* View analytics CTA */}
            <Link to="/analytics" className="block">
              <Card hover className="p-5 border-dashed border-[#E8E6DF] hover:border-[#2E8B68] transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#E4F0E8] rounded-xl flex items-center justify-center group-hover:bg-[#174D3A] transition-colors">
                    <BarChart3 className="w-5 h-5 text-[#174D3A] group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#282A27]">View Analytics</p>
                    <p className="text-xs text-[#777B73]">Track your performance trends</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#E8E6DF] group-hover:text-[#777B73] ml-auto transition-colors" />
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mt-6 p-4 bg-[#fde8e4] border border-[#E98B78] rounded-xl text-sm text-[#c0624e]">
            <strong>Backend connection issue:</strong> {error}. Make sure the FastAPI server is running on port 8000.
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
