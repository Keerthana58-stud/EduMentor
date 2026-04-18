import React, { useState, useEffect } from 'react';
import { Card, SectionHeader, RiskBadge, LoadingSpinner } from '../../components/UIComponents';
import { AlertTriangle, TrendingDown } from 'lucide-react';
import api from '../../api/client';

export default function RiskAnalysis() {
  const [riskStudents, setRiskStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/risk-students').then(res => { 
      setRiskStudents(res.data); 
      setLoading(false); 
    });
  }, []);

  const high = riskStudents.filter(s => s.risk_level === 'high');
  const medium = riskStudents.filter(s => s.risk_level === 'medium');

  if (loading) return <div className="p-8"><LoadingSpinner /></div>;

  return (
    <div className="p-8">
      <SectionHeader title="Risk Analysis" subtitle="Students flagged based on performance metrics" />

      {/* Summary Badges */}
      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-sm font-semibold text-red-700">{high.length} High Risk</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
          <TrendingDown className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-semibold text-amber-700">{medium.length} Medium Risk</span>
        </div>
      </div>

      {riskStudents.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="font-semibold text-gray-900 mb-1">No At-Risk Students</h3>
          <p className="text-gray-500 text-sm">All students are performing well!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {riskStudents.map((s, i) => (
            <Card key={i} className={`p-5 border-l-4 ${s.risk_level === 'high' ? 'border-red-500' : 'border-amber-500'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold uppercase text-white ${s.risk_level === 'high' ? 'bg-red-500' : 'bg-amber-500'}`}>
                    {(s.username || s.full_name || 'U')[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{s.username || s.full_name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{s.email}</p>
                  </div>
                </div>
                <RiskBadge level={s.risk_level} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Avg Score</span>
                  <span className={`font-bold ${s.overall_average < 40 ? 'text-red-600' : 'text-amber-600'}`}>
                    {s.overall_average?.toFixed(1) ?? 0}%
                  </span>
                </div>
                {s.weak_subjects?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Weak Subjects:</p>
                    <div className="flex flex-wrap gap-1">
                      {s.weak_subjects.map(sub => (
                        <span key={sub} className="px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-xs">{sub}</span>
                      ))}
                    </div>
                  </div>
                )}
                {s.performance_summary && (
                  <p className="text-xs text-gray-400 italic mt-2 line-clamp-2">{s.performance_summary}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
