import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3, TrendingUp, Target, Brain, ArrowRight, Star,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { TooltipContentProps } from 'recharts';
import Navbar from '../components/Navbar';
import { Card, LoadingSpinner, ErrorState, EmptyState } from '../components/ui';
import { getApiErrorMessage, interviewApi } from '../services/api';
import type { AnalyticsData } from '../types';
import { formatChartDate } from '../utils/date';

const TEXT_COLORS = {
  Technical: '#5b4b8a',
  HR: '#174D3A',
  Behavioral: '#c0624e',
  Mixed: '#777B73',
};

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: TooltipContentProps) => {
  const score = payload?.[0]?.value;
  if (!active || typeof score !== 'number') return null;

  return (
    <div className="bg-white border border-[#E8E6DF] rounded-xl px-4 py-3 shadow-lg text-xs">
      <p className="font-semibold text-[#282A27]">{label}</p>
      <p className="text-[#2E8B68] mt-0.5">Score: {score}</p>
    </div>
  );
};

const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(() => interviewApi.getAnalytics(), []);

  useEffect(() => {
    let active = true;
    fetchAnalytics()
      .then((result) => {
        if (active) {
          setError(null);
          setData(result);
        }
      })
      .catch((err: unknown) => {
        if (active) setError(getApiErrorMessage(err, 'Could not load your analytics.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [fetchAnalytics]);

  const retry = () => {
    setLoading(true);
    fetchAnalytics()
      .then((result) => {
        setError(null);
        setData(result);
      })
      .catch((err: unknown) => {
        setError(getApiErrorMessage(err, 'Could not load your analytics.'));
      })
      .finally(() => setLoading(false));
  };

  const chartData = data?.score_trend.map((d) => ({
    date: formatChartDate(d.date),
    score: d.score,
  })) ?? [];

  const typeData = data
    ? Object.entries(data.interviews_by_type).map(([type, count]) => ({ type, count }))
    : [];

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 pt-24 pb-16">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-[#282A27] mb-2">Performance Analytics</h1>
            <p className="text-[#777B73]">Track your progress and identify areas to focus on.</p>
          </div>
          <Link
            to="/interview/setup"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#2E8B68] hover:text-[#174D3A] transition-colors"
          >
            Practice now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading your analytics..." />
        ) : error ? (
          <ErrorState message={error} onRetry={retry} />
        ) : !data || data.total_interviews === 0 ? (
          <EmptyState
            icon={<BarChart3 className="w-7 h-7" />}
            title="No data yet"
            description="Complete a few interviews to see your analytics and performance trends."
            action={
              <Link to="/interview/setup" className="text-sm font-semibold text-[#2E8B68] hover:text-[#174D3A] transition-colors">
                Start your first interview →
              </Link>
            }
          />
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="p-5">
                <div className="w-10 h-10 bg-[#E4F0E8] rounded-xl flex items-center justify-center mb-3">
                  <BarChart3 className="w-5 h-5 text-[#174D3A]" />
                </div>
                <p className="text-2xl font-bold text-[#282A27]">{data.total_interviews}</p>
                <p className="text-xs text-[#777B73] font-medium mt-1">Total Interviews</p>
              </Card>

              <Card className="p-5">
                <div className="w-10 h-10 bg-[#EAE5F7] rounded-xl flex items-center justify-center mb-3">
                  <Star className="w-5 h-5 text-[#5b4b8a]" />
                </div>
                <p className="text-2xl font-bold text-[#282A27]">
                  {data.average_score !== null ? data.average_score : '—'}
                </p>
                <p className="text-xs text-[#777B73] font-medium mt-1">Average Score / 10</p>
              </Card>

              <Card className="p-5">
                <div className="w-10 h-10 bg-[#fde8e4] rounded-xl flex items-center justify-center mb-3">
                  <TrendingUp className="w-5 h-5 text-[#c0624e]" />
                </div>
                <p className="text-2xl font-bold text-[#282A27]">
                  {chartData.length >= 2
                    ? (() => {
                        const diff = chartData[chartData.length - 1].score - chartData[chartData.length - 2].score;
                        return diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
                      })()
                    : '—'}
                </p>
                <p className="text-xs text-[#777B73] font-medium mt-1">Recent Trend</p>
              </Card>

              <Card className="p-5">
                <div className="w-10 h-10 bg-[#E4F0E8] rounded-xl flex items-center justify-center mb-3">
                  <Target className="w-5 h-5 text-[#174D3A]" />
                </div>
                <p className="text-2xl font-bold text-[#282A27]">
                  {Object.keys(data.interviews_by_type).length}
                </p>
                <p className="text-xs text-[#777B73] font-medium mt-1">Types Practiced</p>
              </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">

              {/* Score Trend Chart */}
              <Card className="lg:col-span-2 p-6">
                <h2 className="font-bold text-[#282A27] mb-1">Score Trend</h2>
                <p className="text-xs text-[#777B73] mb-5">Your last {chartData.length} sessions</p>
                {chartData.length < 2 ? (
                  <div className="h-52 flex items-center justify-center">
                    <p className="text-sm text-[#777B73] text-center">
                      Complete at least 2 interviews to see your trend.
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE6" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: '#777B73' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 10]}
                        tick={{ fontSize: 11, fill: '#777B73' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={CustomTooltip} />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#174D3A"
                        strokeWidth={2.5}
                        dot={{ fill: '#174D3A', r: 4, strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: '#2E8B68' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Card>

              {/* Type breakdown */}
              <div className="space-y-5">
                <Card className="p-5">
                  <h2 className="font-bold text-[#282A27] mb-4 text-sm">By Interview Type</h2>
                  {typeData.length === 0 ? (
                    <p className="text-sm text-[#777B73]">No completed interviews yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {typeData.map(({ type, count }) => (
                        <div key={type} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: TEXT_COLORS[type as keyof typeof TEXT_COLORS] ?? '#777B73' }}
                            />
                            <span className="text-sm text-[#282A27]">{type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-[#E8E6DF] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${(count / data.total_interviews) * 100}%`,
                                  backgroundColor: TEXT_COLORS[type as keyof typeof TEXT_COLORS] ?? '#174D3A',
                                }}
                              />
                            </div>
                            <span className="text-xs font-medium text-[#777B73] w-4">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Improvement areas */}
                {data.common_improvement_areas.length > 0 && (
                  <Card className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Brain className="w-4 h-4 text-[#c0624e]" />
                      <h2 className="font-bold text-[#282A27] text-sm">Focus Areas</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {data.common_improvement_areas.map((area) => (
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
              </div>
            </div>

            {/* Session count chart */}
            {typeData.length > 0 && (
              <Card className="p-6 mt-6">
                <h2 className="font-bold text-[#282A27] mb-1">Sessions by Type</h2>
                <p className="text-xs text-[#777B73] mb-5">Distribution of your practice sessions</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={typeData} barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE6" />
                    <XAxis
                      dataKey="type"
                      tick={{ fontSize: 12, fill: '#777B73' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#777B73' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={({ active, payload, label }) =>
                      active && payload?.length ? (
                        <div className="bg-white border border-[#E8E6DF] rounded-xl px-4 py-3 shadow-lg text-xs">
                          <p className="font-semibold text-[#282A27]">{label}</p>
                          <p className="text-[#174D3A] mt-0.5">{payload[0].value} session{payload[0].value !== 1 ? 's' : ''}</p>
                        </div>
                      ) : null
                    } />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {typeData.map(({ type }) => (
                        <Cell
                          key={type}
                          fill={TEXT_COLORS[type as keyof typeof TEXT_COLORS] ?? '#174D3A'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Analytics;
