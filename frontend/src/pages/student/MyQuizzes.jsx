import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, SectionHeader, LoadingSpinner } from '../../components/UIComponents';
import { ClipboardList, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import api from '../../api/client';

export default function MyQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetch = async () => {
      try {
        const meRes = await api.get('/auth/me');
        const sid = meRes.data._id?.$oid || meRes.data._id || meRes.data.id;
        const [qRes, aRes] = await Promise.all([
          api.get(`/quiz/student/${sid}`),
          api.get(`/student/dashboard/${sid}`)
        ]);
        setQuizzes(qRes.data || []);
        setAttempts(aRes.data?.attempts || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div className="p-8"><LoadingSpinner /></div>;

  const completedMap = {};
  attempts.forEach(a => { completedMap[a.quiz_id] = a; });

  const tabs = ['all', 'pending', 'completed'];

  const filtered = quizzes.filter(q => {
    const qid = q._id?.$oid || q._id;
    const done = !!completedMap[qid];
    if (activeTab === 'pending') return !done;
    if (activeTab === 'completed') return done;
    return true;
  });

  return (
    <div className="p-8">
      <SectionHeader title="My Quizzes" subtitle="All quizzes assigned to you" />

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-white rounded-xl p-1.5 shadow-sm border border-gray-100 w-fit">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all duration-150 ${activeTab === tab ? 'bg-primary-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">No quizzes in this category yet.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((q, i) => {
            const qid = q._id?.$oid || q._id;
            const attempt = completedMap[qid];
            const isDone = !!attempt;
            const deadline = q.deadline ? new Date(q.deadline) : null;
            const isOverdue = deadline && deadline < new Date() && !isDone;
            const pct = attempt ? Math.round((attempt.score / attempt.total) * 100) : null;

            return (
              <Card key={i} className="p-5 flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 mr-3">
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug">{q.title || q.topic}</h3>
                    <p className="text-xs text-gray-400 mt-1">{q.subject} — {q.topic}</p>
                  </div>
                  {isDone ? (
                    <span className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-1 rounded-full font-medium shrink-0">
                      <CheckCircle className="w-3.5 h-3.5" />Done
                    </span>
                  ) : isOverdue ? (
                    <span className="flex items-center gap-1 text-xs bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-full font-medium shrink-0">
                      <AlertCircle className="w-3.5 h-3.5" />Overdue
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-1 rounded-full font-medium shrink-0">
                      <Clock className="w-3.5 h-3.5" />Pending
                    </span>
                  )}
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${q.difficulty === 'hard' ? 'bg-red-50 text-red-600' : q.difficulty === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {q.difficulty}
                  </span>
                  <span className="text-xs text-gray-400">{q.number_of_questions} Questions</span>
                  {deadline && <span className={`text-xs ml-auto ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>Due {deadline.toLocaleDateString()}</span>}
                </div>

                {/* Score or Action */}
                {isDone ? (
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Your Score</span>
                      <span className="font-semibold text-gray-800">{attempt.score}/{attempt.total} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <Link to={`/quiz/${qid}`}
                    className="btn-primary text-center text-sm w-full py-2.5">
                    Start Quiz →
                  </Link>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
