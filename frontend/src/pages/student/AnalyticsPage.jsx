import React, { useState, useEffect } from 'react';
import { Card, SectionHeader, RiskBadge, LoadingSpinner } from '../../components/UIComponents';
import { Sparkles, TrendingUp, TrendingDown } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import api from '../../api/client';

const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const meRes = await api.get('/auth/me');
        const sid = meRes.data._id?.$oid || meRes.data._id || meRes.data.id;
        const [analyticsRes, dashRes] = await Promise.all([
          api.get(`/student/analytics/${sid}`),
          api.get(`/student/dashboard/${sid}`)
        ]);
        setAnalytics(analyticsRes.data);
        setSummary(dashRes.data?.ai_summary || '');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div className="p-8"><LoadingSpinner /></div>;

  const subjectData = analytics?.subject_wise_average
    ? Object.entries(analytics.subject_wise_average).map(([name, value]) => ({
        name, value: parseFloat(value.toFixed(1))
      }))
    : [];

  const radarData = subjectData.map(d => ({ subject: d.name, score: d.value }));

  return (
    <div className="p-8">
      <SectionHeader title="Performance Analytics" subtitle="Your academic progress across subjects" />

      {/* Overall + Risk */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-primary-600 to-blue-700 text-white rounded-2xl p-6 shadow-lg shadow-primary-500/20 col-span-1">
          <p className="text-primary-100 text-sm">Overall Average</p>
          <p className="text-5xl font-extrabold my-2">{analytics?.overall_average?.toFixed(1) ?? 0}<span className="text-2xl">%</span></p>
          <RiskBadge level={analytics?.risk_level || 'low'} />
        </div>
        <div className="sm:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-gray-700">AI Performance Summary</h3>
          </div>
          {summary ? (
            <p className="text-gray-600 text-sm leading-relaxed">{summary}</p>
          ) : (
            <p className="text-gray-400 text-sm italic">Complete some quizzes to get your AI-generated summary.</p>
          )}
        </div>
      </div>

      {/* Charts */}
      {subjectData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Bar Chart */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-5">Subject-wise Scores</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={subjectData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip formatter={(v) => [`${v}%`]} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {subjectData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Radar Chart */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-5">Performance Radar</h3>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#f1f5f9" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Radar name="Score" dataKey="score" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      ) : (
        <Card className="p-12 text-center mb-6">
          <TrendingUp className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">No quiz data yet. Complete some quizzes to see charts.</p>
        </Card>
      )}

      {/* Weak Areas */}
      {analytics?.weak_subjects?.length > 0 && (
        <Card className="p-6 border-l-4 border-red-400">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <h3 className="font-semibold text-gray-900">Areas Needing Improvement</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {analytics.weak_subjects.map(sub => (
              <span key={sub} className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-medium">{sub}</span>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-3">Consider reviewing these subjects or asking the AI Mentor for help.</p>
        </Card>
      )}
    </div>
  );
}
