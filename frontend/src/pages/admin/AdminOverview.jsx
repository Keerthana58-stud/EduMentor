import React, { useState, useEffect } from 'react';
import { Users, ClipboardList, CheckCircle, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { StatCard, Card, SectionHeader, LoadingSpinner } from '../../components/UIComponents';
import { RiskBadge } from '../../components/UIComponents';
import api from '../../api/client';

export default function AdminOverview() {
  const [overview, setOverview] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, studentsRes] = await Promise.all([
          api.get('/admin/overview'),
          api.get('/admin/students')
        ]);
        if (overviewRes && overviewRes.data) setOverview(overviewRes.data);
        if (studentsRes && Array.isArray(studentsRes.data)) {
          setStudents(studentsRes.data.slice(0, 6));
        } else {
          setStudents([]);
        }
      } catch (err) {
        console.error('ADMIN_OVERVIEW: Failed to load overview', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-8"><LoadingSpinner /></div>;

  return (
    <div className="p-8">
      <SectionHeader
        title="Dashboard Overview"
        subtitle="Monitor your students' academic performance at a glance"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        <StatCard icon={Users} label="Total Students" value={overview?.total_students ?? 0} color="blue" />
        <StatCard icon={ClipboardList} label="Total Quizzes" value={overview?.total_quizzes ?? 0} color="purple" />
        <StatCard icon={CheckCircle} label="Completed" value={overview?.completed_quizzes ?? 0} color="green" />
        <StatCard icon={Clock} label="Pending" value={overview?.pending_quizzes ?? 0} color="amber" />
        <StatCard icon={AlertTriangle} label="At-Risk Students" value={overview?.at_risk_students ?? 0} color="red" />
      </div>

      {/* Recent Students */}
      <Card className="p-6">
        <SectionHeader title="Recent Students" subtitle="Latest registered students" />
        {students.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No students registered yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="pb-3 pr-4">Student</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4">Avg Score</th>
                  <th className="pb-3 pr-4">Risk Level</th>
                  <th className="pb-3">Weak Subjects</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((s, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold uppercase">
                          {(s.username || s.full_name || 'U')[0]}
                        </div>
                        <span className="font-medium text-gray-900 text-sm">{s.username || s.full_name || 'Unknown User'}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-500">{s.email}</td>
                    <td className="py-3 pr-4 text-sm font-semibold text-gray-700">{((s.overall_average) ?? 0).toFixed(1)}%</td>
                    <td className="py-3 pr-4"><RiskBadge level={s.risk_level} /></td>
                    <td className="py-3 text-sm text-gray-500">
                      {s.weak_subjects?.length > 0 ? s.weak_subjects.join(', ') : <span className="text-emerald-500">None</span>}
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
