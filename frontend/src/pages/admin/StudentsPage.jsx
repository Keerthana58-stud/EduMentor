import React, { useState, useEffect } from 'react';
import { Card, SectionHeader, RiskBadge, LoadingSpinner } from '../../components/UIComponents';
import api from '../../api/client';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/students').then(res => { 
      setStudents(res.data); 
      setLoading(false); 
    });
  }, []);

  const filtered = (students || []).filter(s =>
    (s.username || s.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-8"><LoadingSpinner /></div>;

  return (
    <div className="p-8">
      <SectionHeader title="All Students" subtitle={`${students.length} students registered`} />
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <input type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="input-field max-w-sm" />
        </div>
        {filtered.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-12">No students found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Topic</th>
                  <th className="px-6 py-3">Avg Score</th>
                  <th className="px-6 py-3">Risk</th>
                  <th className="px-6 py-3">Weak Subjects</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((s, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center text-sm font-bold uppercase shrink-0">
                          {s.username?.[0]}
                        </div>
                        <span className="font-semibold text-gray-900 text-sm">{s.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{s.email}</td>
                    <td className="px-6 py-4 text-sm text-primary-600 font-medium">{s.assigned_topic || 'No topic assigned'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-bold ${s.overall_average >= 75 ? 'text-emerald-600' : s.overall_average >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                        {s.overall_average?.toFixed(1) ?? 0}%
                      </span>
                    </td>
                    <td className="px-6 py-4"><RiskBadge level={s.risk_level} /></td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {s.weak_subjects?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {s.weak_subjects.map(sub => (
                            <span key={sub} className="px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-xs font-medium">{sub}</span>
                          ))}
                        </div>
                      ) : <span className="text-emerald-500 text-xs font-medium">No weak areas</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => window.location.href = `/admin/student/${s.id || s._id}`}
                        className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline"
                      >
                        View Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
